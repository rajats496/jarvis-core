/**
 * Structured memory service - AI-independent. DB = source of truth.
 * Part 5: vector semantic search (embeddings), fallback to keyword.
 */

const Memory = require('../models/Memory');
const systemHealth = require('../config/systemHealth');
const embeddingService = require('./embedding.service');

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

async function refreshMemoryCount() {
  const count = await Memory.countDocuments({});
  systemHealth.setMemoryCount(count);
}

async function save(userId, { type, category = '', value, keywords = [] }) {
  if (!userId || !type || value === undefined) {
    throw new Error('userId, type, and value are required');
  }
  const keywordsArr = Array.isArray(keywords) ? keywords : [String(keywords)].filter(Boolean);
  const doc = await Memory.create({
    userId,
    type: String(type).trim(),
    category: String(category).trim(),
    value,
    keywords: keywordsArr.map((k) => String(k).trim()).filter(Boolean),
  });
  await refreshMemoryCount();
  if (embeddingService.isAvailable()) {
    try {
      const textToEmbed = [doc.type, doc.category, typeof doc.value === 'string' ? doc.value : JSON.stringify(doc.value)].join(' ');
      const vec = await embeddingService.embed(textToEmbed);
      if (vec && vec.length > 0) {
        await Memory.updateOne({ _id: doc._id }, { $set: { embedding: vec } });
      }
    } catch (_) {
      // save succeeded; embedding is optional
    }
  }
  return doc;
}

async function retrieve(userId, options = {}) {
  const { type, category, limit = 50 } = options;
  const q = { userId };
  if (type) q.type = type;
  if (category !== undefined && category !== '') q.category = category;
  const list = await Memory.find(q).sort({ updatedAt: -1 }).limit(limit).lean();
  return list.map(({ _id, type, category, value, keywords, createdAt, updatedAt }) => ({
    id: _id,
    type,
    category,
    value,
    keywords: keywords || [],
    createdAt,
    updatedAt,
  }));
}

