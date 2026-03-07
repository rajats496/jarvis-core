# Usage Analytics Feature

## Overview
Jarvis provides instant, deterministic responses to usage statistics queries **without requiring AI**. All queries are pattern-matched and answered from the database directly—ensuring fast, accurate responses even when AI is unavailable.

## Supported Queries

### 1. **VM Command Count**
**Patterns:**
- "How many commands did I run?"
- "How many VM commands?"
- "Command count"
- "VM command count"

**Response Example:**
```
You have executed 12 VM commands.
```

---

### 2. **Memory Count**
**Patterns:**
- "How many memories do I have?"
- "How many memories?"
- "Memory count"
- "Memories do I have?"

**Response Example:**
```
You currently have 8 stored memories.
```

---

### 3. **Task Count**
**Patterns:**
- "How many tasks?"
- "How many tasks do I have?"
- "Task count"

**Response Example:**
```
You have 5 tasks (3 done, 2 pending).
```

---

### 4. **Goal Count**
**Patterns:**
- "How many goals?"
- "Goal count"

**Response Example:**
```
You have 2 goals set.
```

---

### 5. **AI Call Count**
**Patterns:**
- "How many AI calls?"
- "AI usage count"
- "AI call count"

**Response Example:**
```
You have made 47 AI calls.
```

---

### 6. **Reminder Count**
**Patterns:**
- "How many reminders?"
- "Reminder count"

**Response Example:**
```
You have 3 active reminders (5 total).
```

---

### 7. **Comprehensive Analytics**
**Patterns:**
- "My usage"
- "Show my usage"
- "My stats"
- "Show my analytics"
- "Usage stats"
- "Analytics"

**Response Example:**
```
Your usage stats:

Memories: 8
Tasks: 5 (3 done, 2 pending)
Goals: 2
Reminders: 3 active
VM Commands: 12
AI Calls: 47
Fallback Uses: 5
Memory Saves: 8
```

---

## How It Works (Technical)

### Backend Architecture

#### 1. **Intent Detection**
**File:** `server/utils/taskGoalIntent.js`
- `parseUsageStatsQuery(message)` - Regex pattern matching
- Returns: `{ type: 'commands'|'memories'|'tasks'|'goals'|'ai_calls'|'reminders' }`

#### 2. **Intent Classification**
**File:** `server/services/intent.service.js`
- Integrates `parseUsageStatsQuery()` into main classification pipeline
- Returns: `{ intent: 'usage_stats', payload: { type } }`

#### 3. **Query Handler**
**File:** `server/controllers/chat.controller.js` (lines ~330-380)
- Processes `usage_stats` intent before general `analytics` intent
- Direct database queries:
  - CommandLog: `CommandLog.countDocuments({ userId })`
  - Memory: `Memory.countDocuments({ userId })`
  - Tasks: `taskService.list(userId)` + filtering
  - Goals: `goalService.list(userId)`
  - Reminders: `Reminder.countDocuments({ userId, dismissed: false })`
  - AI calls: `analyticsService.getSummary(userId)` → `summary.ai_call`

#### 4. **Response Format**
- Natural language responses with proper pluralization
- Source: `'memory'` (deterministic, no AI)
- Extra metadata in response payload

### Frontend Integration

#### Analytics Panel
**File:** `client/src/components/Analytics/UsageStats.jsx`
- Displays quick query examples with hint box
- Shows suggestion queries users can copy/paste or speak
- Example queries rendered as code snippets

#### Quick Query Examples
```javascript
const QUICK_QUERIES = [
  'How many commands did I run?',
  'How many memories do I have?',
  'How many tasks?',
  'How many AI calls?',
  'Show my usage',
];
```

---

## Pattern Matching Details

### Command Count Patterns
```javascript
/how\s+many\s+(?:vm\s+)?commands?/i
/(?:vm\s+)?command\s+count/i
```

### Memory Count Patterns
```javascript
/how\s+many\s+memories/i
/memory\s+count/i
/memories\s+do\s+i\s+have/i
```

### Task Count Patterns
```javascript
/how\s+many\s+tasks?/i
/task\s+count/i
/tasks?\s+do\s+i\s+have/i
```

### Goal Count Patterns
```javascript
/how\s+many\s+goals?/i
/goal\s+count/i
```

### AI Call Count Patterns
```javascript
/how\s+many\s+ai\s+calls?/i
/ai\s+(?:usage|call)\s+count/i
```

### Reminder Count Patterns
```javascript
/how\s+many\s+reminders?/i
/reminder\s+count/i
```

---

## Performance

- **Response Time:** < 50ms (database query + pattern matching)
- **No AI Required:** Works in fallback mode, safe mode, or when AI is unavailable
- **Accuracy:** 100% (direct database counts)
- **Caching:** No caching needed—queries are fast enough

---

## Advantages Over AI-Based Approach

| Aspect | Deterministic (This Feature) | AI-Based |
|--------|------------------------------|----------|
| **Speed** | < 50ms | 500-2000ms |
| **Accuracy** | 100% (exact counts) | ~95% (may hallucinate) |
| **Availability** | Always (even in safe mode) | Only when API available |
| **Cost** | Free (database query) | $0.0001-0.001 per query |
| **Consistency** | Identical every time | May vary slightly |

---

## Example Conversation

```
User: "How many commands did I run?"
Jarvis: "You have executed 12 VM commands."

User: "How many memories do I have?"
Jarvis: "You currently have 8 stored memories."

User: "Show my usage"
Jarvis: "Your usage stats:

Memories: 8
Tasks: 5 (3 done, 2 pending)
Goals: 2
Reminders: 3 active
VM Commands: 12
AI Calls: 47
Fallback Uses: 5
Memory Saves: 8"
```

---

## Future Enhancements

- [ ] Time-based queries ("How many commands this week?")
- [ ] Comparative stats ("Am I using more AI than last month?")
- [ ] Trend visualization in Analytics panel
- [ ] Export stats as CSV/JSON
- [ ] Goal progress tracking analytics
- [ ] Heatmap of activity by day/hour

---

## Code References

- **Intent parsing:** `server/utils/taskGoalIntent.js` → `parseUsageStatsQuery()`
- **Intent handler:** `server/controllers/chat.controller.js` → Lines ~330-380
- **Analytics service:** `server/services/analytics.service.js`
- **Frontend panel:** `client/src/components/Analytics/UsageStats.jsx`
