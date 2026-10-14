import { api } from './api';

export async function submitTicket(payload) {
  const { data } = await api.post('/support', payload);
  return data.ticket;
}

export async function listMyTickets() {
  const { data } = await api.get('/support/mine');
  return data.tickets;
}

// admin
export async function adminListTickets(params = {}) {
  const { data } = await api.get('/support/admin', { params });
  return data;
}

export async function adminUpdateTicket(id, patch) {
  const { data } = await api.patch(`/support/admin/${id}`, patch);
  return data.ticket;
}
