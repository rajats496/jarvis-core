import { api } from './axios';

export async function getGoals() {
  const { data } = await api.get('/goals');
  return data;
}

export async function createGoal(title, daysTotal = 30) {
  const { data } = await api.post('/goals', { title, daysTotal });
  return data;
}

export async function deleteGoal(id) {
  const { data } = await api.delete(`/goals/${id}`);
  return data;
}

export async function updateGoalProgress(id, daysDone) {
  const { data } = await api.patch(`/goals/${id}/progress`, { daysDone });
  return data;
}
