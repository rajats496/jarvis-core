const Task = require('../models/Task');

async function create(userId, title) {
  return Task.create({ userId, title });
}

async function list(userId, limit = 100) {
  const tasks = await Task.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
  return tasks.map((t) => ({ id: t._id, title: t.title, done: t.done, createdAt: t.createdAt }));
}

async function setDone(userId, taskId, done = true) {
  const t = await Task.findOneAndUpdate({ _id: taskId, userId }, { done }, { new: true }).lean();
  return t ? { id: t._id, title: t.title, done: t.done } : null;
}

async function deleteTask(userId, taskId) {
  const r = await Task.deleteOne({ _id: taskId, userId });
  return r.deletedCount > 0;
}

module.exports = { create, list, setDone, deleteTask };
