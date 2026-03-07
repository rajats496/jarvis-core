/**
 * Backend Part 7 - Hybrid intent routing. Classify user message into intent + payload.
 * Delegates to reminder, task/goal, memory parsers; adds status, settings, analytics.
 */
const { parseReminder } = require('../utils/reminderIntent');
const { extractSaveValue, isRecallIntent } = require('../utils/memoryIntent');
const {
  parseAddTask,
  isListTasks,
  parseMarkTaskDone,
  parseDeleteTask,
  parseGoal,
  isListGoals,
  parseCommandHistoryIntent,
  isExportMemoriesIntent,
  parseConversationSearch,
  parseUsageStatsQuery,
  parseSettingsChange,
  parseSuggestionRequest,
  parseAppConfigQuery,
} = require('../utils/taskGoalIntent');

const STATUS_PATTERNS = [
  /system\s+status/i,
  /what'?s\s+(?:the\s+)?status/i,
  /show\s+status/i,
  /server\s+status/i,
  /how\s+is\s+(?:the\s+)?(?:system|server)/i,
  /status\s+check/i,
];

const SETTINGS_PATTERNS = [
  /my\s+settings/i,
  /show\s+(?:my\s+)?settings/i,
  /what\s+are\s+my\s+settings/i,
  /settings\s+panel/i,
  /(?:get|show)\s+settings/i,
];

const ANALYTICS_PATTERNS = [
  /my\s+(?:usage|stats|analytics)/i,
  /show\s+(?:my\s+)?(?:usage|stats|analytics)/i,
  /how\s+many\s+(?:ai\s+)?calls/i,
  /usage\s+stats/i,
  /analytics/i,
];

/**
 * Classify message. Returns { intent, payload }.
 * intent: 'reminder'|'task_add'|'task_list'|'task_done'|'goal'|'goal_list'|'command_history'|'export_memories'|'memory_save'|'memory_recall'|'memory_replace'|'status'|'settings'|'analytics'|'chat'
 */
