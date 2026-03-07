/**
 * Rule-based task and goal intent parsing. No AI.
 */

/** Convert word-form numbers (spoken by voice) OR digit strings to an integer. Returns null if unrecognized. */
const WORD_NUMBERS = {
  one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10,
  first:1, second:2, third:3, fourth:4, fifth:5, sixth:6, seventh:7, eighth:8, ninth:9, tenth:10,
  '1st':1, '2nd':2, '3rd':3, '4th':4, '5th':5, '6th':6, '7th':7, '8th':8, '9th':9, '10th':10,
};
function wordToNumber(token) {
  if (!token) return null;
  const t = token.toLowerCase().trim();
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  return WORD_NUMBERS[t] || null;
}
/** Regex that matches a digit OR a word-number */
const NUM_PAT = '(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th)';

function parseAddTask(message) {
  const m = message.trim();
  // Require "add" before "task", OR "task:" with a colon, OR "todo:" at the start.
  // This prevents "Mark task 2 done" / "Delete task 3" from matching.
  const match =
    m.match(/^add\s+task:?\s+(.+)/i) ||
    m.match(/^task:\s+(.+)/i) ||
    m.match(/^todo:?\s+(.+)/i);
  return match ? match[1].trim() : null;
}

function isListTasks(message) {
  return /show\s+(my\s+|all\s+)?tasks?/i.test(message) ||
         /list\s+(my\s+|all\s+)?tasks?/i.test(message) ||
         /my\s+todos?/i.test(message) ||
         /what\s+tasks?\s+do\s+i\s+have/i.test(message) ||
         /all\s+tasks?/i.test(message);
}

/** Matches "what's pending?", "show pending tasks", "pending tasks" */
function isPendingTasksIntent(message) {
  return /what'?s?\s+pending/i.test(message) ||
         /show\s+pending\s+tasks?/i.test(message) ||
         /pending\s+tasks?/i.test(message) ||
         /tasks\s+pending/i.test(message);
}

/** Matches bare "mark a task done" / "complete a task" with NO number — guide user */
function isMarkTaskDoneGuide(message) {
  const m = message.trim();
  return (/mark\s+a\s+task\s+done/i.test(m) || /complete\s+a\s+task/i.test(m)) &&
         parseMarkTaskDone(m) === null;
}

function parseMarkTaskDone(message) {
  const m = message.trim();
  const re = new RegExp(
    `(?:mark\\s+task\\s+${NUM_PAT}\\s+(?:as\\s+)?done|task\\s+${NUM_PAT}\\s+done|complete\\s+task\\s+${NUM_PAT}|finish\\s+task\\s+${NUM_PAT}|done\\s+task\\s+${NUM_PAT})`, 'i'
  );
  const match = m.match(re);
  if (!match) return null;
  // First non-undefined capture group is the number token
  const token = match[1] || match[2] || match[3] || match[4] || match[5];
  return wordToNumber(token);
}

function parseGoal(message) {
  const m = message.trim();
  const match = m.match(/my\s+goal\s+is\s+to\s+(.+?)\s+in\s+(\d+)\s+days?/i) || m.match(/goal:?\s+(.+?)\s+in\s+(\d+)\s+days?/i);
  if (!match) return null;
  return { title: match[1].trim(), daysTotal: parseInt(match[2], 10) };
}

function isListGoals(message) {
  return /show\s+(my\s+|all\s+)?goals?/i.test(message) ||
         /list\s+(my\s+)?goals?/i.test(message) ||
         /my\s+goals?/i.test(message) ||
         /goal\s+stats?/i.test(message) ||
         /how\s+(am\s+i|are\s+my)\s+(progressing|doing)/i.test(message) ||
         /what\s+(are\s+)?my\s+goals?/i.test(message);
}

/** "mark goal N done/achieved/complete" → number */
function parseMarkGoalComplete(message) {
  const m = message.trim();
  const re = new RegExp(
    `(?:mark|complete|finish|achieve)\\s+(?:my\\s+)?goal\\s+(?:number\\s+|#)?${NUM_PAT}\\s*(?:as\\s+)?(?:done|complete|completed|achieved|finished)?|goal\\s+${NUM_PAT}\\s+(?:done|complete|achieved|finished)`, 'i'
  );
  const match = m.match(re);
  if (!match) return null;
  const token = match[1] || match[2];
  return wordToNumber(token);
}

/** "delete/remove goal N" → number */
function parseDeleteGoal(message) {
  const m = message.trim();
  const re = new RegExp(
    `(?:delete|remove|cancel)\\s+(?:my\\s+)?goal\\s+(?:number\\s+|#)?${NUM_PAT}|goal\\s+${NUM_PAT}\\s+(?:delete|remove)`, 'i'
  );
  const match = m.match(re);
  if (!match) return null;
  const token = match[1] || match[2];
  return wordToNumber(token);
}

