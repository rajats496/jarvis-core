import { api } from './axios';

export async function getTimeline(limit = 50) {
  const { data } = await api.get('/activity/timeline', { params: { limit } });
  return data;
}
