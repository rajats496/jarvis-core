/**
 * Chat window - messages, send via API, loading, AI/Fallback indicator.
 * Messages persist in localStorage per user so they survive refresh.
 */
import { useState, useRef, useEffect, Fragment } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useVoice } from '../../hooks/useVoice';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import * as chatApi from '../../api/chat.api';
import * as settingsApi from '../../api/settings.api';
import * as conversationsApi from '../../api/conversations.api';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import JarvisAvatar from './JarvisAvatar';

const STORAGE_KEY_PREFIX = 'jarvis_chat_';
const MAX_MESSAGES_STORED = 200;

function loadStoredMessages(userId) {
  try {
    const key = userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}guest`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_MESSAGES_STORED) : [];
  } catch {
    return [];
  }
}

function saveMessages(userId, messages) {
  try {
    const key = userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}guest`;
    const toSave = messages.slice(-MAX_MESSAGES_STORED);
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch {
    // ignore
  }
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 280,
  background: '#0A0C10',
};
const headerStyle = {
  padding: '14px 20px',
  borderBottom: '1px solid rgba(180, 196, 220, 0.09)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  background: 'rgba(8, 10, 16, 0.60)',
  backdropFilter: 'blur(14px)',
};
const badge = (label, isActive) => ({
  fontSize: '0.72rem',
  padding: '3px 10px',
  borderRadius: 6,
  background: isActive ? 'rgba(184,196,216,0.14)' : 'transparent',
  color: isActive ? '#EEF2FF' : '#2E3545',
  border: `1px solid ${isActive ? 'rgba(200,216,240,0.28)' : 'rgba(180,196,220,0.09)'}`,
  fontWeight: 500,
  transition: 'all 0.2s ease',
  fontFamily: "'DM Mono', monospace",
  letterSpacing: '0.06em',
});
const messagesStyle = {
  flex: 1,
  overflow: 'auto',
  padding: '10px 20px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(160,180,220,0.18) transparent',
};
const emptyWrapStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 1rem',
  textAlign: 'center',
};
const emptyTitleStyle = {
  fontSize: '1.2rem',
  fontWeight: 700,
  marginBottom: '0.75rem',
  background: 'linear-gradient(135deg, #FFFFFF 0%, #B8C4D8 55%, #7A90B0 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontFamily: "'Orbitron', monospace",
  letterSpacing: '0.14em',
};
const emptyHintStyle = {
  fontSize: '0.9rem',
  color: '#6E7A90',
  marginBottom: '1.5rem',
  lineHeight: 1.6,
  maxWidth: '400px',
  fontFamily: "'Rajdhani', sans-serif",
};
const quickTipsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.6rem',
  justifyContent: 'center',
  maxWidth: '600px',
};
const tipStyle = {
  padding: '6px 14px',
  borderRadius: 999,
  background: 'rgba(12,15,22,0.90)',
  border: '1px solid rgba(180,196,220,0.12)',
  color: '#6E7A90',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'all .18s',
  fontFamily: "'DM Mono', monospace",
  fontWeight: 500,
  whiteSpace: 'nowrap',
};
const loadingStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  background: 'rgba(12, 15, 22, 0.92)',
  borderRadius: '4px 14px 14px 14px',
  padding: '10px 14px',
  border: '1px solid rgba(160, 180, 220, 0.12)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  alignSelf: 'flex-start',
  maxWidth: '180px',
};

const clearBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#4A5568',
  fontSize: '13px',
  fontFamily: "'Rajdhani', sans-serif",
  padding: '6px 10px',
  borderRadius: '8px',
  transition: 'background 0.18s, color 0.18s',
  marginLeft: 'auto',
};

const quickRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  padding: '6px 20px 8px',
  flexShrink: 0,
  borderTop: '1px solid rgba(180,196,220,0.06)',
};

const qaStyle = {
  background: 'rgba(12,15,22,0.90)',
  border: '1px solid rgba(180,200,220,0.12)',
  borderRadius: '999px',
  padding: '6px 14px',
  fontSize: '12px',
  color: '#6E7A90',
  cursor: 'pointer',
  fontFamily: "'DM Mono', monospace",
  fontWeight: 500,
  transition: 'all .18s',
  whiteSpace: 'nowrap',
};

const followUpChipStyle = {
  background: 'transparent',
  border: '1px solid rgba(180,200,220,0.09)',
  borderRadius: 999,
  padding: '4px 11px',
  fontSize: '11.5px',
  color: '#2E3545',
  cursor: 'pointer',
  fontFamily: "'DM Mono', monospace",
  fontWeight: 500,
  transition: 'all .18s',
  whiteSpace: 'nowrap',
};
function getFollowUpSuggestions(content) {
  const c = (content || '').toLowerCase();
  if (/\btask|todo|added task/.test(c)) return ['Show all tasks', "What's pending?", 'Mark a task done'];
  if (/\bmemor|remember|stored|recall/.test(c)) return ['What do you remember?', 'Search memories', 'Clear old memories'];
  if (/\bremind|alert|scheduled/.test(c)) return ['Show my reminders', "What's due today?", 'Add another reminder'];
  if (/\bgoal|target|streak|progressing|achieved/.test(c)) return ['Show my goals', 'Mark goal 1 achieved', 'Log 5 days for goal 1'];
  if (/\bcpu|disk|process|system load|ram/.test(c)) return ['Check disk space', 'Show active processes', 'Run diagnostics'];
  if (/\banalytic|usage|stat|count/.test(c)) return ['Show detailed analytics', 'Messages this week', 'Export usage stats'];
  return ['What else can you do?', 'Show my tasks', 'Check system status'];
}