/** "update goal N progress to X days" / "log X days for goal N" / "add X days to goal N" → { index, days } */
function parseUpdateGoalProgress(message) {
  const m = message.trim();
  // "update goal 1 progress to 5 days" / "set goal 2 to 10 days done"
  let match = m.match(new RegExp(`(?:update|set)\\s+(?:my\\s+)?goal\\s+(?:number\\s+|#)?${NUM_PAT}\\s+(?:progress\\s+)?to\\s+(\\d+)\\s+days?`, 'i'));
  if (match) return { index: wordToNumber(match[1]), days: parseInt(match[2], 10) };
  // "log 5 days for goal 2"
  match = m.match(new RegExp(`log\\s+(\\d+)\\s+days?\\s+(?:for|on|to)\\s+(?:goal\\s+(?:number\\s+|#)?)?${NUM_PAT}`, 'i'));
  if (match) return { index: wordToNumber(match[2]), days: parseInt(match[1], 10) };
  // "add 3 days to goal 1" / "worked 3 days on goal 1"
  match = m.match(new RegExp(`(?:add|worked?|spent?)\\s+(\\d+)\\s+days?\\s+(?:to|on|for)\\s+(?:(my\\s+)?goal\\s+(?:number\\s+|#)?)?${NUM_PAT}`, 'i'));
  if (match) return { index: wordToNumber(match[3] || match[2]), days: parseInt(match[1], 10) };
  return null;
}

function parseCommandHistoryIntent(message) {
  const m = message.trim();
  const match = m.match(/show\s+(?:last\s+)?(\d+)\s+(?:vm\s+)?commands?/i) || m.match(/last\s+(\d+)\s+(?:vm\s+)?commands?/i) || m.match(/command\s+history\s*(?:\((\d+)\))?/i);
  if (match) return Math.min(parseInt(match[1], 10) || 5, 50);
  if (/show\s+(?:vm\s+)?commands?/i.test(m) || /command\s+history/i.test(m)) return 5;
  return null;
}

function isExportMemoriesIntent(message) {
  return /export\s+my\s+memories?/i.test(message.trim()) || /download\s+memories?/i.test(message.trim());
}

/**
 * Parse conversation search: "search my chats about MongoDB", "show previous chats about Python"
 * Returns the search query string or null
 */
function parseConversationSearch(message) {
  const m = message.trim();
  // Pattern 1: "search my chats about X", "search chats about X"
  let match = m.match(/search\s+(?:my\s+)?chats?\s+(?:about|for|on)\s+(.+)/i);
  if (match) return match[1].trim();
  
  // Pattern 2: "show previous chats about X", "find chats about X"
  match = m.match(/(?:show|find|get)\s+(?:previous|past|my)?\s*chats?\s+(?:about|for|on|with)\s+(.+)/i);
  if (match) return match[1].trim();
  
  // Pattern 3: "what did we discuss about X", "find conversation about X"
  match = m.match(/(?:what\s+did\s+(?:we|i)\s+(?:discuss|talk|chat)\s+about|find\s+conversation\s+about)\s+(.+)/i);
  if (match) return match[1].trim();
  
  // Pattern 4: "search conversations for X"
  match = m.match(/search\s+conversations?\s+(?:for|about)\s+(.+)/i);
  if (match) return match[1].trim();
  
  return null;
}

/**
 * Parse specific usage stats queries: "how many commands did I run?", "how many memories?"
 * Returns { type: 'commands'|'memories'|'tasks'|'goals'|'ai_calls' } or null
 */
function parseUsageStatsQuery(message) {
  const m = message.trim();
  
  // VM commands count
  if (/how\s+many\s+(?:vm\s+)?commands?/i.test(m) || /(?:vm\s+)?command\s+count/i.test(m)) {
    return { type: 'commands' };
  }
  
  // Memory count
  if (/how\s+many\s+memories/i.test(m) || /memory\s+count/i.test(m) || /memories\s+do\s+i\s+have/i.test(m)) {
    return { type: 'memories' };
  }
  
  // Task count
  if (/how\s+many\s+tasks?/i.test(m) || /task\s+count/i.test(m) || /tasks?\s+do\s+i\s+have/i.test(m)) {
    return { type: 'tasks' };
  }
  
  // Goal count
  if (/how\s+many\s+goals?/i.test(m) || /goal\s+count/i.test(m)) {
    return { type: 'goals' };
  }
  
  // AI calls count
  if (/how\s+many\s+ai\s+calls?/i.test(m) || /ai\s+(?:usage|call)\s+count/i.test(m)) {
    return { type: 'ai_calls' };
  }
  
  // Reminder count
  if (/how\s+many\s+reminders?/i.test(m) || /reminder\s+count/i.test(m)) {
    return { type: 'reminders' };
  }
  
  return null;
}

