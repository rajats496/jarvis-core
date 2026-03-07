/**
 * Part 7 - Analytics service. Record usage events, return per-user summary.
 */
const mongoose = require('mongoose');
const Usage = require('../models/Usage');

async function increment(userId, kind, meta = {}) {
  if (!userId || !kind) return;
  await Usage.create({ userId, kind: String(kind), count: 1, meta });
}

/**
 * Get usage summary for user: { ai_calls, fallback, memory_save, ... } (counts by kind).
 */
async function getSummary(userId, limitKinds = 20) {
  if (!userId) return {};
  const uid = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  const list = await Usage.aggregate([
    { $match: { userId: uid } },
    { $group: { _id: '$kind', total: { $sum: '$count' } } },
    { $sort: { total: -1 } },
    { $limit: limitKinds },
  ]);
  const summary = {};
  list.forEach((x) => {
    summary[x._id] = x.total;
  });
  return summary;
}

module.exports = { increment, getSummary };
