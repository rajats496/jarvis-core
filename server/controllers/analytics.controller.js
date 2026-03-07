/**
 * Part 7 - Analytics API. Get per-user usage summary.
 */
const analyticsService = require('../services/analytics.service');

async function getSummary(req, res, next) {
  try {
    const userId = req.user.id;
    const summary = await analyticsService.getSummary(userId);
    res.json({ summary });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary };
