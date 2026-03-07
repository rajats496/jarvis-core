import { api } from './axios';

export async function getCommandHistory(limit = 10) {
  const { data } = await api.get('/commands/history', { params: { limit } });
  return data;
}
