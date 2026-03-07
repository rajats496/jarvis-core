/**
 * Backend Part 6 - Conversation history. Store chat logs, get recent for AI context, search.
 * One conversation doc per user (single thread); messages array capped to avoid huge docs.
 */
const Conversation = require('../models/Conversation');

const MAX_MESSAGES_PER_CONVERSATION = 500;

async function getOrCreateConversation(userId) {
  let doc = await Conversation.findOne({ userId }).sort({ updatedAt: -1 }).lean();
  if (doc) return doc;
  const created = await Conversation.create({ userId, messages: [], title: 'Chat' });
  return created.toObject ? created.toObject() : created;
}

/**
 * Append one user message and one assistant reply. Trims messages array if over cap.
 */
async function appendExchange(userId, userContent, assistantContent) {
  if (!userId || userContent === undefined || assistantContent === undefined) return;
  const doc = await Conversation.findOne({ userId }).sort({ updatedAt: -1 });
  if (!doc) {
    await Conversation.create({
      userId,
      messages: [
        { role: 'user', content: String(userContent).slice(0, 10000) },
        { role: 'assistant', content: String(assistantContent).slice(0, 10000) },
      ],
      title: 'Chat',
    });
    return;
  }
  doc.messages.push(
    { role: 'user', content: String(userContent).slice(0, 10000) },
    { role: 'assistant', content: String(assistantContent).slice(0, 10000) }
  );
  if (doc.messages.length > MAX_MESSAGES_PER_CONVERSATION) {
    doc.messages = doc.messages.slice(-MAX_MESSAGES_PER_CONVERSATION);
  }
  await doc.save();
}

/**
 * Get last N messages for AI context. Returns [{ role, content }] (oldest first).
 */
async function getRecent(userId, limit = 10) {
  if (!userId) return [];
  const doc = await Conversation.findOne({ userId }).sort({ updatedAt: -1 }).lean();
  if (!doc || !Array.isArray(doc.messages) || doc.messages.length === 0) return [];
  const slice = doc.messages.slice(-limit);
  return slice.map((m) => ({ role: m.role, content: m.content || '' }));
}

/**
 * Search in conversation messages. Returns array of { role, content, timestamp } for matching messages.
 */
async function search(userId, query, limit = 20) {
  if (!userId) return [];
  const q = String(query).trim();
  if (!q) return [];
  const doc = await Conversation.findOne({ userId }).sort({ updatedAt: -1 }).lean();
  if (!doc || !Array.isArray(doc.messages)) return [];
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const matches = doc.messages.filter((m) => regex.test(m.content || ''));
  return matches.slice(-limit).map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp }));
}

/**
 * List recent conversations (for future multi-thread: now returns single thread summary).
 */
async function list(userId, limit = 1) {
  if (!userId) return [];
  const list = await Conversation.find({ userId }).sort({ updatedAt: -1 }).limit(limit).lean();
  return list.map((c) => ({
    id: c._id,
    title: c.title || 'Chat',
    messageCount: (c.messages || []).length,
    updatedAt: c.updatedAt,
  }));
}

module.exports = {
  appendExchange,
  getRecent,
  search,
  list,
  getOrCreateConversation,
};
