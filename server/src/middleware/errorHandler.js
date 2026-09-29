const { AppError } = require('../utils/AppError');

/**
 * Centralized Error Handler Middleware
 * Standardized response contract with error code, message, details, and requestId.
 * Status code precedence bug eliminated.
 * NEVER exposes stack traces or raw MongoDB driver texts to clients.
 */
const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || 'req-unknown';

  let error = err;

  // Map Mongoose / Mongo Error types if not already an AppError
  if (!(error instanceof AppError)) {
    // Mongoose ValidationError
    if (err.name === 'ValidationError') {
      const details = Object.keys(err.errors || {}).map(field => ({
        field,
        message: err.errors[field].message
      }));
      error = AppError.validationError('Validation failed.', details);
    }
    // Mongoose CastError (e.g. invalid ObjectId cast)
    else if (err.name === 'CastError') {
      error = AppError.validationError(`Invalid value for ${err.path}.`);
    }
    // Mongo Duplicate Key 11000
    else if (err.code === 11000) {
      error = AppError.conflict('Duplicate key conflict detected.');
    }
    // JWT Errors
    else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      error = AppError.authenticationRequired('Invalid or expired authentication token.');
    }
    // Custom throw with statusCode (e.g. legacy service objects)
    else if (err.statusCode && err.code) {
      error = new AppError(err.message || 'Error occurred.', err.statusCode, err.code, err.details || null);
    }
    // Unknown fallback -> 500 INTERNAL_ERROR
    else {
      error = AppError.internalError();
    }
  }

  // Log error internally (with requestId) without exposing sensitive body data
  if (error.statusCode === 500) {
    console.error(`[ERROR] [${requestId}] ${req.method} ${req.originalUrl}:`, err);
  } else {
    console.warn(`[WARN] [${requestId}] ${error.code} (${error.statusCode}): ${error.message}`);
  }

  const response = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal Server Error'
    },
    requestId
  };

  if (error.details) {
    response.error.details = error.details;
  }

  return res.status(error.statusCode || 500).json(response);
};

module.exports = errorHandler;
