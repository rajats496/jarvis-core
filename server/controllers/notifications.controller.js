/**
 * Rule-based notifications (no AI). e.g. memory count > 20, AI unavailable.
 */
const memoryService = require('../services/memory.service');
const aiService = require('../services/ai.service');
const Reminder = require('../models/Reminder');

async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const messages = [];
    await memoryService.refreshMemoryCount();
    const { memoryCount } = require('../config/systemHealth').getState();
    if (memoryCount > 20) {
      messages.push({ id: 'memory_cleanup', text: 'You have many stored memories. Consider cleaning up.', type: 'info' });
    }
    if (!aiService.isAvailable()) {
      messages.push({ id: 'ai_unavailable', text: 'AI currently unavailable. Using fallback mode.', type: 'warning' });
    }
    res.json({ notifications: messages });
  } catch (err) {
    next(err);
  }
}

async function getPending(req, res, next) {
  try {
    const userId = req.user.id;
    // Exclude reminders already acknowledged via toast OR fully dismissed from panel
    const reminders = await Reminder.find({
      userId,
      $or: [{ triggered: true }, { notified: true }],
      dismissed: { $ne: true },
      notifAcknowledged: { $ne: true },
      triggerAt: { $lte: new Date() },
    })
      .sort({ triggerAt: -1 })
      .limit(20)
      .lean();

    const notifications = reminders.map((r) => ({
      id: r._id.toString(),
      type: 'reminder',
      text: r.text,
      triggerAt: r.triggerAt,
      createdAt: r.createdAt,
      read: false,
    }));

    res.json({ notifications });
  } catch (err) {
    next(err);
  }
}

// markRead: just acknowledge the toast — keeps reminder visible in the panel
async function markRead(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await Reminder.findOneAndUpdate(
      { _id: id, userId },
      { notifAcknowledged: true },
      { new: true }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, getPending, markRead };
