/**
 * System controller - health and status (AI resilience metrics)
 */

const fallbackManager = require('../utils/fallbackManager');
const systemHealth = require('../config/systemHealth');
const loadGuard = require('../utils/loadGuard');
const featureFlags = require('../config/featureFlags');
const aiService = require('../services/ai.service');
const memoryService = require('../services/memory.service');
const settingsService = require('../services/settings.service');

function getHealth(_req, res) {
  res.json({
    status: 'ok',
    service: 'jarvis-backend',
    timestamp: new Date().toISOString(),
  });
}

async function getStatus(req, res) {
  // userId is optional - check auth header manually without requiring auth
  let userId = null;
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    }
  } catch {
    // No valid auth - continue without userId
  }
  
  await memoryService.refreshMemoryCount();
  const healthState = systemHealth.getState();
  const fallbackState = fallbackManager.getFallbackState();
  const loadInfo = loadGuard.getLoadInfo();
  
  // Check both user's setting and system load for safe mode
  let userSafeModeSetting = false;
  if (userId) {
    try {
      const userSettings = await settingsService.get(userId);
      userSafeModeSetting = userSettings?.safeModeEnabled === true;
    } catch {
      // If settings fetch fails, default to false
      userSafeModeSetting = false;
    }
  }
  
  // Safe mode is active if EITHER user enabled it OR system is under load
  const systemLoadSafeMode = !loadGuard.isUnderLoad();
  const safeModeActive = userSafeModeSetting || systemLoadSafeMode;

  const notifications = [];
  if (healthState.memoryCount > 20) {
    notifications.push({ id: 'memory_cleanup', text: 'You have many stored memories. Consider cleaning up.', type: 'info' });
  }
  if (!aiService.isAvailable()) {
    notifications.push({ id: 'ai_unavailable', text: 'AI currently unavailable. Using fallback mode.', type: 'warning' });
  }
  if (safeModeActive) {
    const reason = userSafeModeSetting && systemLoadSafeMode
      ? 'Safe mode active (user enabled + high load). VM commands disabled.'
      : userSafeModeSetting
      ? 'Safe mode active (user enabled). VM commands disabled.'
      : 'Safe mode active due to high load. VM commands disabled.';
    notifications.push({ id: 'safe_mode', text: reason, type: 'warning' });
  }

  res.json({
    aiAvailability: aiService.isAvailable(),
    aiConfigured: aiService.isConfigured(),
    safeModeActive,
    vmCommandsDisabled: safeModeActive,
    notifications,
    fallbackState: {
      fallbackActive: fallbackState.fallbackActive,
      circuitOpen: fallbackState.circuitOpen,
      cooldownEndsAt: fallbackState.cooldownEndsAt,
    },
    aiFailureCount: healthState.aiFailureCount,
    aiUsageCount: healthState.aiUsageCount,
    fallbackUsageCount: healthState.fallbackUsageCount,
    vmLoadInfo: healthState.vmLoadInfo,
    memoryCount: healthState.memoryCount,
    commandUsageCount: healthState.commandUsageCount,
    backendLoad: loadInfo,
    featureFlags: {
      aiEnabled: featureFlags.aiEnabled,
      fallbackModeEnabled: featureFlags.fallbackModeEnabled,
      safeModeEnabled: featureFlags.safeModeEnabled,
      vmServiceEnabled: featureFlags.vmServiceEnabled,
    },
    lastUpdated: healthState.lastUpdated,
  });
}

module.exports = { getHealth, getStatus };
