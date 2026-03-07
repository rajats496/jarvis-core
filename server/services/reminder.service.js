const Reminder = require('../models/Reminder');

async function create(userId, { text, triggerAt }) {
  return Reminder.create({ userId, text, triggerAt: new Date(triggerAt) });
}

async function list(userId, limit = 50) {
  // Exclude dismissed reminders from the list
  return Reminder.find({ userId, dismissed: { $ne: true } }).sort({ triggerAt: 1 }).limit(limit).lean();
}

async function dismiss(userId, reminderId) {
  const r = await Reminder.findOneAndUpdate(
    { _id: reminderId, userId },
    { dismissed: true },
    { new: true }
  ).lean();
  return r ? true : false;
}

/**
 * Find reminders that are due and not yet triggered (cron uses this).
 * Uses $ne:true to also match old documents where the 'triggered' field is absent.
 */
async function getDue() {
  return Reminder.find({ triggered: { $ne: true }, triggerAt: { $lte: new Date() } }).lean();
}

/**
 * Mark a reminder as triggered (cron calls this) — sets both notified and triggered flags.
 */
async function markTriggered(id) {
  return Reminder.updateOne({ _id: id }, { notified: true, triggered: true });
}

/** @deprecated use markTriggered */
async function markNotified(id) {
  return markTriggered(id);
}

module.exports = { create, list, getDue, markTriggered, markNotified, dismiss };
