/**
 * Backend Part 8 - Secure VM command service. Whitelist, safe mode, proxy to VM microservice or return not configured.
 */
const featureFlags = require('../config/featureFlags');
const loadGuard = require('../utils/loadGuard');
const vmWhitelist = require('../config/vmWhitelist');
const commandLogService = require('./commandLog.service');
const activityService = require('./activity.service');
const systemHealth = require('../config/systemHealth');
const settingsService = require('./settings.service');
const logger = require('../utils/logger');
const User = require('../models/User');

const VM_SERVICE_URL = process.env.VM_SERVICE_URL || '';
const TIMEOUT_MS = 15000;

function isConfigured() {
  return Boolean(VM_SERVICE_URL && VM_SERVICE_URL.trim());
}

/**
 * Execute a command: check feature flag, safe mode, whitelist; then proxy to VM_SERVICE_URL or return error.
 * Logs every attempt to CommandLog and activity; increments command usage count on success.
 */
async function execute(userId, command) {
  const cmd = String(command || '').trim();
  if (!cmd) {
    return { success: false, result: 'No command provided.' };
  }

  if (!featureFlags.vmServiceEnabled) {
    await commandLogService.log(userId, cmd, 'VM service disabled.', false).catch(() => { });
    return { success: false, result: 'VM service is disabled.' };
  }

  // Check user's safe mode setting, role, and personal VM URL
  let userSafeModeSetting = false;
  let personalVmUrl = '';
  let userRole = 'user';

  if (userId) {
    try {
      const userSettings = await settingsService.get(userId);
      userSafeModeSetting = userSettings?.safeModeEnabled === true;
      personalVmUrl = userSettings?.vmUrl || '';

      const userDoc = await User.findById(userId).lean();
      if (userDoc) {
        userRole = userDoc.role || 'user';
      }
    } catch {
      userSafeModeSetting = false;
    }
  }

  // Check system load safe mode
  const systemLoadSafeMode = !loadGuard.isUnderLoad();

  // If either user enabled safe mode OR system is under load, block VM commands
  if (userSafeModeSetting || systemLoadSafeMode) {
    const reason = userSafeModeSetting && systemLoadSafeMode
      ? 'Safe mode: VM commands disabled (user enabled + high load).'
      : userSafeModeSetting
        ? 'Safe mode: VM commands disabled (user enabled).'
        : 'Safe mode: VM commands disabled (high load).';
    await commandLogService.log(userId, cmd, reason, false).catch(() => { });
    return { success: false, result: reason };
  }

  if (!vmWhitelist.isAllowed(cmd)) {
    await commandLogService.log(userId, cmd, 'Command not in whitelist.', false).catch(() => { });
    return { success: false, result: 'Command not allowed. Use whitelisted commands only (e.g. uptime, df, free, status).' };
  }

  // Determine target URL for the user
  const globalVmUrl = process.env.VM_SERVICE_URL || '';
  let targetUrl = '';
  let usingGlobal = false;

  if (personalVmUrl && personalVmUrl.trim()) {
    targetUrl = personalVmUrl.trim();
  } else if (globalVmUrl && globalVmUrl.trim()) {
    targetUrl = globalVmUrl.trim();
    usingGlobal = true;
  }

  if (!targetUrl) {
    await commandLogService.log(userId, cmd, 'VM service not configured.', false).catch(() => { });
    return { success: false, result: 'VM service not configured. Set personal VM URL in settings.' };
  }

  // RBAC enforcement: if using global URL, user must be admin
  if (usingGlobal && userRole !== 'admin') {
    await commandLogService.log(userId, cmd, 'Unauthorized: Admin role required for global VM.', false).catch(() => { });
    return { success: false, result: 'Permission denied. Please configure your personal VM URL in your Dashboard Settings.' };
  }

  let result;
  let success = false;
  try {
    const url = targetUrl.replace(/\/$/, '') + '/execute';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json().catch(() => ({}));
    success = res.ok && (data.success === true || data.ok === true);
    // data.result → data.output → data.error → HTTP status text (last resort)
    result = data.result != null ? String(data.result)
           : data.output != null ? String(data.output)
           : data.error  != null ? String(data.error)
           : `Agent returned HTTP ${res.status}`;
    if (!res.ok) {
      logger.warn('VM agent error response', { status: res.status, command: cmd, error: data.error });
    }
    // Pass through image type if present (for screenshot)
    if (data.type === 'image') {
      return { success, result, type: 'image', mimeType: data.mimeType || 'image/jpeg' };
    }
  } catch (err) {
    result = err.name === 'AbortError' ? 'VM request timed out.' : (err.message || 'VM request failed.');
    logger.warn('VM proxy error', { command: cmd, err: err.message });
  }

  await commandLogService.log(userId, cmd, result, success).catch(() => { });
  activityService.log(userId, 'vm_command', { command: cmd, success }).catch(() => { });
  if (success) {
    const state = systemHealth.getState();
    systemHealth.setCommandUsageCount((state.commandUsageCount || 0) + 1);
  }

  return { success, result };
}

module.exports = { execute, isConfigured, isAllowed: vmWhitelist.isAllowed };
