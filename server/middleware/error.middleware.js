/**
 * Global error middleware - graceful degradation
 */

const logger = require('../utils/logger');

function errorMiddleware(err, _req, res, _next) {
  logger.error('Unhandled error', err.message, err.stack);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorMiddleware;
