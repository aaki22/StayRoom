import type {
  ApiErrorDetailDTO,
} from '../../models/responses/response_models.ts';

import {
  ERROR_CODES,
  type ErrorCode,
} from './error_codes.ts';

export class AppException extends Error {
  public readonly details: [
    ApiErrorDetailDTO,
    ...ApiErrorDetailDTO[],
  ];

  public constructor(
    public readonly statusCode: number,
    public readonly errorCode: ErrorCode,
    message: string,
    field: string | null = 'general',
    details?: [ApiErrorDetailDTO, ...ApiErrorDetailDTO[]],
    options?: ErrorOptions,
  ) {
    super(message, options);

    this.name = new.target.name;

    this.details = details ?? [
      {
        field,
        code: errorCode,
        message,
      },
    ];

    Error.captureStackTrace(this, new.target);
  }
}

export class UnauthorizedError extends AppException {
  public constructor(
    message = 'Invalid or expired authentication token',
  ) {
    super(
      401,
      ERROR_CODES.UNAUTHORIZED,
      message,
      'Authorization',
    );
  }
}

export class ForbiddenError extends AppException {
  public constructor(message = 'Access denied') {
    super(
      403,
      ERROR_CODES.FORBIDDEN,
      message,
    );
  }
}

export class NotFoundError extends AppException {
  public constructor(
    message = 'Resource not found',
    code: ErrorCode = ERROR_CODES.NOT_FOUND,
  ) {
    super(404, code, message);
  }
}

export class ConflictError extends AppException {
  public constructor(
    message: string,
    code: ErrorCode = ERROR_CODES.CONFLICT,
  ) {
    super(409, code, message);
  }
}