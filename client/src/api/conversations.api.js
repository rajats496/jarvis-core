import { api } from './axios';

export async function getHistory(limit = 50) {
  const { data } = await api.get('/conversations/history', { params: { limit } });
  return data.messages || [];
}

export async function search(query, limit = 20) {
  const { data } = await api.get('/conversations/search', { params: { q: query, limit } });
  return data.matches || [];
}

export async function list(limit = 10) {
  const { data } = await api.get('/conversations', { params: { limit } });
  return data.conversations || [];
}
