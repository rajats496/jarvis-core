# Conversation Search Feature

## Overview
Jarvis can search through your entire chat history using keyword matching. This feature works both through natural language commands in the chat and via a dedicated Search tab in the dashboard.

## How to Use

### Method 1: Natural Language (Voice/Text Commands)

Simply ask Jarvis to search your conversations using natural language:

**Examples:**
- `"Search my chats about MongoDB"`
- `"Show previous chats about Python"`
- `"Find chats about API design"`
- `"What did we discuss about Docker?"`
- `"Search conversations for authentication"`

**Response Format:**
```
Found 5 message(s) matching "MongoDB":

1. "How to index MongoDB collections..." (3/1/2026, 2:30 PM)
2. "MongoDB vs PostgreSQL discussion" (2/28/2026, 10:15 AM)
3. "What's the best way to optimize MongoDB queries?" (2/25/2026, 4:20 PM)
```

### Method 2: Search Tab (UI)

1. Navigate to the **Search** tab in the Dashboard
2. Enter your search keyword (e.g., "MongoDB", "Python", "API")
3. Click **Search**
4. View all matching messages with timestamps and context

## Technical Details

### Backend
- **Service**: `conversation.service.js` - `search(userId, query, limit)`
- **Controller**: `conversation.controller.js` - `GET /conversations/search?q=keyword`
- **Intent Detection**: `intent.service.js` - Recognizes multiple search patterns
- **Search Type**: Case-insensitive keyword regex matching (not semantic)

### Frontend
- **API**: `conversations.api.js` - `search(query, limit)`
- **Component**: `ConversationSearch.jsx` - Dedicated search UI
- **Tab**: Integrated into Dashboard TabStrip

### Supported Patterns
```javascript
// Pattern 1: Direct search command
"search my chats about X"
"search chats about X"

// Pattern 2: Show/find variations
"show previous chats about X"
"find chats about X"
"get chats about X"

// Pattern 3: Discussion queries
"what did we discuss about X"
"what did I talk about X"

// Pattern 4: Conversation-specific
"search conversations for X"
"find conversation about X"
```

### Limitations
- **No semantic search**: Only keyword matching (OpenAI embeddings not used for conversation search)
- **Single conversation thread**: Currently searches within one continuous chat thread per user
- **No date filtering**: Can't specify time ranges (e.g., "last week")
- **No advanced operators**: No AND/OR/NOT logic

## Future Enhancements
- [ ] Semantic search using embeddings
- [ ] Multi-conversation thread support
- [ ] Date range filtering
- [ ] Advanced search operators (AND, OR, NOT)
- [ ] Search result highlighting
- [ ] Export search results

## Code References
- Intent parsing: `server/utils/taskGoalIntent.js` - `parseConversationSearch()`
- Intent handler: `server/controllers/chat.controller.js` - Line ~182
- Search service: `server/services/conversation.service.js` - `search()`
- UI component: `client/src/components/Dashboard/ConversationSearch.jsx`
