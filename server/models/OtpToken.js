/**
 * OtpToken model — stores hashed OTPs for signup & password-reset flows.
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
  otpHash: {
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
  expiresAt: {
    type: Date,
    required: true,
  },
});

// MongoDB TTL: auto-removes the document after expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Hash OTP before saving
otpSchema.methods.setOtp = async function (plainOtp) {
  this.otpHash = await bcrypt.hash(plainOtp, 8);
};

// Verify OTP and increment attempt counter
otpSchema.methods.verifyOtp = async function (plainOtp) {
  const match = await bcrypt.compare(plainOtp, this.otpHash);
  if (!match) this.attempts += 1;
  return match;
};

module.exports = mongoose.models.OtpToken || mongoose.model('OtpToken', otpSchema);
