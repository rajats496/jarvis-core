const Goal = require('../models/Goal');

async function create(userId, { title, daysTotal, milestones = [] }) {
  return Goal.create({ userId, title, daysTotal, milestones: milestones.map((m) => ({ text: m, done: false })) });
}

async function list(userId) {
  return Goal.find({ userId }).sort({ createdAt: -1 }).lean();
}

async function updateProgress(userId, goalId, daysDone) {
  const g = await Goal.findOneAndUpdate({ _id: goalId, userId }, { daysDone }, { new: true }).lean();
  return g;
}

async function markComplete(userId, goalId) {
  const g = await Goal.findOne({ _id: goalId, userId }).lean();
  if (!g) return null;
  return Goal.findOneAndUpdate({ _id: goalId, userId }, { daysDone: g.daysTotal }, { new: true }).lean();
}

async function deleteGoal(userId, goalId) {
  return Goal.findOneAndDelete({ _id: goalId, userId }).lean();
}

async function toggleMilestone(userId, goalId, index) {
  const g = await Goal.findOne({ _id: goalId, userId });
  if (!g || !g.milestones[index]) return null;
  g.milestones[index].done = !g.milestones[index].done;
  g.milestones[index].doneAt = g.milestones[index].done ? new Date() : null;
  await g.save();
  return g;
}

module.exports = { create, list, updateProgress, markComplete, deleteGoal, toggleMilestone };
