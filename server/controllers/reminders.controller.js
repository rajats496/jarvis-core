const reminderService = require('../services/reminder.service');

async function list(req, res, next) {
  try {
    const userId = req.user.id;
    const reminders = await reminderService.list(userId);
    res.json({ reminders });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const userId = req.user.id;
    const { text, triggerAt } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'text (string) is required' });
    }
    if (!triggerAt) {
      return res.status(400).json({ error: 'triggerAt (date) is required' });
    }
    const trigger = new Date(triggerAt);
    if (isNaN(trigger.getTime())) {
      return res.status(400).json({ error: 'triggerAt must be a valid date' });
    }
    const reminder = await reminderService.create(userId, { text: text.trim(), triggerAt: trigger });
    res.status(201).json({ reminder });
  } catch (err) {
    next(err);
  }
}

async function dismiss(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const ok = await reminderService.dismiss(userId, id);
    if (!ok) return res.status(404).json({ error: 'Reminder not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, dismiss };
