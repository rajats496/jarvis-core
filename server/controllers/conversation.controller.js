/**
 * Backend Part 6 - Conversation history API: list, get recent messages, search.
 */
const conversationService = require('../services/conversation.service');

async function getHistory(req, res, next) {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const messages = await conversationService.getRecent(userId, limit);
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

async function search(req, res, next) {
  try {
    const userId = req.user.id;
    const q = req.query.q || req.query.query || '';
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const matches = await conversationService.search(userId, q, limit);
    res.json({ matches });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const conversations = await conversationService.list(userId, limit);
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHistory, search, list };
