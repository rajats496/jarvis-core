const commandLogService = require('../services/commandLog.service');

async function getHistory(req, res, next) {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const history = await commandLogService.getLast(userId, limit);
    res.json({ history });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHistory };
