const activityService = require('../services/activity.service');

async function getTimeline(req, res, next) {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const timeline = await activityService.getTimeline(userId, limit);
    res.json({ timeline });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTimeline };
