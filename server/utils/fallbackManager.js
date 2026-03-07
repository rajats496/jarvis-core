/**
 * AI resilience: availability flag, circuit breaker (3 failures → disable AI for 5 min)
 * Graceful degradation is mandatory.
 */

const systemHealth = require('../config/systemHealth');
const logger = require('./logger');

const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

let aiAvailable = true;
let circuitOpenUntil = null;

function isAiAvailable() {
  if (circuitOpenUntil && Date.now() < circuitOpenUntil) {
    return false;
  }
  if (circuitOpenUntil && Date.now() >= circuitOpenUntil) {
    circuitOpenUntil = null;
    aiAvailable = true;
    systemHealth.resetAiFailureCount();
    logger.info('Circuit breaker: cooldown ended, AI re-enabled');
  }
  return aiAvailable;
}

function setAiAvailable(available) {
  aiAvailable = !!available;
}

function recordAiFailure() {
  systemHealth.incrementAiFailureCount();
  const state = systemHealth.getState();
  if (state.aiFailureCount >= FAILURE_THRESHOLD) {
    circuitOpenUntil = Date.now() + COOLDOWN_MS;
    aiAvailable = false;
    logger.warn(`Circuit breaker: AI disabled for ${COOLDOWN_MS / 60000} minutes after ${FAILURE_THRESHOLD} failures`);
  }
}

function recordAiSuccess() {
  systemHealth.incrementAiUsageCount();
}

function recordFallbackUsage() {
  systemHealth.incrementFallbackUsageCount();
}

function getFallbackState() {
  const open = circuitOpenUntil && Date.now() < circuitOpenUntil;
  return {
    fallbackActive: !isAiAvailable(),
    circuitOpen: open,
    cooldownEndsAt: circuitOpenUntil || null,
  };
}

module.exports = {
  isAiAvailable,
  setAiAvailable,
  recordAiFailure,
  recordAiSuccess,
  recordFallbackUsage,
  getFallbackState,
};
