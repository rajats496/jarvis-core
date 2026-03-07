import { api } from './axios';

export async function getReminders() {
  const { data } = await api.get('/reminders');
  return data;
}

export async function createReminder(text, triggerAt) {
  const { data } = await api.post('/reminders', { text, triggerAt });
  return data;
}

export async function dismissReminder(id) {
  const { data } = await api.post(`/reminders/${id}/dismiss`);
  return data;
}
