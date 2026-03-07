/**
 * Dashboard - Futuristic 3-panel layout (Sidebar | Main Content | System Monitor)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useVoice } from '../hooks/useVoice';
import * as settingsApi from '../api/settings.api';
import { getPending, markRead } from '../api/notifications.api';
import { useNavigate } from 'react-router-dom';
import JarvisSidebar from '../components/Dashboard/JarvisSidebar';
import JarvisHeader from '../components/Dashboard/JarvisHeader';
import ReminderToast from '../components/Dashboard/ReminderToast';
import MobileNavDrawer from '../components/Dashboard/MobileNavDrawer';
import SystemMonitorPanel from '../components/Dashboard/SystemMonitorPanel';
import ChatWindow from '../components/Chat/ChatWindow';
import ConversationSearch from '../components/Dashboard/ConversationSearch';
import MemoryPanel from '../components/Memory/MemoryPanel';
import TasksPanel from '../components/Dashboard/TasksPanel';
import GoalsPanel from '../components/Dashboard/GoalsPanel';
import RemindersPanel from '../components/Dashboard/RemindersPanel';
import ActivityTimeline from '../components/Dashboard/ActivityTimeline';
import VMPanel from '../components/System/VMPanel';
import StatusPanel from '../components/System/StatusPanel';
import SettingsPanel from '../components/Settings/SettingsPanel';
import UsageStats from '../components/Analytics/UsageStats';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { settings, setSettings } = useSettings();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(
    () => sessionStorage.getItem('jarvis_activeTab') || 'chat'
  );

  // Keep sessionStorage in sync whenever the tab changes
  const handleTabChange = (tab) => {
    sessionStorage.setItem('jarvis_activeTab', tab);
    setActiveTab(tab);
  };
  const [panelsRefreshKey, setPanelsRefreshKey] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [reminderNotifs, setReminderNotifs] = useState([]);
  const [clearChatTrigger, setClearChatTrigger] = useState(0);
  const [quickChatMessage, setQuickChatMessage] = useState(null);

  // Track already-shown notification IDs so we never double-speak or re-show
  const seenIdsRef = useRef(new Set());

  // Use ref so fetchPending never needs to re-close over these values.
  // This keeps the useCallback identity stable (empty deps) and the
  // interval never accidentally restarts just because settings loaded.
  const voiceEnabledRef = useRef(true);
  voiceEnabledRef.current = settings?.voiceEnabled !== false;

  useVoice({}); // keep hook alive for STT/TTS elsewhere

  const handleMemoryUpdate = () => setPanelsRefreshKey((k) => k + 1);

  // Listen for quick-command chat events from the right panel buttons
  useEffect(() => {
    const handler = (e) => {
      const text = e.detail?.text;
      if (!text) return;
      handleTabChange('chat');
      setQuickChatMessage({ text, ts: Date.now() });
    };
    window.addEventListener('jarvis:quickchat', handler);
    return () => window.removeEventListener('jarvis:quickchat', handler);
  }, []);

  useEffect(() => {
    settingsApi.getSettings().then((data) => setSettings(data || {})).catch(() => setSettings({}));
  }, [setSettings]);

  // Poll for triggered reminders every 10s — show toast + speak if voice enabled.
  // Empty deps array: stable identity, refs are read at call-time (no stale values).
  const fetchPending = useCallback(async () => {
    try {
      const notifs = await getPending();
      if (!notifs || notifs.length === 0) return;

      const fresh = notifs.filter((n) => !seenIdsRef.current.has(n.id));
      if (fresh.length === 0) return;

      // Mark as seen immediately so rapid polls don't re-announce
      fresh.forEach((n) => seenIdsRef.current.add(n.id));

      setReminderNotifs((prev) => [...prev, ...fresh]);

      // Speak each new reminder via browser TTS
      const canSpeak = voiceEnabledRef.current && typeof window !== 'undefined' && !!window.speechSynthesis;
      if (canSpeak) {
        fresh.forEach((n, i) => {
          setTimeout(() => {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(`Reminder: ${n.text}`);
            u.rate = 0.95;
            u.pitch = 1;
            window.speechSynthesis.speak(u);
          }, i * 3500);
        });
      }
    } catch (_) {
      // silently ignore — don't disrupt UI on network hiccup
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchPending(); // immediate first check
    const interval = setInterval(fetchPending, 10 * 1000); // poll every 10s
    return () => clearInterval(interval);
  }, [fetchPending]);

  const handleDismissNotif = useCallback(async (id) => {
    setReminderNotifs((prev) => prev.filter((n) => n.id !== id));
    try { await markRead(id); } catch (_) { /* best-effort */ }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'search':
        return <ConversationSearch />;
      case 'reminders':
        return <RemindersPanel key={panelsRefreshKey} />;
      case 'activity':
        return <ActivityTimeline />;
      case 'commands':
        return <VMPanel />;
      case 'status':
        return <StatusPanel />;
      case 'settings':
        return <SettingsPanel />;
      case 'analytics':
        return <UsageStats />;
      default:
        return <ChatWindow onMemoryUpdate={handleMemoryUpdate} clearChatTrigger={clearChatTrigger} quickMessage={quickChatMessage} />;
    }
  };

  return (
    <div style={layoutStyle}>
      {/* Reminder toasts — fixed position, bottom-right */}
      <ReminderToast notifications={reminderNotifs} onDismiss={handleDismissNotif} />

      {/* Mobile Nav Drawer — rendered for all screen sizes but CSS hides hamburger on desktop */}
      <MobileNavDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        user={user}
        onLogout={handleLogout}
      />

      {/* Fixed Hamburger button — bottom-left, mobile only (hidden on desktop via CSS) */}
      <button
        type="button"
        className="mobile-hamburger-btn"
        onClick={() => setMobileDrawerOpen(true)}
        aria-label="Open navigation menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Sidebar - Left (desktop) */}
      {!sidebarCollapsed && (
        <JarvisSidebar activeTab={activeTab} onTabChange={handleTabChange} user={user} />
      )}

      {/* Main Content - Center */}
      <main className="dashboard-main" style={{ ...mainStyle, marginLeft: sidebarCollapsed ? 0 : '260px', marginRight: sidebarCollapsed ? 0 : '280px' }}>
        <JarvisHeader
          user={user}
          onLogout={handleLogout}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onClearChat={() => setClearChatTrigger(c => c + 1)}
          notifications={reminderNotifs}
          onNotifDismiss={handleDismissNotif}
        />

        {/* Mobile quick-tab strip (compact, scrollable) */}
        {sidebarCollapsed && (
          <div style={mobileNavStyle} className="jarvis-scroll mobile-tab-strip">
            {['chat', 'memory', 'tasks', 'goals', 'reminders', 'activity', 'commands', 'analytics', 'settings'].map((tab) => (
              <button
                key={tab}
                className={`jarvis-nav-item ${activeTab === tab ? 'active' : ''}`}
                onClick={() => handleTabChange(tab)}
                style={mobileTabStyle}
              >
                {tab === 'commands' ? 'Desktop' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        )}

        <section style={contentStyle} className="glass-panel jarvis-scroll">
          {/* Always-mounted panels — listeners stay active even while on chat tab */}
          <div style={{ display: activeTab === 'memory' ? 'block' : 'none', height: activeTab === 'memory' ? '100%' : 0, overflow: 'hidden' }}>
            <MemoryPanel key={panelsRefreshKey} />
          </div>
          <div style={{ display: activeTab === 'tasks' ? 'block' : 'none', height: activeTab === 'tasks' ? '100%' : 0, overflow: 'hidden' }}>
            <TasksPanel />
          </div>
          <div style={{ display: activeTab === 'goals' ? 'block' : 'none', height: activeTab === 'goals' ? '100%' : 0, overflow: 'hidden' }}>
            <GoalsPanel />
          </div>
          {/* All other tabs rendered on demand */}
          {!['memory', 'tasks', 'goals'].includes(activeTab) && renderContent()}
        </section>
      </main>

      {/* System Monitor - Right */}
      {!sidebarCollapsed && <SystemMonitorPanel onTabChange={handleTabChange} />}
    </div>
  );
}

const layoutStyle = {
  display: 'flex',
  height: '100%',           /* Fill fixed-height root — no document scroll */
  position: 'relative',
  overflow: 'hidden',
};

const mainStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',           /* Contain scroll within main, not body */
  padding: '0 1rem',
  transition: 'margin 0.3s ease',
  overflow: 'hidden',
};

const contentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  overflow: 'hidden',
  marginTop: '1rem',
  marginBottom: '1rem',
};

const mobileNavStyle = {
  display: 'flex',
  gap: '0.4rem',
  padding: '0.5rem 0 0.5rem',
  overflowX: 'auto',
  flexShrink: 0,
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
};

const mobileTabStyle = {
  padding: '0.45rem 0.85rem',
  border: 'none',
  background: 'transparent',
  whiteSpace: 'nowrap',
  fontSize: '0.82rem',
  flexShrink: 0,
};