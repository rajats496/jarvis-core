/**
 * In-memory system health state for /system/status
 * Tracks: AI failure count, fallback state, memory count, command usage, VM load
 * Persisted metrics (memory count, command usage) will come from DB in later parts.
 */

const state = {
  aiFailureCount: 0,
  aiUsageCount: 0,
  fallbackUsageCount: 0,
  memoryCount: 0,
  commandUsageCount: 0,
  vmLoadInfo: null,
  lastUpdated: null,
};

function getState() {
  return { ...state, lastUpdated: state.lastUpdated || new Date().toISOString() };
}

function incrementAiFailureCount() {
  state.aiFailureCount += 1;
  state.lastUpdated = new Date().toISOString();
}

function incrementAiUsageCount() {
  state.aiUsageCount += 1;
  state.lastUpdated = new Date().toISOString();
}

function incrementFallbackUsageCount() {
  state.fallbackUsageCount += 1;
  state.lastUpdated = new Date().toISOString();
}

function setMemoryCount(count) {
  state.memoryCount = count;
  state.lastUpdated = new Date().toISOString();
}

function setCommandUsageCount(count) {
  state.commandUsageCount = count;
  state.lastUpdated = new Date().toISOString();
}

function setVmLoadInfo(info) {
  state.vmLoadInfo = info;
  state.lastUpdated = new Date().toISOString();
}

function resetAiFailureCount() {
  state.aiFailureCount = 0;
  state.lastUpdated = new Date().toISOString();
}

module.exports = {
  getState,
  incrementAiFailureCount,
  incrementAiUsageCount,
  incrementFallbackUsageCount,
  setMemoryCount,
  setCommandUsageCount,
  setVmLoadInfo,
  resetAiFailureCount,
};
