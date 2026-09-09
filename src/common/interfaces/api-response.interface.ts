export interface SuccessResponse<T = unknown> {
  success: true;
  statusCode: number;
  message: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}

export interface ErrorItem {
  field: string | null;
  message: string;
}

export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: ErrorItem[];
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

export function ok<T = unknown>(
  statusCode: number,
  message: string,
  data?: T,
  meta?: SuccessResponse<T>["meta"],
): SuccessResponse<T> {
  return {
    success: true,
    statusCode,
    message,
    ...(data !== undefined ? { data } : {}),
    ...(meta ? { meta } : {}),
  };
}