const QUICK_TIPS = [
  'Remember that I prefer Python',
  'What do you remember?',
  'Add task: Complete notes',
  'Show my tasks',
  'My goal is to learn system design in 30 days',
  'Remind me tomorrow at 9am to revise',
];

export default function ChatWindow({ onMemoryUpdate, clearChatTrigger, quickMessage }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [aiAvailable, setAiAvailable] = useState(null);
  const [lastSource, setLastSource] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef(messages);
  const { settings, setSettings } = useSettings();
  const { refresh: refreshSystemStatus } = useSystemStatus();
  const voiceEnabled = settings?.voiceEnabled !== false;

  messagesRef.current = messages;

  // External clear-chat trigger from header button
  useEffect(() => {
    if (clearChatTrigger > 0) {
      setMessages([]);
      saveMessages(userId, []);
      conversationsApi.clearHistory().catch(() => {});
    }
  }, [clearChatTrigger, userId]);

  // Quick command message sent from right-panel buttons
  useEffect(() => {
    if (quickMessage?.text) handleSend(quickMessage.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickMessage]);
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const conversationsApi = await import('../../api/conversations.api');
        const history = await conversationsApi.getHistory(50);
        const formatted = history.map((m) => ({
          role: m.role,
          content: m.content,
          source: m.role === 'assistant' ? 'ai' : null,
        }));
        if (formatted.length > 0) {
          setMessages(formatted);
        } else {
          // Fallback to localStorage if DB is empty
          const stored = loadStoredMessages(userId);
          if (stored.length > 0) setMessages(stored);
        }
      } catch (err) {
        // Fallback to localStorage on error
        const stored = loadStoredMessages(userId);
        if (stored.length > 0) setMessages(stored);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [userId]);

  useEffect(() => {
    if (messages.length > 0 && !loadingHistory) saveMessages(userId, messages);
  }, [messages, userId, loadingHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = (messagesRef.current || []).map((m) => ({ role: m.role, content: m.content }));
      const { reply, source, aiAvailable: available, memories, extra } = await chatApi.sendMessage(text, history);
      setAiAvailable(available);
      setLastSource(source);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, source, memories: memories || null }]);
      if (source === 'memory' && typeof onMemoryUpdate === 'function') onMemoryUpdate();

      // Panels are always-mounted — fire events immediately, no mounting delay needed
      const hasPostEvent = extra?.taskChanged || extra?.taskFilter || extra?.memoryChanged || extra?.goalChanged || extra?.goalFilter;
      if (hasPostEvent) {
        setTimeout(() => {
          if (extra?.taskChanged) {
            window.dispatchEvent(new CustomEvent('jarvis:task-changed', { detail: extra.taskChanged }));
          }
          if (extra?.taskFilter) {
            window.dispatchEvent(new CustomEvent('jarvis:task-filter', { detail: { filter: extra.taskFilter } }));
          }
          if (extra?.goalChanged) {
            window.dispatchEvent(new CustomEvent('jarvis:goal-changed', { detail: extra.goalChanged }));
          }
          if (extra?.goalFilter) {
            window.dispatchEvent(new CustomEvent('jarvis:goal-filter', { detail: { filter: extra.goalFilter } }));
          }
          if (extra?.memoryChanged) {
            window.dispatchEvent(new CustomEvent('jarvis:memory-changed', { detail: extra.memoryChanged }));
            if (typeof onMemoryUpdate === 'function') onMemoryUpdate();
          }
        }, 150);
      } else if (extra?.memoryChanged) {
        // memory-changed without a tab switch — panel already mounted, fire immediately
        window.dispatchEvent(new CustomEvent('jarvis:memory-changed', { detail: extra.memoryChanged }));
        if (typeof onMemoryUpdate === 'function') onMemoryUpdate();
      }

      // Refresh settings if a setting was changed via chat
      if (extra?.settingChanged) {
        try {
          const updatedSettings = await settingsApi.getSettings();
          // Force update with timestamp to ensure React detects the change
          setSettings({ ...updatedSettings, _updated: Date.now() });
          // Refresh system status to update safe mode display immediately
          if (refreshSystemStatus) {
            refreshSystemStatus();
          }
        } catch {
          // Silent fail - user already got confirmation message
        }
      }

      if (voiceEnabled && voice.supported.tts && reply) voice.speak(reply);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to send.';
      setMessages((prev) => [...prev, { role: 'assistant', content: msg, source: 'fallback', isFailedSend: true, lastUserText: text }]);
      setAiAvailable(false);
      if (voiceEnabled && voice.supported.tts && msg) voice.speak(msg);
    } finally {
      setLoading(false);
    }
  };

  const voice = useVoice({
    onResult: (text) => {
      if (text) handleSend(text);
    },
  });

  const isEmpty = messages.length === 0 && !loading;

  const handleClearChat = () => {
    if (messages.length === 0) return;
    setMessages([]);
    saveMessages(userId, []);
    conversationsApi.clearHistory().catch(() => {});
  };

  return (
    <div style={containerStyle}>
      {/* Topbar */}
      <div style={headerStyle} className="chat-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={badge('AI', lastSource === 'ai')}>AI</span>
          <span style={badge('Memory', lastSource === 'memory')}>Memory</span>
          <span style={badge('Fallback', lastSource === 'fallback')}>Fallback</span>
        </div>
      </div>
      <div style={messagesStyle} className="chat-messages-area">
        {isEmpty && (
          <div style={emptyWrapStyle}>
            {/* Jarvis Holographic Avatar */}
            <JarvisAvatar size={180} />
            <div style={emptyTitleStyle}>JARVIS ONLINE</div>
            <p style={emptyHintStyle}>
              All systems operational. Try memory, tasks, goals, reminders, or ask anything.
            </p>
            <div style={quickTipsStyle}>
              {QUICK_TIPS.map((tip, i) => (
                <span
                  key={i}
                  style={tipStyle}
                  title="Click to send"
                  onClick={() => handleSend(tip)}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(184,196,216,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(200,216,240,0.22)';
                    e.currentTarget.style.color = '#EEF2FF';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(12,15,22,0.90)';
                    e.currentTarget.style.borderColor = 'rgba(180,196,220,0.12)';
                    e.currentTarget.style.color = '#6E7A90';
                    e.currentTarget.style.transform = 'none';
                  }}
                >{tip}</span>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => {
          const isLastAssistant = m.role === 'assistant' && i === messages.length - 1 && !loading;
          return (
            <Fragment key={i}>
              <MessageBubble
                role={m.role}
                content={m.content}
                source={m.source}
                memories={m.memories}
                isFailedSend={m.isFailedSend}
                lastUserText={m.lastUserText}
                onRetry={handleSend}
                onReadAloud={voice.speak}
                readAloudEnabled={voiceEnabled && voice.supported.tts}
              />
              {isLastAssistant && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingLeft: 4, marginTop: -4, paddingBottom: 2 }}>
                  {getFollowUpSuggestions(m.content).map((s, si) => (
                    <button
                      key={si}
                      onClick={() => handleSend(s)}
                      style={followUpChipStyle}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,196,216,0.08)'; e.currentTarget.style.borderColor = 'rgba(200,216,240,0.22)'; e.currentTarget.style.color = '#EEF2FF'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(180,200,220,0.09)'; e.currentTarget.style.color = '#2E3545'; e.currentTarget.style.transform = 'none'; }}
                    >
                      ↪ {s}
                    </button>
                  ))}
                </div>
              )}
            </Fragment>
          );
        })}
        {loading && (
          <div style={loadingStyle}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(180,200,230,0.10), rgba(160,185,220,0.06))',
              border: '1px solid rgba(160,180,220,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" viewBox="0 0 100 100" fill="none">
                <polygon points="50,6 88,28 88,72 50,94 12,72 12,28"
                  stroke="#B8C4D8" strokeWidth="3" fill="none" strokeLinejoin="round"/>
                <polygon points="50,32 64,50 50,68 36,50"
                  stroke="#D0DCEF" strokeWidth="2" fill="rgba(200,220,255,0.06)"/>
                <circle cx="50" cy="50" r="5" fill="#EEF4FF" opacity="0.90"/>
                <circle cx="50" cy="50" r="2.5" fill="#FFFFFF"/>
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} className="typing-dot" style={{ animationDelay: `${i * 0.18}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick action pills */}
      <div style={quickRowStyle} className="chat-quick-row">
        {['Check CPU', 'Show Memories', 'Run Diagnostics', 'View Analytics'].map(a => (
          <button
            key={a}
            style={qaStyle}
            onClick={() => handleSend(a)}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,196,216,0.08)'; e.currentTarget.style.borderColor = 'rgba(200,216,240,0.22)'; e.currentTarget.style.color = '#EEF2FF'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(12,15,22,0.90)'; e.currentTarget.style.borderColor = 'rgba(180,200,220,0.12)'; e.currentTarget.style.color = '#6E7A90'; e.currentTarget.style.transform = 'none'; }}
          >{a}</button>
        ))}
      </div>

      <div style={{ flexShrink: 0 }}>
        <ChatInput onSend={handleSend} disabled={loading} voice={voice} voiceEnabled={voiceEnabled} />
      </div>
    </div>
  );
}
