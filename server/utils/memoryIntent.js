/**
 * Rule-based memory intent from user message (text or transcribed voice).
 * No AI required.
 */

const SAVE_PATTERNS = [
  /remember\s+that\s+(.+)/i,
  /save\s+that\s+(.+)/i,
  /don't\s+forget\s+(.+)/i,
  /store\s+that\s+(.+)/i,
  /remember[:\s]+(.+)/i,
  /save\s+(?:this|it)[:\s]+(.+)/i,
];

const RECALL_PATTERNS = [
  /what\s+do\s+you\s+remember/i,
  /what\s+do\s+you\s+remember\s+about\s+me/i,
  /(?:show\s+)?my\s+preferences?/i,
  /show\s+preferences?/i,
  /what\s+did\s+I\s+tell\s+you/i,
  /recall\s+(?:my\s+)?memories?/i,
  /what\s+have\s+you\s+(?:stored|saved)/i,
  /show\s+(?:my\s+)?memories?/i,
  /what\s+do\s+you\s+know\s+about\s+me/i,
  /list\s+(?:my\s+)?memories?/i,
];

function extractSaveValue(message) {
  const trimmed = message.trim();
  for (const re of SAVE_PATTERNS) {
    const m = trimmed.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

/**
 * Derive preference category from save value so we can have multiple preferences.
 * Smart detection for: programming language, tech stack, career goals, interests, etc.
 * This allows storing multiple different types of preferences without conflicts.
 */
function extractPreferenceCategory(saveValue) {
  if (typeof saveValue !== 'string') return '';
  const v = saveValue.toLowerCase().trim();
  
  // Programming language: "i prefer python", "my favorite language is java"
  if (/(?:i\s+)?(?:prefer|like|use|favorite)\s+(?:programming\s+)?(?:language\s+is\s+)?(?:python|javascript|java|cpp|c\+\+|ruby|go|rust|php|swift|kotlin|typescript)/i.test(v) ||
      /(?:my\s+)?(?:preferred|favorite)\s+language\s+is/i.test(v)) {
    return 'programming_language';
  }
  
  // Tech stack: "i use mern", "i work with django"
  if (/(?:i\s+)?(?:use|work\s+with|prefer)\s+(?:the\s+)?(?:mern|mean|lamp|django|flask|spring|laravel|rails|.net)/i.test(v) ||
      /(?:my\s+)?(?:tech\s+)?stack\s+is/i.test(v)) {
    return 'tech_stack';
  }
  
  // Career goal: "my career goal is", "i want to be a"
  if (/career\s+goal/i.test(v) ||
      /(?:i\s+)?(?:want\s+to\s+be|aim\s+to\s+be|aspire\s+to\s+be)\s+(?:a\s+)?(?:developer|engineer|scientist|designer)/i.test(v)) {
    return 'career_goal';
  }
  
  // Interest: "i'm interested in", "i like ai"
  if (/(?:i\'m|i\s+am)\s+interested\s+in/i.test(v) ||
      /(?:my\s+)?interest\s+(?:is|are)/i.test(v) ||
      /(?:i\s+)?(?:like|love|enjoy)\s+(?:learning\s+about|working\s+on|exploring)\s+(?:ai|web|mobile|data|cloud|security)/i.test(v)) {
    return 'interest';
  }
  
  // Database preference
  if (/(?:i\s+)?(?:prefer|use|like)\s+(?:mongodb|mysql|postgresql|redis|sqlite|oracle)/i.test(v) ||
      /(?:my\s+)?(?:preferred|favorite)\s+database/i.test(v)) {
    return 'database';
  }
  
  // Editor/IDE preference
  if (/(?:i\s+)?(?:use|prefer)\s+(?:vscode|vs\s+code|visual\s+studio|intellij|eclipse|sublime|atom|vim|emacs)/i.test(v) ||
      /(?:my\s+)?(?:preferred|favorite)\s+(?:editor|ide)/i.test(v)) {
    return 'editor';
  }
  
  // Fallback: try to extract from "my preferred X is" or "my favorite X is"
  const m = v.match(/(?:my\s+)?(?:preferred|favorite)\s+([a-z0-9\s]+?)(?:\s+is\s+|\s*$)/i);
  if (m && m[1]) return m[1].trim().toLowerCase().replace(/\s+/g, '_');
  
  // Default: generic preference (will still work but might cause conflicts)
  return '';
}

function isRecallIntent(message) {
  const trimmed = message.trim();
  return RECALL_PATTERNS.some((re) => re.test(trimmed));
}

// Update preference: "Update my preferred language to Go" → { preferenceName: "preferred language", newValue: "Go" }
const UPDATE_PREFERENCE_PATTERNS = [
  /update\s+my\s+(.+?)\s+to\s+(.+)/i,
  /change\s+my\s+(.+?)\s+to\s+(.+)/i,
  /set\s+my\s+(.+?)\s+to\s+(.+)/i,
  /update\s+(.+?)\s+to\s+(.+)/i,
];

function extractUpdatePreference(message) {
  const trimmed = message.trim();
  for (const re of UPDATE_PREFERENCE_PATTERNS) {
    const m = trimmed.match(re);
    if (m && m[1] && m[2]) {
      return { preferenceName: m[1].trim(), newValue: m[2].trim() };
    }
  }
  return null;
}

// Delete preference: "Delete my database preference" → "database"
const DELETE_PREFERENCE_PATTERNS = [
  /delete\s+my\s+(.+?)\s+preference/i,
  /remove\s+my\s+(.+?)\s+preference/i,
  /delete\s+(?:the\s+)?(.+?)\s+preference/i,
  /remove\s+(?:the\s+)?(.+?)\s+preference/i,
];

function extractDeletePreference(message) {
  const trimmed = message.trim();
  for (const re of DELETE_PREFERENCE_PATTERNS) {
    const m = trimmed.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

// ─── Targeted memory query ──────────────────────────────────────────────────
// Matches specific questions like "what is my preferred programming language?"
// Returns { category, label, keyword } or null.

const TARGETED_QUERY_PATTERNS = [
  { re: /what\s+(?:is|was|are)\s+my\s+(?:preferred|favorite|favourite)\s+programming\s+language/i, category: 'programming_language', label: 'programming language' },
  { re: /what\s+(?:language|programming\s+language)\s+do\s+i\s+(?:prefer|use|like)/i, category: 'programming_language', label: 'programming language' },
  { re: /which\s+(?:language|programming\s+language)\s+do\s+i\s+(?:prefer|use)/i, category: 'programming_language', label: 'programming language' },
  { re: /what\s+(?:is|was|are)\s+my\s+(?:preferred|favorite|favourite)\s+(?:tech\s+)?stack/i, category: 'tech_stack', label: 'tech stack' },
  { re: /what\s+(?:tech\s+)?stack\s+do\s+i\s+(?:prefer|use)/i, category: 'tech_stack', label: 'tech stack' },
  { re: /what\s+(?:is|was|are)\s+my\s+(?:career\s+)?goal/i, category: 'career_goal', label: 'career goal' },
  { re: /what\s+(?:is|was|are)\s+my\s+(?:preferred|favorite|favourite)\s+(?:code\s+)?editor/i, category: 'editor', label: 'preferred editor' },
  { re: /what\s+(?:editor|code\s+editor|ide)\s+do\s+i\s+(?:prefer|use)/i, category: 'editor', label: 'preferred editor' },
  { re: /what\s+(?:is|was|are)\s+my\s+(?:preferred|favorite|favourite)\s+(?:data)?base/i, category: 'database', label: 'preferred database' },
  { re: /what\s+(?:database|db)\s+do\s+i\s+(?:prefer|use)/i, category: 'database', label: 'preferred database' },
  { re: /what\s+(?:is|was|are)\s+my\s+(?:interest|hobby|hobbies)/i, category: 'interest', label: 'interests' },
  // Generic dynamic fallback: "what is my preferred X?" / "what is my X?"
  { re: /what\s+(?:is|was|are)\s+my\s+(?:preferred|favorite|favourite)\s+(.+?)[\?\.]*$/i, dynamic: true },
  { re: /what\s+(?:is|was|are)\s+my\s+(.+?)[\?\.]*$/i, dynamic: true },
  { re: /do\s+i\s+(?:prefer|like|use)\s+(.+?)[\?\.]*$/i, dynamic: true },
];

function extractTargetedMemoryQuery(message) {
  const trimmed = message.trim();
  for (const pattern of TARGETED_QUERY_PATTERNS) {
    const m = trimmed.match(pattern.re);
    if (m) {
      if (pattern.dynamic) {
        const keyword = m[1] ? m[1].trim().replace(/[\?\.]+$/, '') : null;
        if (keyword && keyword.length > 1) {
          return { category: null, label: keyword, keyword };
        }
      } else {
        return { category: pattern.category, label: pattern.label, keyword: pattern.label };
      }
    }
  }
  return null;
}

// ─── Delete memory by keyword ──────────────────────────────────────────────
// e.g. "delete memory about dark mode", "forget about Python", "remove that I prefer VSCode"
const DELETE_MEMORY_BY_KEYWORD_PATTERNS = [
  /delete\s+(?:the\s+)?memory\s+about\s+(.+)/i,
  /remove\s+(?:the\s+)?memory\s+about\s+(.+)/i,
  /forget\s+(?:about\s+)?(?:that\s+)?(?:I\s+)?(.+)/i,
  /delete\s+what\s+you\s+(?:know|remember)\s+about\s+(.+)/i,
  /erase\s+(?:the\s+)?memory\s+(?:about\s+|of\s+)(.+)/i,
];

function parseDeleteMemoryByKeyword(message) {
  const trimmed = message.trim();
  // Avoid matching "delete task" / "delete goal" patterns
  if (/delete\s+(?:task|goal|reminder)\b/i.test(trimmed)) return null;
  for (const re of DELETE_MEMORY_BY_KEYWORD_PATTERNS) {
    const m = trimmed.match(re);
    if (m && m[1]) {
      const keyword = m[1].trim().replace(/[?.!]+$/, '');
      if (keyword.length > 1) return keyword;
    }
  }
  return null;
}

// ─── Delete memory by number ────────────────────────────────────────────────
// e.g. "delete memory 3", "remove memory number 2", "delete my 1st memory"
function parseDeleteMemoryByNumber(message) {
  const trimmed = message.trim();
  const m = trimmed.match(/(?:delete|remove|erase)\s+(?:my\s+)?memory\s+(?:number\s+|#)?(\d+)/i);
  if (m && m[1]) return parseInt(m[1], 10);
  return null;
}

// ─── Update memory by keyword ───────────────────────────────────────────────
// e.g. "update memory about dark mode to light mode"
// "change memory about Python to TypeScript"
const UPDATE_MEMORY_BY_KEYWORD_PATTERNS = [
  /update\s+(?:the\s+)?memory\s+about\s+(.+?)\s+to\s+(.+)/i,
  /change\s+(?:the\s+)?memory\s+about\s+(.+?)\s+to\s+(.+)/i,
  /update\s+what\s+you\s+(?:know|remember)\s+about\s+(.+?)\s+to\s+(.+)/i,
  /edit\s+(?:the\s+)?memory\s+about\s+(.+?)\s+to\s+(.+)/i,
];

function parseUpdateMemoryByKeyword(message) {
  const trimmed = message.trim();
  for (const re of UPDATE_MEMORY_BY_KEYWORD_PATTERNS) {
    const m = trimmed.match(re);
    if (m && m[1] && m[2]) {
      return {
        keyword: m[1].trim().replace(/[?.!]+$/, ''),
        newValue: m[2].trim().replace(/[?.!]+$/, ''),
      };
    }
  }
  return null;
}

// ─── Update memory by number ─────────────────────────────────────────────────
// e.g. "update memory 2 to I wake up at 7 AM", "change memory 3 to TypeScript"
function parseUpdateMemoryByNumber(message) {
  const trimmed = message.trim();
  const m = trimmed.match(/(?:update|change|edit)\s+(?:my\s+)?memory\s+(?:number\s+|#)?(\d+)\s+to\s+(.+)/i);
  if (m && m[1] && m[2]) {
    return { index: parseInt(m[1], 10), newValue: m[2].trim().replace(/[?.!]+$/, '') };
  }
  return null;
}

// ─── Search memories intent ─────────────────────────────────────────────────
// Matches "search memories", "search memories about X", "find memories about X"
function isSearchMemoriesIntent(message) {
  const trimmed = message.trim();
  return /^search\s+memories?$/i.test(trimmed) ||
         /search\s+memories?\s+(?:about|for|related\s+to)\s+.+/i.test(trimmed) ||
         /find\s+memories?\s+(?:about|for|related\s+to)\s+.+/i.test(trimmed);
}

function parseSearchMemoriesQuery(message) {
  const trimmed = message.trim();
  const m = trimmed.match(/(?:search|find)\s+memories?\s+(?:about|for|related\s+to)\s+(.+)/i);
  if (m && m[1]) return m[1].trim().replace(/[?.!]+$/, '');
  return null;
}

// ─── Clear old memories intent ───────────────────────────────────────────────
// Matches "clear old memories", "delete old memories", "clean up memories"
function isClearOldMemoriesIntent(message) {
  const trimmed = message.trim();
  return /clear\s+(?:old\s+)?memories?/i.test(trimmed) ||
         /delete\s+old\s+memories?/i.test(trimmed) ||
         /clean\s+up\s+(?:my\s+)?memories?/i.test(trimmed) ||
         /remove\s+old\s+memories?/i.test(trimmed);
}

module.exports = {
  extractSaveValue,
  isRecallIntent,
  extractUpdatePreference,
  extractDeletePreference,
  extractPreferenceCategory,
  extractTargetedMemoryQuery,
  parseDeleteMemoryByKeyword,
  parseDeleteMemoryByNumber,
  parseUpdateMemoryByKeyword,
  parseUpdateMemoryByNumber,
  isSearchMemoriesIntent,
  parseSearchMemoriesQuery,
  isClearOldMemoriesIntent,
};
