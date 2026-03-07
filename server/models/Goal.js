const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    daysTotal: { type: Number, required: true },
    daysDone: { type: Number, default: 0 },
    milestones: [{ text: String, done: Boolean, doneAt: Date }],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Goal || mongoose.model('Goal', goalSchema);
