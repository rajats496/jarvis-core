/**
 * AI service - LLM (Groq) with timeout, circuit breaker, availability check.
 * Enhancement layer only; never required for system to function.
 */

const aiConfig = require('../config/ai');
const featureFlags = require('../config/featureFlags');
const fallbackManager = require('../utils/fallbackManager');
const safeExecutor = require('../utils/safeExecutor');
const logger = require('../utils/logger');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';
const DECOMMISSIONED_MODELS = new Set(['llama3-8b-8192', 'llama3-70b-8192']);
const MAX_CONTENT_LENGTH = 10000;

function getModel() {
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  return DECOMMISSIONED_MODELS.has(model) ? DEFAULT_MODEL : model;
}

function isConfigured() {
  return Boolean(process.env.GROQ_API_KEY || aiConfig.groqApiKey);
}

function isAvailable() {
  if (!featureFlags.aiEnabled) return false;
  if (!isConfigured()) return false;
  return fallbackManager.isAiAvailable();
}

function isValidOutput(text) {
  return typeof text === 'string' && text.trim().length > 0 && text.length <= MAX_CONTENT_LENGTH;
}

async function callGroq(messages, systemPrompt = null) {
  const apiKey = process.env.GROQ_API_KEY || aiConfig.groqApiKey;
  if (!apiKey) {
    logger.warn('AI: GROQ_API_KEY not set');
    return null;
  }
  const body = {
    model: getModel(),
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages,
    ],
    max_tokens: 1024,
    temperature: 0.7,
  };

  const controller = new AbortController();
  const timeoutMs = aiConfig.timeoutMs;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const promise = fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (res) => {
      clearTimeout(timeoutId);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq API ${res.status}: ${errText.slice(0, 200)}`);
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content === undefined || content === null) {
        throw new Error('Invalid AI response: no content');
      }
      return String(content).trim();
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      throw err;
    });

  const result = await safeExecutor.withTimeout(promise, timeoutMs, 'AI');
  if (result === null) return null;
  if (!isValidOutput(result)) {
    logger.warn('AI: invalid output (empty or too long), treating as failure');
    fallbackManager.recordAiFailure();
    return null;
  }
  fallbackManager.recordAiSuccess();
  return result;
}

/**
 * Chat completion. Returns null if AI unavailable, timeout, or invalid output.
 * Caller must use fallback when null.
 */
async function chat(userMessage, options = {}) {
  const { systemPrompt = 'You are Jarvis, a helpful AI assistant. Be concise and accurate.', history = [] } = options;
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    return null;
  }
  const messages = [
    ...history.slice(-10).map((m) => ({ role: m.role || 'user', content: String(m.content || '').slice(0, 2000) })),
    { role: 'user', content: userMessage.trim().slice(0, 4000) },
  ].filter((m) => m.content.length > 0);
  return callGroq(messages, systemPrompt);
}

module.exports = {
  chat,
  callGroq,
  isAvailable,
  isConfigured,
  isValidOutput,
};
