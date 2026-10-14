import { api } from './api';

export async function getAdminSummary() {
  const { data } = await api.get('/admin/summary');
  return data;
}

export async function listAdminUsers({ q, role, limit = 25, cursor } = {}) {
  const { data } = await api.get('/admin/users', { params: { q, role, limit, cursor } });
  return data;
}

export async function getAdminUserDetail(id) {
  const { data } = await api.get(`/admin/users/${id}`);
  return data;
}

export async function patchAdminUser(id, patch) {
  const { data } = await api.patch(`/admin/users/${id}`, patch);
  return data.user;
}

export async function listAdminTransfers({ type, status, limit = 25, cursor } = {}) {
  const { data } = await api.get('/admin/transfers', { params: { type, status, limit, cursor } });
  return data;
}

export async function listAdminServices({ type, status, limit = 25, cursor } = {}) {
  const { data } = await api.get('/admin/services', { params: { type, status, limit, cursor } });
  return data;
}

export async function getAdminAnalytics(period = 'month') {
  const { data } = await api.get('/admin/analytics', { params: { period } });
  return data;
}

export async function listAdminGoals({ status, limit = 25, cursor } = {}) {
  const { data } = await api.get('/admin/goals', { params: { status, limit, cursor } });
  return data;
}

export async function listAdminGroups({ status, limit = 25, cursor } = {}) {
  const { data } = await api.get('/admin/groups', { params: { status, limit, cursor } });
  return data;
}

export async function getPlatformSettings() {
  const { data } = await api.get('/admin/settings');
  return data.settings;
}

export async function updatePlatformSettings(patch) {
  const { data } = await api.patch('/admin/settings', patch);
  return data.settings;
}

export async function getAdminModeration({ limit = 50 } = {}) {
  const { data } = await api.get('/admin/moderation', { params: { limit } });
  return data;
}

export async function adminSearch(q) {
  const { data } = await api.get('/admin/search', { params: { q } });
  return data;   // { users, transfers, services, goals, groups }
}

/** DEV ONLY — promote the current user to admin. */
export async function devPromoteMe() {
  const { data } = await api.post('/auth/dev-promote');
  return data;
}
