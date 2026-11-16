export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }

  static badRequest(message = 'Bad request', code = 'BAD_REQUEST'): AppError {
    return new AppError(400, code, message);
  }
  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED'): AppError {
    return new AppError(401, code, message);
  }
  static forbidden(message = 'Forbidden', code = 'FORBIDDEN'): AppError {
    return new AppError(403, code, message);
  }
  static notFound(message = 'Resource not found', code = 'NOT_FOUND'): AppError {
    return new AppError(404, code, message);
  }
  static conflict(message = 'Conflict', code = 'CONFLICT'): AppError {
    return new AppError(409, code, message);
  }
}