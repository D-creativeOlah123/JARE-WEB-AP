import { api } from './api';

export async function listGroups() {
  const { data } = await api.get('/groups');
  return data.groups;
}

export async function getGroup(id) {
  const { data } = await api.get(`/groups/${id}`);
  return data;   // { group, contributions }
}

export async function createGroup(payload) {
  const { data } = await api.post('/groups', payload);
  return data.group;
}

export async function lookupGroup(inviteCode) {
  const { data } = await api.post('/groups/lookup', { inviteCode });
  return data.group;
}

export async function joinGroup(inviteCode) {
  const { data } = await api.post('/groups/join', { inviteCode });
  return data.group;
}

export async function contributeToGroup(id, { amountNaira, pin, source = 'wallet' }) {
  const { data } = await api.post(`/groups/${id}/contribute`, { amountNaira, pin, source });
  return data;
}
