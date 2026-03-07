const CommandLog = require('../models/CommandLog');

async function log(userId, command, result, success = true) {
  return CommandLog.create({ userId, command, result, success });
}

async function getLast(userId, limit = 5) {
  const list = await CommandLog.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
  return list.map((l) => ({ command: l.command, result: l.result, success: l.success, createdAt: l.createdAt }));
}

module.exports = { log, getLast };
