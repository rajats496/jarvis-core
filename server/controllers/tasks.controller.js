const taskService = require('../services/task.service');

async function list(req, res, next) {
  try {
    const userId = req.user.id;
    const tasks = await taskService.list(userId);
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const userId = req.user.id;
    const { title } = req.body || {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title (string) is required' });
    }
    const task = await taskService.create(userId, title.trim());
    res.status(201).json({ task: { id: task._id, title: task.title, done: task.done, createdAt: task.createdAt } });
  } catch (err) {
    next(err);
  }
}

async function markDone(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { done } = req.body || {};
    const updated = await taskService.setDone(userId, id, done !== false);
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const deleted = await taskService.deleteTask(userId, id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, markDone, deleteTask };
