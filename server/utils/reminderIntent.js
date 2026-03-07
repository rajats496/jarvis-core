/**
 * Parse reminder commands — rule-based, no AI.
 * Supports:
 *   "Remind me at 7 PM to study MongoDB"          → today 7 PM (tomorrow if already past)
 *   "Remind me tomorrow at 9 AM to revise OS"     → tomorrow 9 AM
 *   "Remind me in 30 minutes to drink water"      → now + 30 min
 *   "Remind me in 2 hours to take a break"        → now + 2 hours
 * Returns { text, triggerAt } or null.
 */

function parseReminder(message) {
  const m = message.trim();
  const now = new Date();

  // Pattern 1: "in X minutes/hours"
  const inMatch = m.match(/remind\s+me\s+in\s+(\d+)\s*(minutes?|mins?|hours?|hrs?)\s+to\s+(.+)/i);
  if (inMatch) {
    const amount = parseInt(inMatch[1], 10);
    const unit = inMatch[2].toLowerCase();
    const text = inMatch[3].trim();
    const triggerAt = new Date(now);
    if (unit.startsWith('h')) triggerAt.setTime(triggerAt.getTime() + amount * 60 * 60 * 1000);
    else triggerAt.setTime(triggerAt.getTime() + amount * 60 * 1000);
    return { text, triggerAt };
  }

  // Pattern 2: "tomorrow at X" or "at X" (with optional am/pm)
  const atMatch = m.match(/remind\s+me\s+(tomorrow\s+)?at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+to\s+(.+)/i);
  if (!atMatch) return null;

  const hasTomorrow = Boolean(atMatch[1]);
  let hour = parseInt(atMatch[2], 10);
  const minute = atMatch[3] ? parseInt(atMatch[3], 10) : 0;
  const rawAmPm = atMatch[4] ? atMatch[4].toLowerCase() : null;
  const text = atMatch[5].trim();

  // Resolve AM/PM: if not specified, infer from hour (1-6 → PM, 7-12 → context)
  let ampm = rawAmPm;
  if (!ampm) {
    // No am/pm given: hours 1-6 are probably PM (e.g. "at 7" likely means 7 AM or PM contextually)
    // Default: if hour < 7 treat as PM, otherwise AM — common heuristic
    ampm = hour < 7 ? 'pm' : 'am';
  }
  if (ampm === 'pm' && hour < 12) hour += 12;
  if (ampm === 'am' && hour === 12) hour = 0;

  const base = new Date(now);
  if (hasTomorrow) base.setDate(base.getDate() + 1);
  base.setHours(hour, minute, 0, 0);

  // If time is already past (and no "tomorrow" was stated), roll to next day
  if (!hasTomorrow && base <= now) base.setDate(base.getDate() + 1);

  return { text, triggerAt: base };
}

module.exports = { parseReminder };