/**
 * Parse settings change commands: "enable safe mode", "turn off voice", "disable concise mode"
 * Returns { setting: string, value: boolean } or null
 */
function parseSettingsChange(message) {
  const m = message.trim();
  
  // Map natural language to setting keys
  const settingMap = {
    'voice': 'voiceEnabled',
    'safe mode': 'safeModeEnabled',
    'fallback': 'fallbackModeEnabled',
    'fallback mode': 'fallbackModeEnabled',
    'concise': 'conciseResponses',
    'concise mode': 'conciseResponses',
    'concise responses': 'conciseResponses',
    'system metrics': 'showSystemMetrics',
    'metrics': 'showSystemMetrics',
  };
  
  // Enable patterns
  const enableMatch = m.match(/(?:enable|turn\s+on|activate|switch\s+on)\s+(.+)/i);
  if (enableMatch) {
    const settingName = enableMatch[1].trim().toLowerCase();
    const settingKey = settingMap[settingName];
    if (settingKey) return { setting: settingKey, value: true };
  }
  
  // Disable patterns
  const disableMatch = m.match(/(?:disable|turn\s+off|deactivate|switch\s+off)\s+(.+)/i);
  if (disableMatch) {
    const settingName = disableMatch[1].trim().toLowerCase();
    const settingKey = settingMap[settingName];
    if (settingKey) return { setting: settingKey, value: false };
  }
  
  // Toggle/set patterns: "set voice to on", "voice on", "voice off"
  for (const [name, key] of Object.entries(settingMap)) {
    const onMatch = m.match(new RegExp(`${name.replace(/\s+/g, '\\s+')}\\s+on`, 'i'));
    if (onMatch) return { setting: key, value: true };
    
    const offMatch = m.match(new RegExp(`${name.replace(/\s+/g, '\\s+')}\\s+off`, 'i'));
    if (offMatch) return { setting: key, value: false };
    
    const setMatch = m.match(new RegExp(`set\\s+${name.replace(/\s+/g, '\\s+')}\\s+(?:to\\s+)?(on|off|true|false|enabled?|disabled?)`, 'i'));
    if (setMatch) {
      const val = setMatch[1].toLowerCase();
      return { setting: key, value: ['on', 'true', 'enable', 'enabled'].includes(val) };
    }
  }
  
  return null;
}

/**
 * Parse suggestion requests: "suggest a project", "recommend tools", "what should I learn"
 * Returns { type: 'projects'|'learning'|'tools'|'skills', language?: string } or null
 */
function parseSuggestionRequest(message) {
  const m = message.toLowerCase().trim();

  // Extract inline language hint: "suggest a Python project", "recommend JavaScript tools"
  const KNOWN_LANGS = ['python', 'javascript', 'java', 'cpp', 'c\\+\\+', 'ruby', 'go', 'rust', 'php', 'swift', 'kotlin', 'typescript', 'node', 'react', 'django', 'flask'];
  let inlineLang = null;
  for (const lang of KNOWN_LANGS) {
    if (new RegExp(`\\b${lang}\\b`, 'i').test(m)) {
      inlineLang = lang.replace('c\\+\\+', 'cpp').replace('node', 'javascript').replace('react', 'javascript').replace('django', 'python').replace('flask', 'python');
      break;
    }
  }

  // Project suggestions
  if (
    /suggest\s+(?:me\s+)?(?:a\s+|some\s+)?projects?/i.test(m) ||
    /recommend\s+(?:me\s+)?(?:a\s+|some\s+)?projects?/i.test(m) ||
    /(?:give\s+me|show\s+me)\s+(?:some\s+)?project\s+(?:ideas?|suggestions?)/i.test(m) ||
    /what\s+(?:kind\s+of\s+)?projects?\s+(?:should|can|could)\s+i\s+(?:build|make|create|work\s+on)/i.test(m) ||
    /what\s+(?:should|can|could)\s+i\s+build/i.test(m) ||
    /project\s+ideas?/i.test(m) ||
    /what\s+project\s+(?:should|can|could)\s+i/i.test(m) ||
    /(?:any|some)\s+(?:good\s+)?project\s+(?:ideas?|suggestions?)/i.test(m)
  ) {
    return { type: 'projects', language: inlineLang };
  }

  // Learning suggestions
  if (
    /what\s+should\s+i\s+learn/i.test(m) ||
    /suggest\s+(?:something\s+to\s+|me\s+(?:something\s+to\s+)?)?learn/i.test(m) ||
    /recommend\s+(?:something\s+to\s+)?learn/i.test(m) ||
    /(?:give\s+me|show\s+me)\s+(?:some\s+)?(?:learning\s+)?(?:topics?|things?\s+to\s+learn)/i.test(m) ||
    /learning\s+(?:path|suggestions?|ideas?|topics?)/i.test(m) ||
    /what\s+(?:topics?|skills?)\s+should\s+i\s+(?:study|learn|focus\s+on)/i.test(m)
  ) {
    return { type: 'learning', language: inlineLang };
  }

  // Tool suggestions
  if (
    /suggest\s+(?:me\s+)?(?:some\s+)?tools?/i.test(m) ||
    /recommend\s+(?:me\s+)?(?:some\s+)?tools?/i.test(m) ||
    /what\s+tools?\s+(?:should|can|could)\s+i\s+(?:use|try)/i.test(m) ||
    /(?:give\s+me|show\s+me)\s+(?:some\s+)?tool\s+(?:suggestions?|recommendations?)/i.test(m) ||
    /tools?\s+for\b/i.test(m)
  ) {
    return { type: 'tools', language: inlineLang };
  }

  // Skill suggestions
  if (
    /what\s+skills?\s+(?:should|do)\s+i/i.test(m) ||
    /suggest\s+(?:me\s+)?(?:some\s+)?skills?/i.test(m) ||
    /recommend\s+(?:me\s+)?(?:some\s+)?skills?/i.test(m) ||
    /(?:give\s+me|show\s+me)\s+(?:some\s+)?skill\s+(?:suggestions?|recommendations?)/i.test(m) ||
    /skills?\s+(?:to\s+)?(?:learn|develop|improve)/i.test(m)
  ) {
    return { type: 'skills', language: inlineLang };
  }

  return null;
}

