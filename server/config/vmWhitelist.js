/**
 * Part 8 - Allowed VM commands. Only whitelisted commands can be executed.
 */
const DEFAULT = [
  // Linux/VM aliases
  'uptime', 'df', 'df -h', 'free', 'free -m', 'status',

  // Screenshot
  'screenshot',

  // System info
  'battery', 'cpu', 'ram', 'disk', 'network', 'hostname', 'os', 'processes',

  // Power & screen
  'battery saver on', 'battery saver off',
  'sleep', 'lock', 'display off',

  // Volume
  'volume mute', 'volume unmute', 'volume up', 'volume down', 'get volume',

  // App launchers
  'open notepad', 'open calculator', 'open explorer', 'open chrome',
  'open spotify', 'open vscode', 'open terminal', 'open settings',
  'open camera', 'open paint', 'open task manager', 'open finder', 'open safari',

  // Clipboard
  'clipboard', 'clear clipboard',

  // Network extras
  'wifi name', 'wifi list', 'internet test', 'ip info',

  // Files
  'recent files', 'downloads',
];

function getWhitelist() {
  const env = process.env.VM_WHITELIST;
  if (!env) return DEFAULT;
  const extra = env.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);
  return [...new Set([...DEFAULT.map((c) => c.toLowerCase()), ...extra])];
}

function isAllowed(command) {
  if (!command || typeof command !== 'string') return false;
  const normalized = command.trim().toLowerCase();
  const allowed = getWhitelist();
  return allowed.includes(normalized);
}

module.exports = { getWhitelist, isAllowed };
