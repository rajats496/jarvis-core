/**
 * Rate limiting - simple in-memory counter per IP
 */
const logger = require('../utils/logger');

const requests = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute per IP

function cleanup() {
  const now = Date.now();
  for (const [ip, data] of requests.entries()) {
    if (now - data.windowStart > WINDOW_MS) {
      requests.delete(ip);
    }
  }
}

setInterval(cleanup, WINDOW_MS);

function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const data = requests.get(ip);

  if (!data) {
    requests.set(ip, { windowStart: now, count: 1 });
    return next();
  }

  if (now - data.windowStart > WINDOW_MS) {
    requests.set(ip, { windowStart: now, count: 1 });
    return next();
  }

  data.count += 1;

  if (data.count > MAX_REQUESTS) {
    logger.warn(`Rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((WINDOW_MS - (now - data.windowStart)) / 1000),
    });
  }

  next();
}

module.exports = rateLimitMiddleware;
