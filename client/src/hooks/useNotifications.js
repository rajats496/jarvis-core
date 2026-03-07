/**
 * Notifications hook - polls for pending reminders/notifications
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import * as notificationsApi from '../api/notifications.api';

const POLL_INTERVAL_MS = 30000; // 30 seconds

export function useNotifications(options = {}) {
  const { enabled = true, interval = POLL_INTERVAL_MS, onNotification } = options;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);
  const lastCheckRef = useRef(Date.now());

  const fetchPending = useCallback(async () => {
    try {
      const pending = await notificationsApi.getPending();
      const newOnes = pending.filter((n) => new Date(n.createdAt) > new Date(lastCheckRef.current));
      if (newOnes.length > 0 && typeof onNotification === 'function') {
        newOnes.forEach((n) => onNotification(n));
      }
      lastCheckRef.current = Date.now();
      setNotifications(pending);
      setUnreadCount(pending.filter((n) => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [onNotification]);

  useEffect(() => {
    if (!enabled) return;
    fetchPending();
    intervalRef.current = setInterval(fetchPending, interval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, interval, fetchPending]);

  const markRead = useCallback(async (notificationId) => {
    try {
      await notificationsApi.markRead(notificationId);
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    refresh: fetchPending,
    markRead,
  };
}
