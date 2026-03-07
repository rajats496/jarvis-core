/**
 * Chat controller - memory, reminders, tasks, goals (rule-based), then AI/fallback.
 */

const aiService = require('../services/ai.service');
const memoryService = require('../services/memory.service');
const reminderService = require('../services/reminder.service');
const taskService = require('../services/task.service');
const goalService = require('../services/goal.service');
const activityService = require('../services/activity.service');
const fallbackManager = require('../utils/fallbackManager');
const { extractSaveValue, isRecallIntent, extractUpdatePreference, extractDeletePreference, extractPreferenceCategory, extractTargetedMemoryQuery, parseDeleteMemoryByKeyword, parseDeleteMemoryByNumber, parseUpdateMemoryByKeyword, parseUpdateMemoryByNumber, isSearchMemoriesIntent, parseSearchMemoriesQuery, isClearOldMemoriesIntent } = require('../utils/memoryIntent');
const { parseReminder } = require('../utils/reminderIntent');
const { parseAddTask, isListTasks, isPendingTasksIntent, isMarkTaskDoneGuide, parseMarkTaskDone, parseDeleteTask, parseGoal, isListGoals, parseMarkGoalComplete, parseDeleteGoal, parseUpdateGoalProgress, parseCommandHistoryIntent, isExportMemoriesIntent } = require('../utils/taskGoalIntent');
const commandLogService = require('../services/commandLog.service');
const conversationService = require('../services/conversation.service');
const intentService = require('../services/intent.service');
const vmProxyService = require('../services/vmProxy.service');
const settingsService = require('../services/settings.service');
const analyticsService = require('../services/analytics.service');
const suggestionsService = require('../services/suggestions.service');
const systemHealth = require('../config/systemHealth');
const loadGuard = require('../utils/loadGuard');
const { extractSettingsWithLLM, looksLikeSettingsChange } = require('../services/settingsExtractor.service');

const FALLBACK_MESSAGE =
  "I'm in fallback mode right now. I can still help with: memory (save/recall), system status, VM monitoring, and settings. Try: \"What do you remember about me?\" or \"System status\".";

function simpleKeywords(value) {
  if (typeof value !== 'string') return [];
  return value
    .split(/\s+/)
    .map((w) => w.replace(/\W/g, '').toLowerCase())
    .filter((w) => w.length > 2)
    .slice(0, 10);
}

function formatMemoriesForReply(memories) {
  if (!memories || memories.length === 0) {
    return "I don't have any stored memories about you yet. Say \"Remember that...\" to save something.";
  }
  const lines = memories.map((m) => `• ${m.type}${m.category ? ` (${m.category})` : ''}: ${typeof m.value === 'string' ? m.value : JSON.stringify(m.value)}`);
  return "Here's what I remember:\n\n" + lines.join("\n");
}

