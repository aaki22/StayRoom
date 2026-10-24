import type { RequestHandler } from 'express';
import type { z } from 'zod';

import type {
  ApiErrorDetailDTO,
} from '../models/responses/response_models.ts';

import {
  AppException,
} from '../utils/exceptions/exceptions.ts';

import {
  ERROR_CODES,
} from '../utils/exceptions/error_codes.ts';

export function validateRequest(
  schema: z.ZodType,
): RequestHandler {
  return (
    request,
    response,
    next,
  ) => {
    const body: unknown = request.body;

    const result = schema.safeParse({
      body,
      params: request.params,
      query: request.query,
      headers: request.headers,
    });

    if (!result.success) {
      const errors: ApiErrorDetailDTO[] =
        result.error.issues.map((issue) => ({
          field:
            issue.path.map(String).join('.') ||
            'general',
          code: ERROR_CODES.VALIDATION_ERROR,
          message: issue.message,
        }));

      const [first, ...rest] = errors;

      next(
        new AppException(
          400,
          ERROR_CODES.VALIDATION_ERROR,
          'Request validation failed',
          'general',
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