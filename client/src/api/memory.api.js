import { api } from './axios';

export async function getMemories(params = {}) {
  const { data } = await api.get('/memory', { params });
  return data;
}

export async function searchMemories(q, limit = 20) {
  const { data } = await api.get('/memory/search', { params: { q, limit } });
  return data;
}

export async function createMemory(body) {
  const { data } = await api.post('/memory', body);
  return data;
}

export async function updateMemory(id, body) {
  const { data } = await api.put(`/memory/${id}`, body);
  return data;
}

export async function deleteMemory(id) {
  await api.delete(`/memory/${id}`);
}

export async function exportMemories() {
  const { data } = await api.get('/memory/export', { responseType: 'blob' });
  return data;
}

export async function getMemoryCategories() {
  const { data } = await api.get('/memory/categories');
  return data;
}