function classify(message) {
  const m = (message || '').trim();
  if (!m) return { intent: 'chat', payload: null };

  const reminder = parseReminder(m);
  if (reminder) return { intent: 'reminder', payload: reminder };

  const taskTitle = parseAddTask(m);
  if (taskTitle) return { intent: 'task_add', payload: taskTitle };
  if (isListTasks(m)) return { intent: 'task_list', payload: null };
  const taskNum = parseMarkTaskDone(m);
  if (taskNum !== null) return { intent: 'task_done', payload: taskNum };
  const deleteNum = parseDeleteTask(m);
  if (deleteNum !== null) return { intent: 'task_delete', payload: deleteNum };

  const goal = parseGoal(m);
  if (goal) return { intent: 'goal', payload: goal };
  if (isListGoals(m)) return { intent: 'goal_list', payload: null };

  const cmdLimit = parseCommandHistoryIntent(m);
  if (cmdLimit !== null) return { intent: 'command_history', payload: cmdLimit };
  // Match explicit commands: "run battery", "execute df -h", "vm uptime"
  const vmRun = m.match(/^(?:run|execute|vm)\s+(.+)$/i);
  if (vmRun && vmRun[1]) return { intent: 'vm_execute', payload: vmRun[1].trim() };

  // Match natural language VM commands (voice-friendly)
  const VM_NATURAL = [
    [/\b(?:check|show|get|what(?:'?s| is)?\s+(?:my|the)?)\s+battery\b/i, 'battery'],
    [/\b(?:check|show|get|what(?:'?s| is)?\s+(?:my|the)?)\s+cpu\b/i, 'cpu'],
    [/\b(?:check|show|get|what(?:'?s| is)?\s+(?:my|the)?)\s+ram\b/i, 'ram'],
    [/\b(?:check|show|get|what(?:'?s| is)?\s+(?:my|the)?)\s+(?:disk|storage|disk\s+space)\b/i, 'disk'],
    [/\b(?:check|show|get|what(?:'?s| is)?\s+(?:my|the)?)\s+(?:network|ip(?:\s+address)?)\b/i, 'network'],
    [/\b(?:check|show|get|what(?:'?s| is)?\s+(?:my|the)?)\s+(?:processes|running\s+apps?)\b/i, 'processes'],
    [/\b(?:check|show|get|what(?:'?s| is)?\s+(?:my|the)?)\s+(?:hostname|computer\s+name)\b/i, 'hostname'],
    [/\b(?:check|show|get|what(?:'?s| is)?\s+(?:my|the)?)\s+(?:os|windows\s+version)\b/i, 'os'],
    [/\b(?:check|show|get|what(?:'?s| is)?\s+(?:the)?)\s+uptime\b/i, 'uptime'],
    [/\b(?:check|show|get|what(?:'?s| is)?\s+(?:the)?)\s+(?:agent\s+)?status\b/i, 'status'],
    [/\bdf\s*-h\b/i, 'df -h'],
    [/\bdf\b/i, 'df'],
    [/\bfree\s*-m\b/i, 'free -m'],
    [/\bhow\s+much\s+(?:disk\s+)?space\b/i, 'disk'],
    [/\bhow\s+much\s+(?:ram|memory)\b/i, 'ram'],
    [/\blist\s+(?:running\s+)?(?:processes|apps)\b/i, 'processes'],
    [/\bmy\s+battery\b/i, 'battery'],
    [/\b(?:lock|lock\s+(?:my\s+)?(?:screen|pc|computer|laptop))\b/i, 'lock'],
    [/\b(?:sleep|put\s+(?:my\s+)?(?:pc|laptop|computer)\s+to\s+sleep)\b/i, 'sleep'],
    [/\b(?:mute|mute\s+(?:the\s+)?(?:volume|sound|audio))\b/i, 'volume mute'],
    [/\b(?:unmute|unmute\s+(?:the\s+)?(?:volume|sound|audio))\b/i, 'volume unmute'],
    [/\b(?:volume\s+up|increase\s+volume|turn\s+up)\b/i, 'volume up'],
    [/\b(?:volume\s+down|decrease\s+volume|turn\s+down)\b/i, 'volume down'],
    [/\bbattery\s+saver\s+on\b/i, 'battery saver on'],
    [/\bbattery\s+saver\s+off\b/i, 'battery saver off'],
    // App launchers
    [/\bopen\s+notepad\b/i, 'open notepad'],
    [/\bopen\s+(?:calculator|calc)\b/i, 'open calculator'],
    [/\bopen\s+(?:file\s+)?explorer\b/i, 'open explorer'],
    [/\bopen\s+(?:google\s+)?chrome\b/i, 'open chrome'],
    [/\bopen\s+spotify\b/i, 'open spotify'],
    [/\bopen\s+(?:vs\s*code|visual\s+studio\s+code)\b/i, 'open vscode'],
    [/\bopen\s+(?:terminal|powershell|cmd)\b/i, 'open terminal'],
    [/\bopen\s+(?:windows\s+)?settings\b/i, 'open settings'],
    [/\bopen\s+(?:paint|mspaint)\b/i, 'open paint'],
    [/\bopen\s+(?:task\s+manager|taskmgr)\b/i, 'open task manager'],
    [/\bopen\s+camera\b/i, 'open camera'],
    [/\bopen\s+finder\b/i, 'open finder'],
    [/\bopen\s+safari\b/i, 'open safari'],
    // Clipboard
    [/\b(?:read|show|get|what(?:'?s| is)?)\s+(?:my\s+)?clipboard\b/i, 'clipboard'],
    [/\bpaste\s+(?:content|text)\b/i, 'clipboard'],
    [/^clipboard$/i, 'clipboard'],
    [/\bclear\s+clipboard\b/i, 'clear clipboard'],
    // Network extras
    [/\b(?:what(?:'?s| is)?\s+(?:my\s+)?wifi|wifi\s+name|connected\s+(?:to\s+)?(?:wifi|network))\b/i, 'wifi name'],
    [/\bwifi\s+list\b|nearby\s+(?:wifi|networks?)\b/i, 'wifi list'],
    [/\b(?:internet\s+(?:test|speed|check)|test\s+internet|is\s+internet\s+working|ping)\b/i, 'internet test'],
    [/\b(?:my\s+)?(?:public\s+)?ip\s+(?:info|address|location)\b/i, 'ip info'],
    // Display
    [/\b(?:turn\s+off\s+(?:the\s+)?(?:display|screen|monitor)|display\s+off|screen\s+off)\b/i, 'display off'],
    // Files
    [/\b(?:recent\s+files?|what\s+did\s+i\s+work\s+on)\b/i, 'recent files'],
    [/\b(?:show\s+)?downloads?\s+(?:folder)?\b/i, 'downloads'],
    // Screenshot
    [/\b(?:screenshot|take\s+(?:a\s+)?screenshot|show\s+(?:my\s+)?screen|capture\s+(?:my\s+)?screen|screen\s+capture)\b/i, 'screenshot'],
  ];
  for (const [pattern, cmd] of VM_NATURAL) {
    if (pattern.test(m)) return { intent: 'vm_execute', payload: cmd };
  }
  if (isExportMemoriesIntent(m)) return { intent: 'export_memories', payload: null };

  const searchQuery = parseConversationSearch(m);
  if (searchQuery) return { intent: 'conversation_search', payload: searchQuery };

  const usageQuery = parseUsageStatsQuery(m);
  if (usageQuery) return { intent: 'usage_stats', payload: usageQuery };

  const settingsChange = parseSettingsChange(m);
  if (settingsChange) return { intent: 'settings_change', payload: settingsChange };

  const configQuery = parseAppConfigQuery(m);
  if (configQuery) return { intent: 'app_config_query', payload: configQuery };

  const suggestionRequest = parseSuggestionRequest(m);
  if (suggestionRequest) return { intent: 'suggestion', payload: suggestionRequest };

  const saveVal = extractSaveValue(m);
  if (saveVal) return { intent: 'memory_save', payload: saveVal };
  if (/replace\s+with\s+(.+)/i.test(m)) return { intent: 'memory_replace', payload: m.match(/replace\s+with\s+(.+)/i)[1].trim() };
  if (isRecallIntent(m)) return { intent: 'memory_recall', payload: null };

  if (STATUS_PATTERNS.some((re) => re.test(m))) return { intent: 'status', payload: null };
  if (SETTINGS_PATTERNS.some((re) => re.test(m))) return { intent: 'settings', payload: null };
  if (ANALYTICS_PATTERNS.some((re) => re.test(m))) return { intent: 'analytics', payload: null };

  return { intent: 'chat', payload: null };
}

module.exports = { classify };
