/**
 * Feature flags - can be toggled without code change
 * Used for fallback mode, safe mode, voice, etc.
 */

module.exports = {
  aiEnabled: process.env.AI_ENABLED !== 'false',
  fallbackModeEnabled: process.env.FALLBACK_MODE_ENABLED === 'true',
  safeModeEnabled: process.env.SAFE_MODE_ENABLED === 'true',
  vmServiceEnabled: process.env.VM_SERVICE_ENABLED !== 'false',
};
