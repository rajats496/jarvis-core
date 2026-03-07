import { api } from './axios';

export async function getHealth() {
  const { data } = await api.get('/system/health');
  return data;
}

export async function getStatus() {
  const { data } = await api.get('/system/status');
  return data;
}
