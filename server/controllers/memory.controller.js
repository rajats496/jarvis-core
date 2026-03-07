/**
 * Memory controller - structured memory CRUD + keyword search. No AI.
 */

const memoryService = require('../services/memory.service');

async function create(req, res, next) {
  try {
    const userId = req.user.id;
    const { type, category, value, keywords } = req.body || {};
    const doc = await memoryService.save(userId, { type, category, value, keywords });
    const out = { id: doc._id, type: doc.type, category: doc.category, value: doc.value, keywords: doc.keywords || [], createdAt: doc.createdAt, updatedAt: doc.updatedAt };
    res.status(201).json(out);
  } catch (err) {
    if (err.message && err.message.includes('required')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const userId = req.user.id;
    const { type, category, limit } = req.query;
    const list = await memoryService.retrieve(userId, { type, category, limit: limit ? parseInt(limit, 10) : undefined });
    res.json({ memories: list });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const userId = req.user.id;
    const memory = await memoryService.getById(userId, req.params.id);
    if (!memory) return res.status(404).json({ error: 'Memory not found' });
    res.json(memory);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const userId = req.user.id;
    const updated = await memoryService.update(userId, req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'Memory not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const userId = req.user.id;
    const deleted = await memoryService.remove(userId, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Memory not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function search(req, res, next) {
  try {
    const userId = req.user.id;
    const q = req.query.q || req.query.query || '';
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const list = await memoryService.keywordSearch(userId, q, limit);
    res.json({ memories: list });
  } catch (err) {
    next(err);
  }
}

async function preferences(req, res, next) {
  try {
    const userId = req.user.id;
    const type = req.query.type || 'preference';
    const category = req.query.category;
    const list = await memoryService.getPreferences(userId, type, category);
    res.json({ memories: list });
  } catch (err) {
    next(err);
  }
}

async function exportData(req, res, next) {
  try {
    const userId = req.user.id;
    const data = await memoryService.exportForUser(userId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="memories-export.json"');
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    next(err);
  }
}

async function categories(req, res, next) {
  try {
    const userId = req.user.id;
    const groups = await memoryService.getGroupedByType(userId);
    res.json({ categories: groups });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
  search,
  preferences,
  exportData,
  categories,
};
