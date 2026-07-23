/**
 * Standard envelope shapes for every HTTP response the API returns.
 *
 * Why this exists: without a shared contract, each endpoint tends to invent
 * its own response shape, which forces the frontend to write one-off parsing
 * logic per call. Defining these once here means api-client code on the
 * frontend can be generic over `ApiSuccessResponse<T>` /
 * `ApiErrorResponse`, and the backend's central error handler is the single
 * place responsible for producing `ApiErrorResponse` - no controller has to
 * think about error formatting itself.
 */

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    /** Machine-readable error code, e.g. "NOT_FOUND", "VALIDATION_ERROR". */
    code: string;
    /** Human-readable message, safe to show to an end user. */
    message: string;
    /** Optional structured detail, e.g. per-field validation errors. */
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Shared shape for every paginated list endpoint (strategies, backtests,
 * trades, ...). Keeping this generic and defined once avoids every list
 * endpoint reinventing its own pagination metadata field names.
 */
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}
