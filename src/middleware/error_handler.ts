import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { Logger } from 'pino';
import { errorResponse } from '../models/response_builder.ts';
import { ERROR_CODES } from '../utils/exceptions/error_codes.ts';
import { AppException, NotFoundError, TooManyRequestsError } from '../utils/exceptions/exceptions.ts';

export const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(new NotFoundError('Route not found'));
};

export function methodNotAllowedHandler(allowedMethods: readonly string[]): RequestHandler {
  const allowHeader = allowedMethods.join(', ');
  return (_request, response, next) => {
    response.setHeader('Allow', allowHeader);
    next(new AppException(405, ERROR_CODES.METHOD_NOT_ALLOWED, 'Method not allowed'));
  };
}

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, _request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }

    if (error instanceof TooManyRequestsError) {
      response.setHeader('Retry-After', String(error.retryAfterSeconds));
    }

    if (error instanceof AppException && error.statusCode >= 400 && error.statusCode < 500) {
      response.status(error.statusCode).json(errorResponse(error.statusCode, error.message, error.details));
      return;
    }

    const type = typeof error === 'object' && error !== null && 'type' in error ? error.type : undefined;
    const parserErrors: Record<
      string,
      {
        status: number;
        code: string;
        message: string;
        field: string | null;
      }
    > = {
      'entity.parse.failed': {
        status: 400,
        code: ERROR_CODES.BAD_REQUEST,
        message: 'Malformed JSON or invalid query combination',
        field: null,
      },
      'entity.too.large': {
        status: 413,
        code: ERROR_CODES.PAYLOAD_TOO_LARGE,
        message: 'Request body is too large',
        field: 'body',
      },
      'charset.unsupported': {
        status: 415,
        code: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
        message: 'Unsupported charset',
        field: 'Content-Type',
      },
      'encoding.unsupported': {
        status: 415,
        code: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
        message: 'Unsupported encoding',
        field: 'Content-Encoding',
      },
      'request.aborted': {
        status: 400,
        code: ERROR_CODES.BAD_REQUEST,
        message: 'Request was aborted',
        field: null,
      },
      'request.size.invalid': {
        status: 400,
        code: ERROR_CODES.BAD_REQUEST,
        message: 'Invalid body size',
        field: null,
      },
    };

    const parserError = typeof type === 'string' ? parserErrors[type] : undefined;
    if (parserError) {
      const { status, code, message, field } = parserError;
      response.status(status).json(
        errorResponse(status, message, [
          {
            field,
            code,
            message,
          },
        ]),
      );
      return;
    }

    logger.error(
      {
        err: error instanceof Error ? error : new Error('Non-Error value thrown'),
      },
      'Request failed',
    );

    const status = error instanceof AppException ? error.statusCode : 500;
    const message =
      status === 503
        ? 'Service temporarily unavailable'
        : status === 502
          ? 'External service call failed'
          : 'Unexpected server error';
    const code = error instanceof AppException ? error.errorCode : ERROR_CODES.INTERNAL_ERROR;

    response.status(status).json(
      errorResponse(status, message, [
        {
          field: null,
          code,
          message,
        },
      ]),
    );
  };
}