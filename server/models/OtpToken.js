/**
 * OtpToken model — stores hashed verification tokens for signup & password-reset links.
 * pendingData holds temporary signup info (password + name) until email is verified.
 * TTL index auto-deletes expired documents.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otpHash: {          // stores bcrypt hash of the random verification token
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['signup', 'reset'],
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  /** Temporary signup data stored until email is verified. Contains: { password, name } */
  pendingData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// MongoDB TTL: auto-removes the document after expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Hash a token before saving
otpSchema.methods.setOtp = async function (plainToken) {
  this.otpHash = await bcrypt.hash(plainToken, 8);
};

// Verify token
otpSchema.methods.verifyOtp = async function (plainToken) {
  const match = await bcrypt.compare(plainToken, this.otpHash);
  if (!match) this.attempts += 1;
  return match;
};

module.exports = mongoose.models.OtpToken || mongoose.model('OtpToken', otpSchema);
