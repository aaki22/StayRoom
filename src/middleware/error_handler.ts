import type { ErrorRequestHandler } from 'express';
import type { Logger } from 'pino';

import {
  errorResponse,
} from '../models/response_builder.ts';

import {
  AppException,
} from '../utils/exceptions/exceptions.ts';

import {
  ERROR_CODES,
} from '../utils/exceptions/error_codes.ts';

export function createErrorHandler(
  logger: Logger,
): ErrorRequestHandler {
  return (
    error: unknown,
    _request,
    response,
    next,
  ) => {
    if (response.headersSent) {
      next(error);
      return;
    }

    if (
      error instanceof AppException &&
      error.statusCode >= 400 &&
      error.statusCode < 500
    ) {
      response.status(error.statusCode).json(
        errorResponse(
          error.statusCode,
          error.message,
          error.details,
        ),
      );

      return;
    }

    const type =
      typeof error === 'object' &&
      error !== null &&
      'type' in error
        ? error.type
        : undefined;

    const parserErrors: Record<
      string,
      {
        status: number;
        code: string;
        message: string;
      }
    > = {
      'entity.parse.failed': {
        status: 400,
        code: ERROR_CODES.INVALID_JSON,
        message: 'Invalid JSON body',
      },

      'entity.too.large': {
        status: 413,
        code: ERROR_CODES.PAYLOAD_TOO_LARGE,
        message: 'Request body is too large',
      },

      'charset.unsupported': {
        status: 415,
        code: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
        message: 'Unsupported charset',
      },

      'encoding.unsupported': {
        status: 415,
        code: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
        message: 'Unsupported encoding',
      },

      'request.aborted': {
        status: 400,
        code: ERROR_CODES.INVALID_PARAMETER,
        message: 'Request was aborted',
      },

      'request.size.invalid': {
        status: 400,
        code: ERROR_CODES.INVALID_PARAMETER,
        message: 'Invalid body size',
      },
    };

    const parserError =
      typeof type === 'string'
        ? parserErrors[type]
        : undefined;

    if (parserError) {
      const {
        status,
        code,
        message,
      } = parserError;

      response.status(status).json(
        errorResponse(
          status,
          message,
          [
            {
              field: 'body',
              code,
              message,
            },
          ],
        ),
      );

      return;
    }

    logger.error(
      {
        err:
          error instanceof Error
            ? error
            : new Error('Non-Error value thrown'),
      },
      'Request failed',
    );

    const status =
      error instanceof AppException
        ? error.statusCode
        : 500;

    const message =
      status === 503
        ? 'Service temporarily unavailable'
        : status === 502
          ? 'External service call failed'
          : 'An unexpected error occurred';

    const code =
      error instanceof AppException
        ? error.errorCode
        : ERROR_CODES.INTERNAL_ERROR;

    response.status(status).json(
      errorResponse(
        status,
        message,
        [
          {
            field: 'general',
            code,
            message,
          },
        ],
      ),
    );
  };
}