async function chat(req, res, next) {
  try {
    const { message, history = [] } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message (string) is required' });
    }

    const userId = req.user?.id;
    const trimmed = message.trim();
    let reply = null;
    let source = 'fallback';
    let memoriesRecalled = null;
    let extra = {};

    // 1) Reminder: "Remind me tomorrow at 9am to revise OS"
    const reminder = parseReminder(trimmed);
    if (reminder) {
      try {
        await reminderService.create(userId, reminder);
        activityService.log(userId, 'reminder_set', { text: reminder.text, triggerAt: reminder.triggerAt }).catch(() => { });
        reply = `Reminder set for ${reminder.triggerAt.toLocaleString()}: ${reminder.text}`;
        source = 'memory';
      } catch (_) {
        reply = "I couldn't set that reminder. Please try again.";
        source = 'memory';
      }
    }
    // 2) Add task: "Add task: Complete MongoDB notes"
    else if (parseAddTask(trimmed)) {
      const title = parseAddTask(trimmed);
      try {
        await taskService.create(userId, title);
        activityService.log(userId, 'task_add', { title }).catch(() => { });
        reply = `✓ Task added: "${title}"`;
        source = 'memory';
        extra.taskChanged = { action: 'add', title };
        extra.openTab = 'tasks';
      } catch (_) {
        reply = "I couldn't add that task.";
        source = 'memory';
      }
    }
    // 3a) Pending tasks: "What's pending?", "show pending tasks"
    else if (isPendingTasksIntent(trimmed)) {
      try {
        const tasks = await taskService.list(userId);
        const pending = tasks.filter((t) => !t.done);
        if (pending.length === 0) {
          reply = "🎉 Nothing pending — all your tasks are done!";
        } else {
          reply = `You have ${pending.length} pending task${pending.length !== 1 ? 's' : ''}:\n\n` +
            pending.map((t, i) => `${i + 1}. ${t.title}`).join('\n') +
            '\n\nSay "Mark task N done" to complete one.';
        }
        source = 'memory';
        extra.tasks = tasks;
        extra.taskFilter = 'pending';
        extra.openTab = 'tasks';
      } catch (_) {
        reply = "I couldn't fetch tasks.";
        source = 'memory';
      }
    }
    // 3b) List all tasks: "Show my tasks", "Show all tasks"
    else if (isListTasks(trimmed)) {
      try {
        const tasks = await taskService.list(userId);
        if (tasks.length === 0) {
          reply = "You have no tasks yet. Say \"Add task: …\" to create one.";
        } else {
          const pending = tasks.filter((t) => !t.done);
          const done = tasks.filter((t) => t.done);
          reply = `You have ${tasks.length} task${tasks.length !== 1 ? 's' : ''} (${pending.length} pending, ${done.length} done):\n\n` +
            tasks.map((t, i) => `${i + 1}. ${t.done ? '✓' : '○'} ${t.title}`).join('\n');
        }
        source = 'memory';
        extra.tasks = tasks;
        extra.taskFilter = 'all';
        extra.openTab = 'tasks';
      } catch (_) {
        reply = "I couldn't fetch tasks.";
        source = 'memory';
      }
    }
    // 4a) "Mark a task done" guide (no number given)
    else if (isMarkTaskDoneGuide(trimmed)) {
      try {
        const tasks = await taskService.list(userId);
        const pending = tasks.filter((t) => !t.done);
        if (pending.length === 0) {
          reply = "🎉 All your tasks are already done!";
        } else {
          reply = `Which task would you like to mark as done?\n\n` +
            pending.map((t, i) => `${i + 1}. ${t.title}`).join('\n') +
            '\n\nSay **"Mark task N done"** (e.g. "Mark task 1 done")';
        }
        source = 'memory';
        extra.taskFilter = 'pending';
        extra.openTab = 'tasks';
      } catch (_) {
        reply = "I couldn't fetch tasks.";
        source = 'memory';
      }
    }
    // 4b) Mark task N done: "Mark task 2 done"
    else if (parseMarkTaskDone(trimmed) !== null) {
      const num = parseMarkTaskDone(trimmed);
      try {
        const tasks = await taskService.list(userId);
        const task = tasks[num - 1];
        if (!task) {
          reply = `No task #${num}. Say "Show all tasks" to see the list.`;
        } else {
          await taskService.setDone(userId, task.id, true);
          activityService.log(userId, 'task_done', { taskId: task.id }).catch(() => { });
          reply = `✓ Marked as done: "${task.title}"\n\nYour tasks panel will update automatically.`;
          extra.taskChanged = { action: 'done', id: String(task.id), title: task.title };
          extra.openTab = 'tasks';
        }
        source = 'memory';
      } catch (_) {
        reply = "I couldn't update that task.";
        source = 'memory';
      }
    }
    // 4c) Delete task N: "Delete task 2", "Remove task 3"
    else if (parseDeleteTask(trimmed) !== null) {
      const num = parseDeleteTask(trimmed);
      try {
        const tasks = await taskService.list(userId);
        const task = tasks[num - 1];
        if (!task) {
          reply = `No task #${num}. Say "Show all tasks" to see the list.`;
        } else {
          await taskService.deleteTask(userId, task.id);
          activityService.log(userId, 'task_delete', { taskId: task.id }).catch(() => { });
          reply = `✓ Task deleted: "${task.title}"\n\nYour tasks panel will update automatically.`;
          extra.taskChanged = { action: 'delete', id: String(task.id), title: task.title };
          extra.openTab = 'tasks';
        }
        source = 'memory';
      } catch (_) {
        reply = "I couldn't delete that task.";
        source = 'memory';
      }
    }
    // 5) Goal add: "My goal is to learn system design in 30 days"
    else if (parseGoal(trimmed)) {
      const g = parseGoal(trimmed);
      try {
        const saved = await goalService.create(userId, g);
        reply = `✓ Goal set: "${g.title}" (${g.daysTotal} days)`;
        source = 'memory';
        extra.goalChanged = { action: 'add', id: String(saved._id || saved.id), title: g.title };
        extra.openTab = 'goals';
      } catch (_) {
        reply = "I couldn't save that goal.";
        source = 'memory';
      }
    }
    // 5a) Mark goal N complete: "Mark goal 1 achieved"
    else if (parseMarkGoalComplete(trimmed) !== null) {
      const num = parseMarkGoalComplete(trimmed);
      try {
        const goals = await goalService.list(userId);
        const goal = goals[num - 1];
        if (!goal) {
          reply = `No goal #${num}. Say "Show my goals" to see the list.`;
        } else if ((goal.daysDone ?? 0) >= goal.daysTotal) {
          reply = `Goal "${goal.title}" is already marked as achieved! 🎉`;
        } else {
          await goalService.markComplete(userId, String(goal._id || goal.id));
          reply = `🎉 Goal achieved: "${goal.title}"\n\nYour goals panel will update automatically.`;
          extra.goalChanged = { action: 'complete', id: String(goal._id || goal.id), title: goal.title };
          extra.openTab = 'goals';
        }
        source = 'memory';
      } catch (_) {
        reply = "I couldn't update that goal.";
        source = 'memory';
      }
    }
    // 5b) Delete goal N: "Delete goal 2"
    else if (parseDeleteGoal(trimmed) !== null) {
      const num = parseDeleteGoal(trimmed);
      try {
        const goals = await goalService.list(userId);
        const goal = goals[num - 1];
        if (!goal) {
          reply = `No goal #${num}. Say "Show my goals" to see the list.`;
        } else {
          await goalService.deleteGoal(userId, String(goal._id || goal.id));
          reply = `✓ Goal deleted: "${goal.title}"\n\nYour goals panel will update automatically.`;
          extra.goalChanged = { action: 'delete', id: String(goal._id || goal.id), title: goal.title };
          extra.openTab = 'goals';
        }
        source = 'memory';
      } catch (_) {
        reply = "I couldn't delete that goal.";
        source = 'memory';
      }
    }
    // 5c) Update goal progress: "Update goal 1 progress to 5 days" / "Log 3 days for goal 2"
    else if (parseUpdateGoalProgress(trimmed) !== null) {
      const { index, days } = parseUpdateGoalProgress(trimmed);
      try {
        const goals = await goalService.list(userId);
        const goal = goals[index - 1];
        if (!goal) {
          reply = `No goal #${index}. Say "Show my goals" to see the list.`;
        } else {
          const newDays = Math.min(days, goal.daysTotal);
          await goalService.updateProgress(userId, String(goal._id || goal.id), newDays);
          const pct = goal.daysTotal ? Math.round((newDays / goal.daysTotal) * 100) : 0;
          const achieved = newDays >= goal.daysTotal;
          reply = achieved
            ? `🎉 Goal achieved: "${goal.title}" is now 100% complete!\n\nYour goals panel will update automatically.`
            : `✓ Progress updated: "${goal.title}" — ${newDays}/${goal.daysTotal} days (${pct}%)\n\nYour goals panel will update automatically.`;
          extra.goalChanged = { action: 'progress', id: String(goal._id || goal.id), title: goal.title, days: newDays };
          extra.openTab = 'goals';
        }
        source = 'memory';
      } catch (_) {
        reply = "I couldn't update that goal's progress.";
        source = 'memory';
      }
    }
    // 6) List goals: "Show my goals", "How am I progressing?"
    else if (isListGoals(trimmed)) {
      try {
        const goals = await goalService.list(userId);
        if (goals.length === 0) {
          reply = "You have no goals set yet. Say \"My goal is to learn X in 30 days\" to add one.";
        } else {
          const lines = goals.map((g, i) => {
            const pct = g.daysTotal ? Math.round(((g.daysDone ?? 0) / g.daysTotal) * 100) : 0;
            const status = pct >= 100 ? '🎉' : pct >= 50 ? '🔥' : '○';
            return `${i + 1}. ${status} ${g.title} — ${g.daysDone ?? 0}/${g.daysTotal} days (${pct}%)`;
          });
          const achieved = goals.filter(g => (g.daysDone ?? 0) >= g.daysTotal).length;
          reply = `Your goals (${achieved}/${goals.length} achieved):\n\n${lines.join('\n')}`;
        }
        source = 'memory';
        extra.goals = goals;
        extra.goalFilter = 'all';
        extra.openTab = 'goals';
      } catch (_) {
        reply = "I couldn't fetch goals.";
        source = 'memory';
      }
    }
    // 7a) Run Diagnostics — compound command that runs multiple agent checks in parallel
    else if (/^run\s+diagnostics?$/i.test(trimmed)) {
      const DIAG_COMMANDS = ['battery', 'cpu', 'ram', 'disk', 'network', 'uptime'];
      try {
        const results = await Promise.all(
          DIAG_COMMANDS.map((cmd) =>
            vmProxyService.execute(userId, cmd)
              .then((r) => ({ cmd, ok: r.success, out: r.result }))
              .catch(() => ({ cmd, ok: false, out: 'unavailable' }))
          )
        );
        const lines = results.map(({ cmd, ok, out }) => {
          const icon = ok ? '✅' : '❌';
          // Truncate very long output
          const display = out && out.length > 200 ? out.slice(0, 200) + '...' : out;
          return `${icon} **${cmd.toUpperCase()}**\n${display}`;
        });
        reply = `🔍 **System Diagnostics Report**\n\n${lines.join('\n\n')}`;
        source = 'memory';
      } catch (_) {
        reply = 'Diagnostics failed. Make sure the Desktop Agent is running and your VM URL is set in Settings.';
        source = 'memory';
      }
    }
    // 7b) VM execute: "run uptime", "execute df -h", "screenshot", "show my screen"
    else if (intentService.classify(trimmed).intent === 'vm_execute') {
      const cmd = intentService.classify(trimmed).payload;
      if (cmd) {
        try {
          const vmResult = await vmProxyService.execute(userId, cmd);
          const { success, result, type, mimeType } = vmResult;
          if (success && type === 'image') {
            reply = `📸 **Screenshot captured:**\n\n![Screenshot](data:${mimeType || 'image/jpeg'};base64,${result})`;
          } else {
            reply = success ? result : result || 'Command failed.';
          }
          source = 'memory';
        } catch (_) {
          reply = "VM command failed.";
          source = 'memory';
        }
      }
    }
    // 8) Command usage history: "Show last 5 VM commands"
    else if (parseCommandHistoryIntent(trimmed) !== null) {
      const limit = parseCommandHistoryIntent(trimmed);
      try {
        const history = await commandLogService.getLast(userId, limit);
        if (history.length === 0) reply = "No VM commands recorded yet.";
        else reply = "Last " + history.length + " VM command(s):\n\n" + history.map((h, i) => `${i + 1}. ${h.command} — ${h.success ? 'ok' : 'failed'} (${new Date(h.createdAt).toLocaleString()})`).join("\n");
        source = 'memory';
        extra.commandHistory = history;
      } catch (_) {
        reply = "I couldn't fetch command history.";
        source = 'memory';
      }
    }
    // 9) Export memories (instructions)
    else if (isExportMemoriesIntent(trimmed)) {
      reply = "Use the Export button in the Memory panel, or go to Settings > Export data to download your memories as JSON.";
      source = 'memory';
    }
    // 9b) Conversation search: "search my chats about MongoDB"
    else if (intentService.classify(trimmed).intent === 'conversation_search') {
      const searchQuery = intentService.classify(trimmed).payload;
      try {
        const matches = await conversationService.search(userId, searchQuery, 20);
        if (matches.length === 0) {
          reply = `No conversations found matching "${searchQuery}". Try a different keyword.`;
        } else {
          const grouped = [];
          let currentGroup = null;
          matches.forEach((m) => {
            if (m.role === 'user') {
              if (currentGroup) grouped.push(currentGroup);
              currentGroup = { user: m.content.slice(0, 100), assistant: '', timestamp: m.timestamp };
            } else if (m.role === 'assistant' && currentGroup) {
              currentGroup.assistant = m.content.slice(0, 100);
            }
          });
          if (currentGroup) grouped.push(currentGroup);

          const uniqueConvos = grouped.slice(0, 10);
          reply = `Found ${matches.length} message(s) matching "${searchQuery}":\n\n` +
            uniqueConvos.map((g, i) => {
              const preview = g.user.length > 60 ? g.user.slice(0, 60) + '...' : g.user;
              const time = g.timestamp ? new Date(g.timestamp).toLocaleString() : 'recently';
              return `${i + 1}. "${preview}" (${time})`;
            }).join('\n');
        }
        source = 'memory';
        extra.conversationMatches = matches;
      } catch (_) {
        reply = "I couldn't search conversations. Please try again.";
        source = 'memory';
      }
    }
    // 10) Save memory (with conflict detection per category: language, sport, etc.)
    else if (extractSaveValue(trimmed)) {
      const saveValue = extractSaveValue(trimmed);
      const category = extractPreferenceCategory(saveValue);
      try {
        const conflict = await memoryService.checkConflict(userId, { type: 'preference', category, value: saveValue });
        if (conflict) {
          const categoryLabel = category ? category.replace(/_/g, ' ') : 'preference';
          reply = `You already have a ${categoryLabel} stored: "${typeof conflict.value === 'string' ? conflict.value : JSON.stringify(conflict.value)}". Say "replace with ${saveValue}" to overwrite, or "Update my ${categoryLabel} to ..." to change it.`;
          source = 'memory';
          extra.memoryConflict = { existing: conflict, newValue: saveValue };
        } else {
          await memoryService.save(userId, {
            type: 'preference',
            category,
            value: saveValue,
            keywords: simpleKeywords(saveValue),
          });
          activityService.log(userId, 'memory_save', { value: saveValue }).catch(() => { });
          analyticsService.increment(userId, 'memory_save').catch(() => { });
          reply = "I've remembered that.";
          source = 'memory';
        }
      } catch (_) {
        reply = "I couldn't save that. Please try again.";
        source = 'memory';
      }
    }
    // 11) Replace memory (resolve conflict)
    else if (/replace\s+with\s+(.+)/i.test(trimmed)) {
      const newVal = trimmed.match(/replace\s+with\s+(.+)/i)[1].trim();
      try {
        const list = await memoryService.retrieve(userId, { limit: 1 });
        const last = list.find((m) => typeof m.value === 'string' && m.value.length > 0);
        if (last) {
          await memoryService.update(userId, last.id, { value: newVal });
          reply = `Updated to: ${newVal}`;
        } else reply = "Nothing to replace. Say \"Remember that...\" first.";
        source = 'memory';
      } catch (_) {
        reply = "I couldn't update.";
        source = 'memory';
      }
    }
    // 11e) Delete memory by number: "delete memory 2"
    else if (parseDeleteMemoryByNumber(trimmed) !== null) {
      const num = parseDeleteMemoryByNumber(trimmed);
      try {
        const all = await memoryService.retrieve(userId, { limit: 100 });
        const target = all[num - 1];
        if (!target) {
          reply = `No memory #${num}. Say "What do you remember?" to list them.`;
        } else {
          const oldVal = typeof target.value === 'string' ? target.value : JSON.stringify(target.value);
          await memoryService.remove(userId, target.id);
          activityService.log(userId, 'memory_delete', { memoryId: target.id }).catch(() => { });
          reply = `\u2713 Memory #${num} deleted: "${oldVal}"\n\nYour memory panel will update automatically.`;
          source = 'memory';
          extra.memoryChanged = { action: 'delete', id: String(target.id), value: oldVal };
        }
        source = 'memory';
      } catch (_) {
        reply = "I couldn't delete that memory. Please try again.";
        source = 'memory';
      }
    }
    // 11f) Update memory by number: "update memory 2 to I wake up at 7 AM"
    else if (parseUpdateMemoryByNumber(trimmed) !== null) {
      const { index, newValue } = parseUpdateMemoryByNumber(trimmed);
      try {
        const all = await memoryService.retrieve(userId, { limit: 100 });
        const target = all[index - 1];
        if (!target) {
          reply = `No memory #${index}. Say "What do you remember?" to list them.`;
        } else {
          const oldVal = typeof target.value === 'string' ? target.value : JSON.stringify(target.value);
          await memoryService.update(userId, target.id, { value: newValue });
          activityService.log(userId, 'memory_save', { value: newValue }).catch(() => { });
          reply = `\u2713 Memory #${index} updated.\n\n**Before:** "${oldVal}"\n**After:** "${newValue}"\n\nYour memory panel will update automatically.`;
          source = 'memory';
          extra.memoryChanged = { action: 'update', id: String(target.id), oldValue: oldVal, newValue };
        }
        source = 'memory';
      } catch (_) {
        reply = "I couldn't update that memory. Please try again.";
        source = 'memory';
      }
    }
    // 11g) Delete memory by keyword: "delete memory about dark mode"
    else if (parseDeleteMemoryByKeyword(trimmed) !== null) {
      const keyword = parseDeleteMemoryByKeyword(trimmed);
      try {
        const deleted = await memoryService.deleteByKeyword(userId, keyword);
        if (deleted) {
          const oldVal = typeof deleted.value === 'string' ? deleted.value : JSON.stringify(deleted.value);
          activityService.log(userId, 'memory_delete', { memoryId: deleted.id }).catch(() => { });
          reply = `\u2713 Memory deleted: "${oldVal}"\n\nYour memory panel will update automatically.`;
          extra.memoryChanged = { action: 'delete', id: String(deleted.id), value: oldVal };
        } else {
          reply = `I couldn't find any memory matching "${keyword}". Say "What do you remember?" to list all memories.`;
        }
        source = 'memory';
      } catch (_) {
        reply = "I couldn't delete that memory. Please try again.";
        source = 'memory';
      }
    }
    // 11h) Update memory by keyword: "update memory about Python to TypeScript"
    else if (parseUpdateMemoryByKeyword(trimmed) !== null) {
      const { keyword, newValue } = parseUpdateMemoryByKeyword(trimmed);
      try {
        const updated = await memoryService.updateByKeyword(userId, keyword, newValue);
        if (updated) {
          activityService.log(userId, 'memory_save', { value: newValue }).catch(() => { });
          reply = `\u2713 Memory updated.\n\n**Now saved as:** "${newValue}"\n\nYour memory panel will update automatically.`;
          extra.memoryChanged = { action: 'update', id: String(updated.id), newValue };
        } else {
          reply = `I couldn't find any memory matching "${keyword}". Say "What do you remember?" to see all memories.`;
        }
        source = 'memory';
      } catch (_) {
        reply = "I couldn't update that memory. Please try again.";
        source = 'memory';
      }
    }
    // 11b) Update preference: "Update my preferred language to Go"
    else if (extractUpdatePreference(trimmed)) {
      const { preferenceName, newValue } = extractUpdatePreference(trimmed);
      try {
        const categoryFromName = preferenceName.split(/\s+/).pop().toLowerCase().replace(/\s+/g, '_');
        let prefs = await memoryService.getPreferences(userId, 'preference', categoryFromName);
        let pref = prefs[0] || null;
        if (!pref) {
          let candidates = await memoryService.keywordSearch(userId, preferenceName, 10);
          pref = candidates.find((m) => m.type === 'preference');
        }
        if (!pref && preferenceName.includes(' ')) {
          const lastWord = preferenceName.split(/\s+/).pop();
          if (lastWord && lastWord.length > 1) {
            const candidates = await memoryService.keywordSearch(userId, lastWord, 10);
            pref = candidates.find((m) => m.type === 'preference');
          }
        }
        if (pref) {
          await memoryService.update(userId, pref.id, { value: newValue });
          activityService.log(userId, 'memory_save', { value: newValue }).catch(() => { });
          reply = 'Preference updated.';
          source = 'memory';
        } else {
          reply = `I don't have a preference matching "${preferenceName}". Say "Remember that my preferred language is ..." (or similar) first.`;
          source = 'memory';
        }
      } catch (_) {
        reply = "I couldn't update that preference. Please try again.";
        source = 'memory';
      }
    }
    // 11c) Delete preference: "Delete my database preference"
    else if (extractDeletePreference(trimmed)) {
      const preferenceName = extractDeletePreference(trimmed);
      try {
        let candidates = await memoryService.keywordSearch(userId, preferenceName, 10);
        let pref = candidates.find((m) => m.type === 'preference');
        if (!pref && preferenceName.includes(' ')) {
          const lastWord = preferenceName.split(/\s+/).pop();
          if (lastWord && lastWord.length > 1) {
            candidates = await memoryService.keywordSearch(userId, lastWord, 10);
            pref = candidates.find((m) => m.type === 'preference');
          }
        }
        if (pref) {
          await memoryService.remove(userId, pref.id);
          activityService.log(userId, 'memory_delete', { memoryId: pref.id }).catch(() => { });
          reply = 'Preference removed.';
          source = 'memory';
        } else {
          reply = `I don't have a preference matching "${preferenceName}".`;
          source = 'memory';
        }
      } catch (_) {
        reply = "I couldn't remove that preference. Please try again.";
        source = 'memory';
      }
    }
    // 11d) Targeted memory query: "what is my preferred programming language?"
    else if (extractTargetedMemoryQuery(trimmed)) {
      const targetedQuery = extractTargetedMemoryQuery(trimmed);
      try {
        let memories = [];
        // 1. Try exact category match first
        if (targetedQuery.category) {
          memories = await memoryService.getPreferences(userId, 'preference', targetedQuery.category);
        }
        // 2. Fall back to keyword search if no category match or returned nothing
        if (memories.length === 0 && targetedQuery.keyword) {
          memories = await memoryService.keywordSearch(userId, targetedQuery.keyword, 5);
        }
        if (memories.length > 0) {
          const top = memories[0];
          const labelStr = targetedQuery.label || 'preference';
          const valueStr = typeof top.value === 'string' ? top.value : JSON.stringify(top.value);
          reply = `Your ${labelStr} is: **${valueStr}**`;
          if (memories.length > 1) {
            const rest = memories.slice(1, 4).map((m) => (typeof m.value === 'string' ? m.value : JSON.stringify(m.value)));
            reply += `\n\nOther saved entries: ${rest.join(', ')}`;
          }
        } else {
          const labelStr = targetedQuery.label || 'preference';
          reply = `I don't have anything stored about your ${labelStr} yet. You can save it by saying: "Remember that my ${labelStr} is ..."`;
        }
        source = 'memory';
      } catch (_) {
        reply = "I couldn't look that up. Please try again.";
        source = 'memory';
      }
    }
    // 12a) Search memories: "search memories about X" or standalone "search memories"
    else if (isSearchMemoriesIntent(trimmed)) {
      try {
        const query = parseSearchMemoriesQuery(trimmed);
        if (!query) {
          reply = `I can search your memories. What would you like me to look for?\n\nTry:\n• search memories about Python\n• search memories about dark mode\n• search memories about my career`;
          source = 'memory';
          extra.openTab = 'memory';
        } else {
          const results = await memoryService.keywordSearch(userId, query, 15);
          if (!results || results.length === 0) {
            reply = `No memories found matching "${query}".\n\nTry a different keyword, or say "What do you remember?" to see all memories.`;
          } else {
            const lines = results.map((m) => `• ${m.type}${m.category ? ` (${m.category})` : ''}: ${m.value}`);
            reply = `Found ${results.length} ${results.length === 1 ? 'memory' : 'memories'} matching "${query}":\n\n${lines.join('\n')}`;
            extra.openTab = 'memory';
          }
          source = 'memory';
        }
      } catch (_) {
        reply = "I couldn't search your memories. Please try again.";
        source = 'memory';
      }
    }
    // 12b) Clear old memories (> 30 days)
    else if (isClearOldMemoriesIntent(trimmed)) {
      try {
        const deleted = await memoryService.clearOldMemories(userId, 30);
        if (deleted === 0) {
          reply = `No old memories to clear — all your memories were updated within the last 30 days.`;
        } else {
          reply = `✓ Cleared ${deleted} old ${deleted === 1 ? 'memory' : 'memories'} (last updated > 30 days ago).\n\nYour memory panel has been updated.`;
          extra.memoryChanged = { action: 'clear', count: deleted };
          extra.openTab = 'memory';
        }
        source = 'memory';
      } catch (_) {
        reply = "I couldn't clear old memories. Please try again.";
        source = 'memory';
      }
    }
    // 12) Recall memories (show my preferences / what do you remember — fetch all, don't search by phrase)
    else if (isRecallIntent(trimmed)) {
      try {
        const memories = await memoryService.retrieve(userId, { limit: 25 });
        reply = formatMemoriesForReply(memories);
        source = 'memory';
        memoriesRecalled = memories;
        extra.openTab = 'memory';
      } catch (_) {
        reply = "I couldn't fetch memories. Please try again.";
        source = 'memory';
      }
    }
    // Part 7: status / settings / analytics intents
    else if (reply === null) {
      let { intent, payload } = intentService.classify(trimmed);

      // Specific usage stats queries: "how many commands did I run?"
      if (intent === 'usage_stats' && payload?.type) {
        try {
          const { type } = payload;
          let count = 0;
          let label = '';

          if (type === 'commands') {
            const CommandLog = require('../models/CommandLog');
            count = await CommandLog.countDocuments({ userId });
            label = count === 1 ? 'VM command' : 'VM commands';
            reply = `You have executed ${count} ${label}.`;
          } else if (type === 'memories') {
            const Memory = require('../models/Memory');
            count = await Memory.countDocuments({ userId });
            label = count === 1 ? 'memory' : 'memories';
            reply = `You currently have ${count} stored ${label}.`;
          } else if (type === 'tasks') {
            const tasks = await taskService.list(userId);
            count = tasks.length;
            const done = tasks.filter((t) => t.done).length;
            const pending = count - done;
            reply = `You have ${count} ${count === 1 ? 'task' : 'tasks'} (${done} done, ${pending} pending).`;
          } else if (type === 'goals') {
            const goals = await goalService.list(userId);
            count = goals.length;
            reply = `You have ${count} ${count === 1 ? 'goal' : 'goals'} set.`;
          } else if (type === 'ai_calls') {
            const summary = await analyticsService.getSummary(userId);
            count = summary.ai_call || 0;
            reply = `You have made ${count} AI ${count === 1 ? 'call' : 'calls'}.`;
          } else if (type === 'reminders') {
            const Reminder = require('../models/Reminder');
            count = await Reminder.countDocuments({ userId, dismissed: false });
            const total = await Reminder.countDocuments({ userId });
            reply = `You have ${count} active ${count === 1 ? 'reminder' : 'reminders'} (${total} total).`;
          }

          source = 'memory';
          extra.usageStats = { type, count };
        } catch (_) {
          reply = "Couldn't fetch that statistic.";
          source = 'memory';
        }
      }
      // Settings change via natural language
      else if (intent === 'settings_change' && payload) {
        const { setting, value } = payload;
        try {
          await settingsService.update(userId, { [setting]: value });
          const settingDisplayName = {
            voiceEnabled: 'Voice',
            safeModeEnabled: 'Safe mode',
            fallbackModeEnabled: 'Fallback mode',
            conciseResponses: 'Concise responses',
            showSystemMetrics: 'System metrics',
          }[setting] || setting;

          reply = `${settingDisplayName} ${value ? 'enabled' : 'disabled'}.`;
          source = 'settings';
          extra.settingChanged = { setting, value };
        } catch (err) {
          reply = "Couldn't update that setting.";
          source = 'settings';
        }
      }
      // App configuration queries: "Is safe mode enabled?", "Is voice on?"
      else if (intent === 'app_config_query' && payload) {
        const { setting } = payload;
        try {
          const s = await settingsService.get(userId);
          const settingDisplayName = {
            voiceEnabled: 'Voice',
            safeModeEnabled: 'Safe mode',
            fallbackModeEnabled: 'Fallback mode',
            conciseResponses: 'Concise responses',
            showSystemMetrics: 'System metrics',
          }[setting] || setting;
          const currentValue = s[setting];
          reply = `${settingDisplayName} is currently ${currentValue ? 'enabled' : 'disabled'}.`;
          source = 'settings';
          extra.configQuery = { setting, value: currentValue };
        } catch (_) {
          reply = "Couldn't fetch that setting.";
          source = 'settings';
        }
      }
      // LLM fallback for ambiguous settings changes
      else if (looksLikeSettingsChange(message)) {
        const extracted = await extractSettingsWithLLM(message);
        if (extracted) {
          const { setting, value } = extracted;
          try {
            await settingsService.update(userId, { [setting]: value });
            const settingDisplayName = {
              voiceEnabled: 'Voice',
              safeModeEnabled: 'Safe mode',
              fallbackModeEnabled: 'Fallback mode',
              conciseResponses: 'Concise responses',
              showSystemMetrics: 'System metrics',
            }[setting] || setting;

            reply = `${settingDisplayName} ${value ? 'enabled' : 'disabled'}.`;
            source = 'settings';
            extra.settingChanged = { setting, value };
          } catch (err) {
            reply = "Couldn't update that setting.";
            source = 'settings';
          }
        } else {
          // LLM couldn't extract, fall through to normal chat
          intent = 'chat';
        }
      }
      // Deterministic personalized suggestions based on stored preferences
      else if (intent === 'suggestion' && payload) {
        const suggestionType = payload.type || 'projects';
        const inlineLanguage = payload.language || null;
        try {
          const result = await suggestionsService.getSuggestions(userId, suggestionType, inlineLanguage);

          if (result.found) {
            const { preference, suggestions } = result;
            const typeLabel = { projects: 'project ideas', learning: 'learning topics', tools: 'tools', skills: 'skills to develop' }[suggestionType] || suggestionType;
            const bullet = suggestions.slice(0, 6).map((s) => `• ${s}`).join('\n');
            reply = `Here are ${typeLabel} based on your **${preference}** preference:\n\n${bullet}\n\n_These are predefined rule-based suggestions — not AI-generated._`;
            source = 'suggestions';
            extra.suggestions = { preference, preferenceType: result.preferenceType, suggestionType, items: suggestions };
          } else {
            reply = result.message || "I don't have enough preferences stored to make suggestions.";
            source = 'suggestions';
          }
        } catch (err) {
          console.error('Suggestions handler error:', err);
          reply = "Couldn't generate suggestions. Please try again.";
          source = 'suggestions';
        }
      }
      // General status check
      else if (intent === 'status') {
        try {
          await memoryService.refreshMemoryCount();
          const health = systemHealth.getState();
          const fb = fallbackManager.getFallbackState();
          const load = loadGuard.getLoadInfo();
          const safe = !loadGuard.isUnderLoad();
          reply = [
            `AI: ${aiService.isAvailable() ? 'available' : 'unavailable'}.`,
            `Fallback: ${fb.fallbackActive ? 'active' : 'inactive'}.`,
            `Memory count: ${health.memoryCount}.`,
            safe ? 'Safe mode: on (VM disabled).' : 'Safe mode: off.',
            `Load: ${load.activeRequests}/${load.maxConcurrent} requests.`,
          ].join(' ');
          source = 'memory';
        } catch (_) {
          reply = "Couldn't fetch status.";
          source = 'memory';
        }
      } else if (intent === 'settings') {
        try {
          const s = await settingsService.get(userId);
          reply = `Your settings: voice ${s.voiceEnabled ? 'on' : 'off'}, fallback mode ${s.fallbackModeEnabled ? 'on' : 'off'}, safe mode ${s.safeModeEnabled ? 'on' : 'off'}, concise ${s.conciseResponses ? 'on' : 'off'}, system metrics ${s.showSystemMetrics ? 'on' : 'off'}. Use the Settings panel to change.`;
          source = 'memory';
        } catch (_) {
          reply = "Couldn't fetch settings.";
          source = 'memory';
        }
      } else if (intent === 'analytics') {
        try {
          // Get comprehensive analytics from multiple sources
          const summary = await analyticsService.getSummary(userId);
          const Memory = require('../models/Memory');
          const CommandLog = require('../models/CommandLog');
          const Reminder = require('../models/Reminder');
          const tasks = await taskService.list(userId);
          const goals = await goalService.list(userId);

          const memoryCount = await Memory.countDocuments({ userId });
          const commandCount = await CommandLog.countDocuments({ userId });
          const taskCount = tasks.length;
          const tasksDone = tasks.filter((t) => t.done).length;
          const goalCount = goals.length;
          const reminderCount = await Reminder.countDocuments({ userId, dismissed: false });

          const lines = [
            `Memories: ${memoryCount}`,
            `Tasks: ${taskCount} (${tasksDone} done, ${taskCount - tasksDone} pending)`,
            `Goals: ${goalCount}`,
            `Reminders: ${reminderCount} active`,
            `VM Commands: ${commandCount}`,
          ];

          // Add analytics data
          if (summary.ai_call) lines.push(`AI Calls: ${summary.ai_call}`);
          if (summary.fallback) lines.push(`Fallback Uses: ${summary.fallback}`);
          if (summary.memory_save) lines.push(`Memory Saves: ${summary.memory_save}`);

          reply = 'Your usage stats:\n\n' + lines.join('\n');
          source = 'memory';
          extra.fullAnalytics = { memoryCount, taskCount, goalCount, commandCount, reminderCount, summary };
        } catch (_) {
          reply = "Couldn't fetch usage.";
          source = 'memory';
        }
      }
    }

    // 13) Normal chat (AI or fallback) — Part 5: memory context; Part 6: conversation history from DB
    if (reply === null) {
      let historyForAi = history;
      try {
        const dbHistory = await conversationService.getRecent(userId, 10);
        if (dbHistory.length > 0) historyForAi = dbHistory;
      } catch (_) {
        // use request history
      }
      if (aiService.isAvailable()) {
        let systemPrompt = 'You are Jarvis, a helpful AI assistant. Be concise and accurate.';
        try {
          const relevant = await memoryService.getRelevantForContext(userId, trimmed, 5);
          if (relevant.length > 0) {
            const memoryLines = relevant.map((m) => `- ${m.type}${m.category ? ` (${m.category})` : ''}: ${typeof m.value === 'string' ? m.value : JSON.stringify(m.value)}`);
            systemPrompt += '\n\nKnown facts about the user (use when relevant):\n' + memoryLines.join('\n');
          }
        } catch (_) {
          // continue without memory context
        }
        reply = await aiService.chat(trimmed, { history: historyForAi, systemPrompt });
        if (reply !== null) {
          source = 'ai';
          analyticsService.increment(userId, 'ai_call').catch(() => { });
        }
      }
      if (reply === null) {
        fallbackManager.recordFallbackUsage();
        activityService.log(userId, 'fallback', {}).catch(() => { });
        analyticsService.increment(userId, 'fallback').catch(() => { });
        reply = FALLBACK_MESSAGE;
      }
    }

    // Part 6: persist this exchange to conversation history
    conversationService.appendExchange(userId, trimmed, reply).catch(() => { });

    res.json({
      reply,
      source,
      aiAvailable: aiService.isAvailable(),
      ...(memoriesRecalled !== null && { memories: memoriesRecalled }),
      extra,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { chat };
