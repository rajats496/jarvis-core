/**
 * Safe executor - timeout protection and error boundary for AI / external calls
 * Used in Part 3 for AI; prevents hung requests.
 */

const logger = require('./logger');
const fallbackManager = require('./fallbackManager');

/**
 * Run an async function with a timeout. On timeout or throw, records failure and returns null.
 * @param {Promise<any>} promise - The operation (e.g. AI call)
 * @param {number} timeoutMs - Max wait time
 * @param {string} label - For logging
 * @returns {Promise<any|null>} Result or null on failure/timeout
 */
async function withTimeout(promise, timeoutMs, label = 'operation') {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    logger.warn(`${label} failed:`, err.message);
    fallbackManager.recordAiFailure();
    return null;
  }
}

module.exports = { withTimeout };
