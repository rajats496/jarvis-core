/**
 * Auth controller - Register, Login. Links userId to memory, conversations, usage, settings.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const OtpToken = require('../models/OtpToken');
const Settings = require('../models/Settings');
const activityService = require('../services/activity.service');
const { sendOtpEmail } = require('../services/email.service');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

if (!JWT_SECRET && process.env.NODE_ENV !== 'test') {
  logger.warn('JWT_SECRET is not set; auth will fail');
}

function signToken(id) {
  return jwt.sign({ id }, JWT_SECRET || 'fallback-dev-secret', { expiresIn: JWT_EXPIRES_IN });
}

function sendUserAndToken(res, user, status = 200) {
  const token = signToken(user._id);
  const u = user.toObject ? user.toObject() : user;
  delete u.password;
  res.status(status).json({
    token,
    user: { id: u._id, email: u.email, name: u.name || '' },
    expiresIn: JWT_EXPIRES_IN,
  });
}

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const user = await User.create({
      email: email.trim().toLowerCase(),
      password,
      name: (name || '').trim(),
    });
    await Settings.create({ userId: user._id });
    sendUserAndToken(res, user, 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Account not found. Please create an account first.' });
    }
    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    activityService.log(user._id, 'login', {}).catch(() => {});
    sendUserAndToken(res, user);
  } catch (err) {
    next(err);
  }
}

async function googleAuth(req, res, next) {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'Google access token is required' });
    }
    // Verify token with Google and get email/sub
    const tokenInfo = await googleClient.getTokenInfo(accessToken);
    if (!tokenInfo.email) {
      return res.status(401).json({ error: 'Could not verify Google token' });
    }
    const googleId = tokenInfo.sub || tokenInfo.user_id;
    const email = tokenInfo.email.toLowerCase();

    // Fetch display name from userinfo endpoint (Node 18+ native fetch)
    let googleName = '';
    try {
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const info = await infoRes.json();
      googleName = info.name || '';
    } catch (_) {}

    // Find existing user by googleId or email, or create new
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        await user.save();
      } else {
        user = await User.create({ email, name: googleName, googleId });
        await Settings.create({ userId: user._id });
      }
    }
    activityService.log(user._id, 'google_login', {}).catch(() => {});
    sendUserAndToken(res, user);
  } catch (err) {
    if (err.message && (err.message.includes('Token has been expired') || err.message.includes('expired'))) {
      return res.status(401).json({ error: 'Google token expired. Please sign in again.' });
    }
    if (err.message && err.message.includes('Invalid Value')) {
      return res.status(401).json({ error: 'Invalid Google token.' });
    }
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: { id: user._id, email: user.email, name: user.name || '' } });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    sendUserAndToken(res, user);
  } catch (err) {
    next(err);
  }
}

/* ─────────────────────────────────────────────
   OTP HELPERS
───────────────────────────────────────────── */

