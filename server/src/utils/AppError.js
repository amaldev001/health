/**
 * Standardized AppError class mapping to specific HTTP status codes and error codes per 14-VALIDATION-ERROR-HANDLING.md.
 */
class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static validationError(message = 'Invalid input parameters.', details = null) {
    return new AppError(message, 400, 'VALIDATION_ERROR', details);
  }

  static authenticationRequired(message = 'Authentication required. Please log in.') {
    return new AppError(message, 401, 'AUTHENTICATION_REQUIRED');
  }

  static invalidCredentials(message = 'Invalid email or password.') {
    return new AppError(message, 401, 'INVALID_CREDENTIALS');
  }

  static forbidden(message = 'Access denied.') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found.') {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static conflict(message = 'Resource conflict.') {
    return new AppError(message, 409, 'CONFLICT');
  }

  static rateLimited(message = 'Too many requests, please try again later.') {
    return new AppError(message, 429, 'RATE_LIMITED');
  }

  static internalError(message = 'An unexpected internal error occurred.') {
    return new AppError(message, 500, 'INTERNAL_ERROR');
  }
}

/**
 * Async handler wrapper to catch unhandled promise rejections without try/catch boilerplate in controllers.
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = { AppError, catchAsync };
