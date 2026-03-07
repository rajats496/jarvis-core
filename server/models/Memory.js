/**
 * Memory model - structured + vector (Part 4/5). Linked to User.
 */

const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: { type: String, required: true },
    category: { type: String, default: '' },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    embedding: [Number],
    keywords: [String],
  },
  { timestamps: true }
);

memorySchema.index({ userId: 1, type: 1, category: 1 });

module.exports = mongoose.models.Memory || mongoose.model('Memory', memorySchema);
