import type { ApiErrorDetailDTO } from '../../models/responses/response_models.ts';
import { ERROR_CODES, type ErrorCode } from './error_codes.ts';

export class AppException extends Error {
  public readonly details: [ApiErrorDetailDTO, ...ApiErrorDetailDTO[]];

  public constructor(
    public readonly statusCode: number,
    public readonly errorCode: ErrorCode,
    message: string,
    field: string | null = null,
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

export class BadRequestError extends AppException {
  public constructor(
    message = 'Malformed JSON or invalid query combination',
    code: ErrorCode = ERROR_CODES.BAD_REQUEST,
    field: string | null = null,
  ) {
    super(400, code, message, field);
  }
}

export class UnauthorizedError extends AppException {
  public constructor(message = 'Invalid or expired authentication token', field: string | null = 'Authorization') {
    super(401, ERROR_CODES.UNAUTHORIZED, message, field);
  }
}

export class ForbiddenError extends AppException {
  public constructor(message = 'Access denied') {
    super(403, ERROR_CODES.FORBIDDEN, message);
  }
}

export class NotFoundError extends AppException {
  public constructor(message = 'Resource not found', code: ErrorCode = ERROR_CODES.NOT_FOUND) {
    super(404, code, message);
  }
}

export class ConflictError extends AppException {
  public constructor(message: string, code: ErrorCode = ERROR_CODES.CONFLICT, field: string | null = null) {
    super(409, code, message, field);
  }
}

export class TooManyRequestsError extends AppException {
  public constructor(
    public readonly retryAfterSeconds = 60,
    message = 'Too many requests',
  ) {
    super(429, ERROR_CODES.RATE_LIMITED, message);
  }
}

export class ExternalProviderError extends AppException {
  public constructor(message = 'External payment provider error', code: ErrorCode = ERROR_CODES.PROVIDER_ERROR) {
    super(502, code, message);
  }
}