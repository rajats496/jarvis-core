/**
 * LLM-powered settings extraction - for natural language settings changes
 * Fallback when deterministic patterns don't match
 */
const aiService = require('./ai.service');
const logger = require('../utils/logger');

const SETTINGS_MAP = {
  voice: 'voiceEnabled',
  voiceEnabled: 'voiceEnabled',
  'safe mode': 'safeModeEnabled',
  safeModeEnabled: 'safeModeEnabled',
  fallback: 'fallbackModeEnabled',
  'fallback mode': 'fallbackModeEnabled',
  fallbackModeEnabled: 'fallbackModeEnabled',
  concise: 'conciseResponses',
  'concise mode': 'conciseResponses',
  'concise responses': 'conciseResponses',
  conciseResponses: 'conciseResponses',
  metrics: 'showSystemMetrics',
  'system metrics': 'showSystemMetrics',
  showSystemMetrics: 'showSystemMetrics',
};

const SYSTEM_PROMPT = `You are a settings parser. Extract the setting name and value from user messages.

Available settings:
- voice (voiceEnabled): Enable/disable voice features
- safe mode (safeModeEnabled): Enable/disable safe mode (disables VM when load is high)
- fallback mode (fallbackModeEnabled): Always use fallback instead of AI
- concise (conciseResponses): Enable/disable concise response mode
- system metrics (showSystemMetrics): Show/hide system metrics

Respond ONLY with valid JSON in this exact format:
{"setting": "settingKey", "value": true}

Examples:
Input: "enable safe mode"
Output: {"setting": "safeModeEnabled", "value": true}

Input: "turn off voice"
Output: {"setting": "voiceEnabled", "value": false}

Input: "I want concise responses"
Output: {"setting": "conciseResponses", "value": true}

Input: "disable metrics"
Output: {"setting": "showSystemMetrics", "value": false}

If the message is not about changing settings, respond with:
{"error": "not_a_settings_change"}`;

/**
 * Use LLM to extract settings change from natural language
 * Returns { setting: string, value: boolean } or null
 */
async function extractSettingsWithLLM(message) {
  if (!aiService.isAvailable()) return null;
  
  try {
    const response = await aiService.chat(message, {
      systemPrompt: SYSTEM_PROMPT,
      history: [],
    });
    
    if (!response) return null;
    
    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[^}]+\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (parsed.error === 'not_a_settings_change') return null;
    
    if (parsed.setting && typeof parsed.value === 'boolean') {
      // Validate setting exists
      const validSettings = Object.values(SETTINGS_MAP);
      if (validSettings.includes(parsed.setting)) {
        return { setting: parsed.setting, value: parsed.value };
      }
    }
    
    return null;
  } catch (err) {
    logger.warn('LLM settings extraction failed:', err.message);
    return null;
  }
}

/**
 * Check if message might be a settings change request
 */
function looksLikeSettingsChange(message) {
  const m = message.toLowerCase();
  const keywords = ['enable', 'disable', 'turn on', 'turn off', 'activate', 'deactivate', 'switch', 'set'];
  const settingNames = ['voice', 'safe', 'fallback', 'concise', 'metrics', 'mode'];
  
  const hasKeyword = keywords.some((k) => m.includes(k));
  const hasSetting = settingNames.some((s) => m.includes(s));
  
  return hasKeyword && hasSetting;
}

module.exports = {
  extractSettingsWithLLM,
  looksLikeSettingsChange,
  SETTINGS_MAP,
};
