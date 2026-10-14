import { api } from './api';

export async function listGoals({ status } = {}) {
  const { data } = await api.get('/goals', { params: { status } });
  return data.goals;
}

export async function getGoal(id) {
  const { data } = await api.get(`/goals/${id}`);
  return data;   // { goal, contributions }
}

export async function createGoal(payload) {
  const { data } = await api.post('/goals', payload);
  return data.goal;
}

export async function contributeToGoal(id, { amountNaira, pin, source = 'wallet' }) {
  const { data } = await api.post(`/goals/${id}/contribute`, { amountNaira, pin, source });
  return data;   // { contribution, savedAfter, completed, capped }
}

export async function cancelGoal(id) {
  const { data } = await api.delete(`/goals/${id}`);
  return data.goal;
}
