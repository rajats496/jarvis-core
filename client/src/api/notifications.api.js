import { api } from './axios';

export async function getNotifications() {
  const { data } = await api.get('/notifications');
  return data;
}

export async function getPending() {
  const { data } = await api.get('/notifications/pending');
  return data.notifications || [];
}

export async function markRead(notificationId) {
  const { data } = await api.post(`/notifications/${notificationId}/read`);
  return data;
}

export async function getAll(limit = 50) {
  const { data } = await api.get('/notifications', { params: { limit } });
  return data.notifications || [];
}
