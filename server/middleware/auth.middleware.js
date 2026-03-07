/**
 * Auth middleware - JWT verification, attach req.user for route protection
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authorization required',
      hint: 'Send header: Authorization: Bearer <token>. Get a token from POST /auth/login or POST /auth/register',
    });
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET || 'fallback-dev-secret');
    req.user = { id: decoded.id };
    return next();
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function authMiddlewareOptional(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET || 'fallback-dev-secret');
    req.user = { id: decoded.id };
  } catch (_err) {
    // ignore
  }
  next();
}

module.exports = authMiddleware;
module.exports.optional = authMiddlewareOptional;
