import { api } from './axios';

export async function getSummary() {
  const { data } = await api.get('/analytics');
  return data;
}
