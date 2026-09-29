const { randomUUID } = require('crypto');

/**
 * Request Logger & Correlation Middleware
 * Attaches a unique requestId to every incoming request.
 * Logs method, path, status, and duration ONLY.
 * NEVER logs request body, query params, cookies, tokens, or personal/medical data.
 */
const requestLogger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[REQ] [${requestId}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

module.exports = requestLogger;
