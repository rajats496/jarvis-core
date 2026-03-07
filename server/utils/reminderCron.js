/**
 * Cron: every 10s, find due reminders and mark as triggered.
 */
const reminderService = require('../services/reminder.service');
const activityService = require('../services/activity.service');
const logger = require('./logger');

let intervalId = null;

function start() {
  if (intervalId) return;
  intervalId = setInterval(async () => {
    try {
      const due = await reminderService.getDue();
      for (const r of due) {
        await reminderService.markTriggered(r._id);
        activityService.log(r.userId, 'reminder_triggered', { text: r.text, triggerAt: r.triggerAt }).catch(() => {});
        logger.info('Reminder triggered', { userId: r.userId, text: r.text });
      }
    } catch (err) {
      logger.warn('Reminder cron error', err.message);
    }
  }, 10 * 1000); // every 10 seconds
}

function stop() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
}

module.exports = { start, stop };