async function getById(userId, memoryId) {
  const doc = await Memory.findOne({ _id: memoryId, userId }).lean();
  if (!doc) return null;
  return {
    id: doc._id,
    type: doc.type,
    category: doc.category,
    value: doc.value,
    keywords: doc.keywords || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function update(userId, memoryId, { type, category, value, keywords }) {
  const doc = await Memory.findOne({ _id: memoryId, userId });
  if (!doc) return null;
  if (type !== undefined) doc.type = String(type).trim();
  if (category !== undefined) doc.category = String(category).trim();
  if (value !== undefined) doc.value = value;
  if (keywords !== undefined) {
    doc.keywords = Array.isArray(keywords) ? keywords.map((k) => String(k).trim()).filter(Boolean) : [];
  }
  await doc.save();
  await refreshMemoryCount();
  return getById(userId, memoryId);
}

async function remove(userId, memoryId) {
  const deleted = await Memory.findOneAndDelete({ _id: memoryId, userId });
  if (deleted) await refreshMemoryCount();
  return !!deleted;
}

/**
 * Keyword search - deterministic, no AI. Matches keywords array or value/category/type as string.
 */
async function keywordSearch(userId, query, limit = 20) {
  if (!userId) return [];
  const q = String(query).trim();
  if (!q) return retrieve(userId, { limit });
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const list = await Memory.find({
    userId,
    $or: [
      { keywords: regex },
      { type: regex },
      { category: regex },
      { value: regex },
    ],
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
  return list.map(({ _id, type, category, value, keywords, createdAt, updatedAt }) => ({
    id: _id,
    type,
    category,
    value,
    keywords: keywords || [],
    createdAt,
    updatedAt,
  }));
}

/**
 * Deterministic preference retrieval - get by type and optional category (e.g. type=preference, category=programming_language).
 */
async function getPreferences(userId, type = 'preference', category = null) {
  const opts = { type, limit: 100 };
  if (category != null && category !== '') opts.category = category;
  return retrieve(userId, opts);
}

/**
 * Part 5 - Semantic search using stored embeddings. Returns same shape as keywordSearch.
 * Falls back to empty if embeddings disabled or no matches.
 */
async function semanticSearch(userId, query, limit = 20) {
  if (!userId) return [];
  const q = String(query).trim();
  if (!q) return retrieve(userId, { limit });
  if (!embeddingService.isAvailable()) return [];
  const queryVec = await embeddingService.embed(q);
  if (!queryVec || queryVec.length === 0) return [];
  const withEmbedding = await Memory.find({ userId, embedding: { $exists: true, $ne: [] } })
    .limit(200)
    .lean();
  if (withEmbedding.length === 0) return [];
  const scored = withEmbedding
    .map((m) => ({ doc: m, score: cosineSimilarity(queryVec, m.embedding || []) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map(({ doc }) => ({
    id: doc._id,
    type: doc.type,
    category: doc.category,
    value: doc.value,
    keywords: doc.keywords || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));
}

/**
 * Part 5 - Get relevant memories for AI context: semantic first, fallback to keyword.
 * Returns array of { type, category, value } for injection into system prompt.
 */
async function getRelevantForContext(userId, query, limit = 5) {
  if (!userId) return [];
  let list = [];
  if (embeddingService.isAvailable()) {
    list = await semanticSearch(userId, query, limit);
  }
  if (list.length === 0) {
    list = await keywordSearch(userId, query, limit);
  }
  return list.map((m) => ({
    type: m.type,
    category: m.category || '',
    value: m.value,
  }));
}

/**
 * Find first memory matching keyword and delete it. Returns deleted doc or null.
 */
async function deleteByKeyword(userId, keyword) {
  if (!userId || !keyword) return null;
  const candidates = await keywordSearch(userId, keyword, 10);
  const target = candidates[0] || null;
  if (!target) return null;
  await remove(userId, target.id);
  return target;
}

/**
 * Find first memory matching keyword and update its value. Returns updated doc or null.
 */
async function updateByKeyword(userId, keyword, newValue) {
  if (!userId || !keyword || newValue === undefined) return null;
  const candidates = await keywordSearch(userId, keyword, 10);
  const target = candidates[0] || null;
  if (!target) return null;
  const kws = typeof newValue === 'string'
    ? newValue.split(/\s+/).map(w => w.replace(/\W/g, '').toLowerCase()).filter(w => w.length > 2).slice(0, 10)
    : [];
  return update(userId, target.id, { value: newValue, keywords: kws });
}

/**
 * Delete memories not updated within the last `daysAgo` days. Returns count deleted.
 */
async function clearOldMemories(userId, daysAgo = 30) {
  const cutoff = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const result = await Memory.deleteMany({ userId, updatedAt: { $lt: cutoff } });
  return result.deletedCount || 0;
}

/** Export all memories for user (JSON). */
async function exportForUser(userId) {
  const list = await Memory.find({ userId }).sort({ updatedAt: -1 }).lean();
  return list.map(({ _id, type, category, value, keywords, createdAt, updatedAt }) => ({
    id: String(_id),
    type,
    category,
    value,
    keywords: keywords || [],
    createdAt,
    updatedAt,
  }));
}

/** Check for conflict: same type+category, different value. Returns existing memory if conflict. */
async function checkConflict(userId, { type, category = '', value }) {
  const existing = await Memory.findOne({
    userId,
    type: String(type).trim(),
    category: String(category).trim(),
  }).lean();
  if (!existing) return null;
  const newVal = typeof value === 'string' ? value : JSON.stringify(value);
  const oldVal = typeof existing.value === 'string' ? existing.value : JSON.stringify(existing.value);
  if (newVal === oldVal) return null;
  return { id: existing._id, type: existing.type, category: existing.category, value: existing.value };
}

/** Group memories by type for dashboard (Preferences, Goals, Projects, Notes). */
async function getGroupedByType(userId) {
  const list = await Memory.find({ userId }).sort({ updatedAt: -1 }).lean();
  const groups = {};
  for (const m of list) {
    const t = m.type || 'note';
    if (!groups[t]) groups[t] = [];
    groups[t].push({
      id: m._id,
      type: m.type,
      category: m.category,
      value: m.value,
      keywords: m.keywords || [],
      updatedAt: m.updatedAt,
    });
  }
  return groups;
}

module.exports = {
  save,
  retrieve,
  getById,
  update,
  remove,
  deleteByKeyword,
  updateByKeyword,
  clearOldMemories,
  keywordSearch,
  semanticSearch,
  getRelevantForContext,
  getPreferences,
  refreshMemoryCount,
  exportForUser,
  checkConflict,
  getGroupedByType,
};