/**
 * Parse delete task commands: "delete task 2", "remove task 3", "cancel task 1"
 * Returns task number (1-based) or null
 */
function parseDeleteTask(message) {
  const m = message.trim();
  const re = new RegExp(
    `(?:delete|remove|cancel)\\s+task\\s+${NUM_PAT}|task\\s+${NUM_PAT}\\s+(?:delete|remove|cancel)`, 'i'
  );
  const match = m.match(re);
  if (!match) return null;
  const token = match[1] || match[2];
  return wordToNumber(token);
}

/**
 * Parse app configuration queries: "is safe mode enabled?", "is voice on?", "what is my safe mode setting?"
 * Returns { setting: string } or null — the key of the setting being queried.
 */
function parseAppConfigQuery(message) {
  const m = message.trim().toLowerCase();

  // Map of natural language names to setting keys
  const settingMap = [
    { names: ['safe mode', 'safemode'], key: 'safeModeEnabled' },
    { names: ['voice'], key: 'voiceEnabled' },
    { names: ['fallback mode', 'fallback'], key: 'fallbackModeEnabled' },
    { names: ['concise mode', 'concise responses', 'concise'], key: 'conciseResponses' },
    { names: ['system metrics', 'metrics'], key: 'showSystemMetrics' },
  ];

  // Patterns: "is X enabled/on/active/disabled/off?", "is X turned on/off?", "what is my X setting?", "check X status"
  const queryPatterns = [
    /^is\s+(.+?)\s+(?:enabled|disabled|on|off|active|inactive)\??$/i,
    /^(?:is|are)\s+(.+?)\s+(?:turned|switched)\s+(?:on|off)\??$/i,
    /^what\s+is\s+(?:my\s+)?(.+?)\s+setting\??$/i,
    /^(?:check|show|get|what(?:'?s|\s+is))\s+(?:my\s+)?(.+?)\s+(?:setting|status|state)\??$/i,
    /^(?:is\s+)?(.+?)\s+(?:currently\s+)?(?:enabled|on|active|disabled|off|inactive)\??$/i,
  ];

  for (const pattern of queryPatterns) {
    const match = m.match(pattern);
    if (match) {
      const fragment = match[1].trim().replace(/\?$/, '').toLowerCase();
      for (const { names, key } of settingMap) {
        if (names.some((n) => fragment === n || fragment.includes(n))) {
          return { setting: key };
        }
      }
    }
  }

  return null;
}

module.exports = { parseAddTask, isListTasks, isPendingTasksIntent, isMarkTaskDoneGuide, parseMarkTaskDone, parseDeleteTask, parseGoal, isListGoals, parseMarkGoalComplete, parseDeleteGoal, parseUpdateGoalProgress, parseCommandHistoryIntent, isExportMemoriesIntent, parseConversationSearch, parseUsageStatsQuery, parseSettingsChange, parseSuggestionRequest, parseAppConfigQuery };
