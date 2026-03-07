/**
 * Backend Part 5 - Embedding service for vector semantic memory.
 * Uses OpenAI text-embedding-3-small when OPENAI_API_KEY is set; otherwise disabled (fallback to keyword).
 */
const logger = require('../utils/logger');

const OPENAI_EMBED_URL = 'https://api.openai.com/v1/embeddings';
const EMBED_MODEL = 'text-embedding-3-small';
const EMBED_DIM = 1536;
const MAX_INPUT_LENGTH = 8000;

function isAvailable() {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim());
}

/**
 * Get embedding vector for text. Returns array of numbers or null if disabled/failed.
 */
async function embed(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim().slice(0, MAX_INPUT_LENGTH);
  if (!trimmed) return null;
  if (!isAvailable()) return null;

  const apiKey = process.env.OPENAI_API_KEY.trim();
  try {
    const res = await fetch(OPENAI_EMBED_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_EMBED_MODEL || EMBED_MODEL,
        input: trimmed,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      logger.warn('Embedding API error', { status: res.status, body: errText.slice(0, 200) });
      return null;
    }
    const data = await res.json();
    const vec = data.data?.[0]?.embedding;
    if (!Array.isArray(vec) || vec.length === 0) return null;
    return vec.map(Number);
  } catch (err) {
    logger.warn('Embedding request failed', err.message);
    return null;
  }
}

function getDimension() {
  return EMBED_DIM;
}

module.exports = {
  embed,
  isAvailable,
  getDimension,
};
