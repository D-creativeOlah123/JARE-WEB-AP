import {
  getSummary,
  listUsers, getUserDetail, updateUser,
  listTransfers, listServiceTx,
  getAnalytics, getModerationQueue,
  listGoals, listGroupsAdmin,
  getPlatformSettings, updatePlatformSettings,
  globalSearch,
} from '../services/adminService.js';

export async function summary(req, res, next) {
  try {
    const data = await getSummary();
    res.json(data);
  } catch (err) { next(err); }
}

export async function search(req, res, next) {
  try {
    const data = await globalSearch({ query: req.query.q, perGroup: 5 });
    res.json(data);
  } catch (err) { next(err); }
}

export async function users(req, res, next) {
  try {
    const { q, role, limit, cursor } = req.query;
    const data = await listUsers({
      query: q,
      role,
      limit: parseInt(limit, 10) || 25,
      cursor,
    });
    res.json(data);
  } catch (err) { next(err); }
}

export async function userDetail(req, res, next) {
  try {
    const data = await getUserDetail(req.params.id);
    res.json(data);
  } catch (err) { next(err); }
}

export async function patchUser(req, res, next) {
  try {
    const user = await updateUser({ id: req.params.id, patch: req.body });
    res.json({ user });
  } catch (err) { next(err); }
}

export async function transfers(req, res, next) {
  try {
    const { type, status, limit, cursor } = req.query;
    const data = await listTransfers({
      type, status,
      limit: parseInt(limit, 10) || 25,
      cursor,
    });
    res.json(data);
  } catch (err) { next(err); }
}

export async function services(req, res, next) {
  try {
    const { type, status, limit, cursor } = req.query;
    const data = await listServiceTx({
      type, status,
      limit: parseInt(limit, 10) || 25,
      cursor,
    });
    res.json(data);
  } catch (err) { next(err); }
}

export async function analytics(req, res, next) {
  try {
    const { period } = req.query;
    const data = await getAnalytics({ period });
    res.json(data);
  } catch (err) { next(err); }
}

export async function moderation(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const data = await getModerationQueue({ limit });
    res.json(data);
  } catch (err) { next(err); }
}

export async function goals(req, res, next) {
  try {
    const { status, limit, cursor } = req.query;
    const data = await listGoals({
      status, limit: parseInt(limit, 10) || 25, cursor,
    });
    res.json(data);
  } catch (err) { next(err); }
}

export async function groups(req, res, next) {
  try {
    const { status, limit, cursor } = req.query;
    const data = await listGroupsAdmin({
      status, limit: parseInt(limit, 10) || 25, cursor,
    });
    res.json(data);
  } catch (err) { next(err); }
}

export async function getSettings(req, res, next) {
  try {
    const settings = await getPlatformSettings();
    res.json({ settings });
  } catch (err) { next(err); }
}

export async function patchSettings(req, res, next) {
  try {
    const settings = await updatePlatformSettings({
      patch: req.body,
      updatedBy: req.user.id,
    });
    res.json({ settings });
  } catch (err) { next(err); }
}
