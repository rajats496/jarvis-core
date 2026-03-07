const goalService = require('../services/goal.service');

async function list(req, res, next) {
  try {
    const userId = req.user.id;
    const list = await goalService.list(userId);
    res.json({ goals: list });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const userId = req.user.id;
    const { title, daysTotal = 30, milestones = [] } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const goal = await goalService.create(userId, { title, daysTotal, milestones });
    res.status(201).json({ goal });
  } catch (err) { next(err); }
}

async function deleteGoal(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const deleted = await goalService.deleteGoal(userId, id);
    if (!deleted) return res.status(404).json({ error: 'Goal not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function updateProgress(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { daysDone } = req.body;
    const updated = await goalService.updateProgress(userId, id, daysDone);
    res.json({ goal: updated });
  } catch (err) { next(err); }
}

module.exports = { list, create, deleteGoal, updateProgress };
