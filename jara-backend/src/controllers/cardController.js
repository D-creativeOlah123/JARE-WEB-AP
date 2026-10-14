import {
  initiateAddCard,
  verifyAddCard,
  listCards,
  removeCard,
  setDefault,
} from '../services/cardService.js';

export async function list(req, res, next) {
  try {
    const cards = await listCards(req.user.id);
    res.json({ cards });
  } catch (err) { next(err); }
}

export async function initiate(req, res, next) {
  try {
    const result = await initiateAddCard({ userId: req.user.id });
    res.json(result);
  } catch (err) { next(err); }
}

export async function verify(req, res, next) {
  try {
    const card = await verifyAddCard({ userId: req.user.id, reference: req.params.reference });
    res.json({ card });
  } catch (err) { next(err); }
}

export async function remove(req, res, next) {
  try {
    await removeCard({ userId: req.user.id, cardId: req.params.id });
    res.json({ removed: true });
  } catch (err) { next(err); }
}

export async function makeDefault(req, res, next) {
  try {
    const card = await setDefault({ userId: req.user.id, cardId: req.params.id });
    res.json({ card });
  } catch (err) { next(err); }
}
