/**
 * Load guard - lightweight checks to avoid overload
 * Used by VM microservice (Part 8) and can be used for rate/backpressure
 */

const logger = require('./logger');

const DEFAULT_MAX_CONCURRENT = 20;
let activeRequests = 0;
let maxConcurrent = parseInt(process.env.MAX_CONCURRENT_REQUESTS, 10) || DEFAULT_MAX_CONCURRENT;

function isUnderLoad() {
  return activeRequests < maxConcurrent;
}

function incrementLoad() {
  activeRequests += 1;
}

function decrementLoad() {
  if (activeRequests > 0) activeRequests -= 1;
}

function getLoadInfo() {
  return {
    activeRequests,
    maxConcurrent,
    underLoad: isUnderLoad(),
  };
}

/** Wrap a handler to track in-flight requests */
function withLoadGuard(handler) {
  return async (req, res, next) => {
    if (!isUnderLoad()) {
      logger.warn('Load guard: rejecting request, at capacity');
      return res.status(503).json({ error: 'Service temporarily overloaded' });
    }
    incrementLoad();
    try {
      await handler(req, res, next);
    } finally {
      decrementLoad();
    }
  };
}

module.exports = {
  isUnderLoad,
  incrementLoad,
  decrementLoad,
  getLoadInfo,
  withLoadGuard,
};
