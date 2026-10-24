export interface ApiErrorDetailDTO {
  field: string | null;
  code: string;
  message: string;
}

interface ResponseMetadata {
  code: number;
  message: string;
  timestamp: string;
  request_id: string;
}

export interface ApiSuccessResponseDTO<T>
  extends ResponseMetadata {
  status: 'success';
  data: T | null;
  errors: [];
}

export interface ApiErrorResponseDTO
  extends ResponseMetadata {
  status: 'error';
  data: null;
  errors: [ApiErrorDetailDTO, ...ApiErrorDetailDTO[]];
}

export type ApiResponseDTO<T> =
  | ApiSuccessResponseDTO<T>
  | ApiErrorResponseDTO;