const mongoose = require('mongoose');

const commandLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    command: { type: String, required: true },
    result: { type: String },
    success: { type: Boolean, default: true },
  },
  { timestamps: true }
);

commandLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.CommandLog || mongoose.model('CommandLog', commandLogSchema);
