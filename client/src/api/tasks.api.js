import { api } from './axios';

export async function getTasks() {
  const { data } = await api.get('/tasks');
  return data;
}

export async function createTask(title) {
  const { data } = await api.post('/tasks', { title });
  return data;
}

export async function markTaskDone(id, done = true) {
  const { data } = await api.patch(`/tasks/${id}/done`, { done });
  return data;
}

export async function deleteTask(id) {
  const { data } = await api.delete(`/tasks/${id}`);
  return data;
}
