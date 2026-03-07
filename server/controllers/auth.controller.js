/**
 * Auth controller - Register, Login. Links userId to memory, conversations, usage, settings.
 */

const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Settings = require('../models/Settings');
const activityService = require('../services/activity.service');
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
      return res.status(401).json({ error: 'Invalid email or password' });
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

module.exports = { register, login, getMe, refresh, googleAuth };
