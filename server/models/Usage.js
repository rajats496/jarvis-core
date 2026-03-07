/**
 * Usage model - analytics (Part 7). Linked to User.
 */

const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    kind: { type: String, required: true },
    count: { type: Number, default: 1 },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

usageSchema.index({ userId: 1, kind: 1, createdAt: -1 });

module.exports = mongoose.models.Usage || mongoose.model('Usage', usageSchema);