/** Simple in-memory per-email rate limiter: max 3 OTP sends per hour */
const otpSendTracker = new Map();
const OTP_MAX_PER_HOUR = 3;
function checkOtpSendLimit(key) {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const record = otpSendTracker.get(key);
  if (!record || now - record.windowStart > hour) {
    otpSendTracker.set(key, { windowStart: now, count: 1 });
    return true;
  }
  if (record.count >= OTP_MAX_PER_HOUR) return false;
  record.count += 1;
  return true;
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

/* ─────────────────────────────────────────────
   SIGNUP OTP
───────────────────────────────────────────── */

async function sendSignupOtp(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const normalized = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalized });
    if (existing) return res.status(409).json({ error: 'Email already registered. Please sign in.' });

    if (!checkOtpSendLimit(normalized)) {
      return res.status(429).json({ error: 'Too many OTP requests. Please wait 1 hour and try again.' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await OtpToken.deleteMany({ email: normalized, purpose: 'signup' });
    const otpDoc = new OtpToken({ email: normalized, purpose: 'signup', expiresAt });
    await otpDoc.setOtp(otp);
    await otpDoc.save();

    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
    await sendOtpEmail(normalized, otp, 'signup');
    logger.info(`[auth] Signup OTP sent to ${normalized}`);

    const resp = { message: emailConfigured ? 'OTP sent to your email. Valid for 10 minutes.' : 'Dev mode: check server console for OTP.' };
    if (!emailConfigured) resp.devOtp = otp; // expose on screen when email not configured
    res.json(resp);
  } catch (err) {
    next(err);
  }
}

async function verifySignupOtp(req, res, next) {
  try {
    const { email, otp, password, name } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ error: 'Email, OTP, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalized = email.trim().toLowerCase();
    const otpDoc = await OtpToken.findOne({ email: normalized, purpose: 'signup' });

    if (!otpDoc) return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
    if (otpDoc.expiresAt < new Date()) {
      await otpDoc.deleteOne();
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    if (otpDoc.attempts >= 5) {
      await otpDoc.deleteOne();
      return res.status(400).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    const valid = await otpDoc.verifyOtp(otp);
    if (!valid) {
      await otpDoc.save();
      const remaining = 5 - otpDoc.attempts;
      return res.status(400).json({ error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` });
    }

    await otpDoc.deleteOne();

    const existing = await User.findOne({ email: normalized });
    if (existing) return res.status(409).json({ error: 'Email already registered.' });

    const user = await User.create({ email: normalized, password, name: (name || '').trim() });
    await Settings.create({ userId: user._id });
    activityService.log(user._id, 'register', {}).catch(() => {});
    logger.info(`[auth] New user created via OTP: ${normalized}`);

    sendUserAndToken(res, user, 201);
  } catch (err) {
    next(err);
  }
}

/* ─────────────────────────────────────────────
   FORGOT PASSWORD OTP
───────────────────────────────────────────── */

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const normalized = email.trim().toLowerCase();

    // Always return success to prevent email enumeration attacks
    const user = await User.findOne({ email: normalized });
    if (!user) {
      return res.json({ message: 'If this email is registered, an OTP has been sent.' });
    }

    if (!checkOtpSendLimit(`reset:${normalized}`)) {
      return res.status(429).json({ error: 'Too many OTP requests. Please wait 1 hour and try again.' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OtpToken.deleteMany({ email: normalized, purpose: 'reset' });
    const otpDoc = new OtpToken({ email: normalized, purpose: 'reset', expiresAt });
    await otpDoc.setOtp(otp);
    await otpDoc.save();

    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
    await sendOtpEmail(normalized, otp, 'reset');
    logger.info(`[auth] Reset OTP sent to ${normalized}`);

    const resetResp = { message: 'If this email is registered, an OTP has been sent.' };
    if (!emailConfigured) resetResp.devOtp = otp;
    res.json(resetResp);
  } catch (err) {
    next(err);
  }
}

async function verifyResetOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const normalized = email.trim().toLowerCase();
    const otpDoc = await OtpToken.findOne({ email: normalized, purpose: 'reset' });

    if (!otpDoc) return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
    if (otpDoc.expiresAt < new Date()) {
      await otpDoc.deleteOne();
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    if (otpDoc.attempts >= 5) {
      await otpDoc.deleteOne();
      return res.status(400).json({ error: 'Too many incorrect attempts. Request a new OTP.' });
    }

    const valid = await otpDoc.verifyOtp(otp);
    if (!valid) {
      await otpDoc.save();
      const remaining = 5 - otpDoc.attempts;
      return res.status(400).json({ error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` });
    }

    await otpDoc.deleteOne();

    // Issue a short-lived reset token (15 min)
    const resetToken = jwt.sign(
      { purpose: 'password_reset', email: normalized },
      JWT_SECRET || 'fallback-dev-secret',
      { expiresIn: '15m' }
    );

    res.json({ resetToken, message: 'OTP verified. Set your new password.' });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, JWT_SECRET || 'fallback-dev-secret');
    } catch {
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }

    if (payload.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid reset token.' });
    }

    const user = await User.findOne({ email: payload.email }).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.password = password; // pre-save hook hashes it
    await user.save();
    logger.info(`[auth] Password reset for ${payload.email}`);

    res.json({ message: 'Password reset successfully. Please sign in.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, refresh, googleAuth, sendSignupOtp, verifySignupOtp, forgotPassword, verifyResetOtp, resetPassword };
