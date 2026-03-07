const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true },
    triggerAt: { type: Date, required: true, index: true },
    notified: { type: Boolean, default: false },
    triggered: { type: Boolean, default: false, index: true }, // cron sets this true when due
    dismissed: { type: Boolean, default: false },              // user removes from panel
    notifAcknowledged: { type: Boolean, default: false },      // user dismissed the toast (keeps in panel)
  },
  { timestamps: true }
);

module.exports = mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema);
