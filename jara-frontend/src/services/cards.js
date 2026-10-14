import { api } from './api';

export async function listCards() {
  const { data } = await api.get('/cards');
  return data.cards;
}

export async function initiateAddCard() {
  const { data } = await api.post('/cards/initiate');
  return data;
}

export async function verifyAddCard(reference) {
  const { data } = await api.get(`/cards/verify/${encodeURIComponent(reference)}`);
  return data.card;
}

export async function deleteCard(id) {
  const { data } = await api.delete(`/cards/${id}`);
  return data;
}

export async function makeCardDefault(id) {
  const { data } = await api.patch(`/cards/${id}/default`);
  return data.card;
}
