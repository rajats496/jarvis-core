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
const { sendLinkEmail } = require('../services/email.service');
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

/* ─────────────────────────────────────────────
   EMAIL LINK VERIFICATION — SIGNUP
───────────────────────────────────────────── */

async function sendVerificationEmail(req, res, next) {
  try {
    const { email, password, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const normalized = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalized });
    if (existing) return res.status(409).json({ error: 'Email already registered. Please sign in.' });

    if (!checkOtpSendLimit(normalized)) {
      return res.status(429).json({ error: 'Too many requests. Please wait 1 hour and try again.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await OtpToken.deleteMany({ email: normalized, purpose: 'signup' });
    const tokenDoc = new OtpToken({
      email: normalized,
      purpose: 'signup',
      expiresAt,
      pendingData: { password, name: (name || '').trim() },
    });
    await tokenDoc.setOtp(rawToken);
    await tokenDoc.save();

    const frontendUrl = process.env.FRONTEND_URL || 'https://jarvis-ai-assistance.vercel.app';
    const verifyLink = `${frontendUrl}/verify-email?token=${rawToken}&email=${encodeURIComponent(normalized)}`;

    let emailSent = false;
    let emailError = null;
    let devLink = null;
    try {
      const result = await sendLinkEmail(normalized, verifyLink, 'signup');
      emailSent = result?.sent === true;
      if (!emailSent && result?.devLink) devLink = result.devLink;
      if (emailSent) logger.info(`[auth] Verification email sent to ${normalized}`);
    } catch (emailErr) {
      emailError = emailErr.message;
      logger.warn(`[auth] Email delivery failed for ${normalized}: ${emailErr.message}`);
    }

    const resp = {
      message: emailSent
        ? 'Verification email sent. Check your inbox and click the link to activate your account.'
        : 'Email delivery failed. Use the dev link below.',
    };
    if (!emailSent) {
      resp.devLink = devLink || verifyLink;
      resp.emailError = emailError || 'Email credentials not configured on server';
    }
    res.json(resp);
  } catch (err) {
    next(err);
  }
}

async function verifyEmailToken(req, res, next) {
  try {
    const { token, email } = req.body;
    if (!token || !email) return res.status(400).json({ error: 'Token and email are required' });

    const normalized = email.trim().toLowerCase();
    const tokenDoc = await OtpToken.findOne({ email: normalized, purpose: 'signup' });

    if (!tokenDoc) return res.status(400).json({ error: 'Verification link expired or already used. Please register again.' });
    if (tokenDoc.expiresAt < new Date()) {
      await tokenDoc.deleteOne();
      return res.status(400).json({ error: 'Verification link has expired. Please register again.' });
    }

    const valid = await tokenDoc.verifyOtp(token);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid verification link. Please register again.' });
    }

    const { password, name } = tokenDoc.pendingData || {};
    await tokenDoc.deleteOne();

    if (!password) return res.status(400).json({ error: 'Signup data missing. Please register again.' });

    const existingUser = await User.findOne({ email: normalized });
    if (existingUser) {
      return sendUserAndToken(res, existingUser);
    }

    const user = await User.create({ email: normalized, password, name: name || '' });
    await Settings.create({ userId: user._id });
    activityService.log(user._id, 'register', {}).catch(() => {});
    logger.info(`[auth] New user verified and created: ${normalized}`);

    sendUserAndToken(res, user, 201);
  } catch (err) {
    next(err);
  }
}

/* ─────────────────────────────────────────────
   FORGOT PASSWORD (EMAIL LINK)
───────────────────────────────────────────── */

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const normalized = email.trim().toLowerCase();

    // Always return success to prevent email enumeration attacks
    const user = await User.findOne({ email: normalized });
    if (!user) {
      return res.json({ message: 'If this email is registered, a reset link has been sent.' });
    }

    if (!checkOtpSendLimit(`reset:${normalized}`)) {
      return res.status(429).json({ error: 'Too many requests. Please wait 1 hour and try again.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await OtpToken.deleteMany({ email: normalized, purpose: 'reset' });
    const tokenDoc = new OtpToken({ email: normalized, purpose: 'reset', expiresAt });
    await tokenDoc.setOtp(rawToken);
    await tokenDoc.save();

    const frontendUrl = process.env.FRONTEND_URL || 'https://jarvis-ai-assistance.vercel.app';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(normalized)}`;

    let emailSent = false;
    let emailError = null;
    let devLink = null;
    try {
      const result = await sendLinkEmail(normalized, resetLink, 'reset');
      emailSent = result?.sent === true;
      if (!emailSent && result?.devLink) devLink = result.devLink;
      if (emailSent) logger.info(`[auth] Reset link emailed to ${normalized}`);
    } catch (emailErr) {
      emailError = emailErr.message;
      logger.warn(`[auth] Reset email delivery failed for ${normalized}: ${emailErr.message}`);
    }

    const resetResp = {
      message: emailSent
        ? 'If this email is registered, a password reset link has been sent.'
        : 'Email delivery failed. Use the dev link below.',
    };
    if (!emailSent) {
      resetResp.devLink = devLink || resetLink;
      resetResp.emailError = emailError || 'Email credentials not configured on server';
    }
    res.json(resetResp);
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) {
      return res.status(400).json({ error: 'Token, email, and new password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalized = email.trim().toLowerCase();
    const tokenDoc = await OtpToken.findOne({ email: normalized, purpose: 'reset' });

    if (!tokenDoc) return res.status(400).json({ error: 'Reset link expired or already used. Please request a new one.' });
    if (tokenDoc.expiresAt < new Date()) {
      await tokenDoc.deleteOne();
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }

    const valid = await tokenDoc.verifyOtp(token);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid reset link. Please request a new one.' });
    }

    await tokenDoc.deleteOne();

    const user = await User.findOne({ email: normalized }).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.password = password; // pre-save hook hashes it
    await user.save();
    logger.info(`[auth] Password reset for ${normalized}`);

    res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, refresh, googleAuth, sendVerificationEmail, verifyEmailToken, forgotPassword, resetPassword };
