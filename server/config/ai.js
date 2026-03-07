/**
 * AI configuration - timeout, provider, availability
 * AI is Enhancement Layer only; system must work without it.
 */

module.exports = {
  timeoutMs: parseInt(process.env.AI_TIMEOUT_MS, 10) || 10000,
  provider: process.env.AI_PROVIDER || 'groq',
  groqApiKey: process.env.GROQ_API_KEY || '',
  /** Initial availability; actual state is in fallbackManager / systemHealth */
  defaultAvailable: true,
};
