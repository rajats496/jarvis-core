const ActivityLog = require('../models/ActivityLog');

async function log(userId, kind, meta = {}) {
  return ActivityLog.create({ userId, kind, meta });
}

async function getTimeline(userId, limit = 50) {
  const list = await ActivityLog.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
  return list.map((a) => ({ id: a._id, kind: a.kind, meta: a.meta, createdAt: a.createdAt }));
}

module.exports = { log, getTimeline };
