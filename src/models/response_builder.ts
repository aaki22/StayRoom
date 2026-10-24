import type {
  ApiErrorDetailDTO,
  ApiErrorResponseDTO,
  ApiSuccessResponseDTO,
} from '../models/responses/response_models.ts';

import { requestContext } from '../utils/request_context.ts';

export function successResponse<T>(
  code: number,
  message: string,
  data: T | null,
): ApiSuccessResponseDTO<T> {
  if (
    !Number.isInteger(code) ||
    code < 200 ||
    code >= 300 ||
    code === 204 ||
    code === 205
  ) {
    throw new RangeError(
      'Use a JSON-bearing success status',
    );
  }

  return {
    status: 'success',
    code,
    message,
    data,
    errors: [],
    timestamp: new Date().toISOString(),
    request_id: requestContext.require().requestId,
  };
}

export function errorResponse(
  code: number,
  message: string,
  errors: [ApiErrorDetailDTO, ...ApiErrorDetailDTO[]],
): ApiErrorResponseDTO {
  if (
    !Number.isInteger(code) ||
    code < 400 ||
    code > 599
  ) {
    throw new RangeError('Invalid error HTTP status');
  }

  return {
    status: 'error',
    code,
    message,
    data: null,
    errors,
    timestamp: new Date().toISOString(),
    request_id: requestContext.require().requestId,
  };
}