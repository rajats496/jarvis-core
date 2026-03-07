/**
 * Settings model - per-user UI/voice/safe mode (Part 2+). Linked to User.
 */

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    voiceEnabled: { type: Boolean, default: true },
    fallbackModeEnabled: { type: Boolean, default: false },
    safeModeEnabled: { type: Boolean, default: true },
    conciseResponses: { type: Boolean, default: false },
    showSystemMetrics: { type: Boolean, default: false },
    vmUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
