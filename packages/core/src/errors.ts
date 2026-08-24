/**
 * Typed application errors for consistent API responses.
 */

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PROVIDER_ERROR"
  | "CONFIGURATION_REQUIRED"
  | "INTERNAL";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, status = 500, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      ...(this.details !== undefined ? { details: this.details } : {}),
    };
  }
}

export function badRequest(message: string, details?: unknown) {
  return new AppError("BAD_REQUEST", message, 400, details);
}
export function notFound(message: string) {
  return new AppError("NOT_FOUND", message, 404);
}
export function configurationRequired(message: string) {
  return new AppError("CONFIGURATION_REQUIRED", message, 503);
}
export function internalError(message: string, details?: unknown) {
  return new AppError("INTERNAL", message, 500, details);
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
