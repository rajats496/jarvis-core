/**
 * Auth routes - Register, Login, OTP signup, forgot-password, reset-password
 */

const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

/* ── Stricter in-memory rate limiter for OTP endpoints (5 req / 15 min per IP) ── */
const otpRateMap = new Map();
function otpRateLimit(req, res, next) {
  const ip  = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const win = 15 * 60 * 1000; // 15 minutes
  const rec = otpRateMap.get(ip);
  if (!rec || now - rec.start > win) {
    otpRateMap.set(ip, { start: now, count: 1 });
    return next();
  }
  rec.count += 1;
  if (rec.count > 5) {
    return res.status(429).json({ error: 'Too many requests. Please wait 15 minutes.' });
  }
  next();
}

/* ── Existing routes (unchanged) ── */
router.post('/register',         authController.register);
router.post('/login',            authController.login);
router.post('/google',           authController.googleAuth);
router.post('/refresh',          authMiddleware, authController.refresh);
router.get('/me',                authMiddleware, authController.getMe);

/* ── OTP signup ── */
router.post('/send-otp',         otpRateLimit, authController.sendSignupOtp);
router.post('/verify-otp',       otpRateLimit, authController.verifySignupOtp);

/* ── Forgot / reset password ── */
router.post('/forgot-password',  otpRateLimit, authController.forgotPassword);
router.post('/verify-reset-otp', otpRateLimit, authController.verifyResetOtp);
router.post('/reset-password',   authController.resetPassword);

module.exports = router;

