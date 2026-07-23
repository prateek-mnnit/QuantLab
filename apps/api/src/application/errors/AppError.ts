/**
 * Base class for every error the application deliberately throws (as
 * opposed to unexpected bugs/exceptions). The central error handler
 * middleware (see middleware/errorHandler.ts) checks `instanceof AppError`
 * to decide whether it's safe to send `message` straight to the client with
 * the right HTTP status - anything that isn't an AppError is treated as an
 * unexpected failure and reduced to a generic 500 so internal details never
 * leak to a client by accident.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;

  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly code = 'UNAUTHORIZED';
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';
}

export class ServiceUnavailableError extends AppError {
  readonly statusCode = 503;
  readonly code = 'SERVICE_UNAVAILABLE';
}
