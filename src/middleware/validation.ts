import type { RequestHandler, Response } from 'express';
import type { z } from 'zod';
import type { ApiErrorDetailDTO } from '../models/responses/response_models.ts';
import { ERROR_CODES } from '../utils/exceptions/error_codes.ts';
import { AppException } from '../utils/exceptions/exceptions.ts';

const ROOT_SEGMENTS = new Set(['body', 'params', 'query', 'headers']);

function formatIssueField(pathSegments: PropertyKey[]): string | null {
  const stringSegments = pathSegments.map(String);
  const firstSegment = stringSegments[0];
  if (!firstSegment) {
    return null;
  }
  if (ROOT_SEGMENTS.has(firstSegment)) {
    const nested = stringSegments.slice(1).join('.');
    return nested.length > 0 ? nested : firstSegment;
  }
  return stringSegments.join('.');
}

export function validateRequest(schema: z.ZodType): RequestHandler {
  return (request, response, next) => {
    const body: unknown = request.body;
    const result = schema.safeParse({
      body,
      params: request.params,
      query: request.query,
      headers: request.headers,
    });

    if (!result.success) {
      const errors: ApiErrorDetailDTO[] = result.error.issues.map((issue) => ({
        field: formatIssueField(issue.path),
        code: ERROR_CODES.VALIDATION_ERROR,
        message: issue.message,
      }));
      const [first, ...rest] = errors;
      next(
        new AppException(
          422,
          ERROR_CODES.VALIDATION_ERROR,
          'Request validation failed',
          first?.field ?? null,
          first ? [first, ...rest] : undefined,
        ),
      );
      return;
    }

    // Avoid assigning to Express 5's read-only request.query.
    response.locals['validated'] = result.data;
    next();
  };
}

export function getValidated<TSchema extends z.ZodType>(_schema: TSchema, response: Response): z.output<TSchema> {
  if (!('validated' in response.locals)) {
    throw new Error('Validated request payload missing. Ensure validateRequest middleware runs first.');
  }
  return response.locals['validated'] as z.output<TSchema>;
}