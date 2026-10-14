import {
  createGroup,
  listMyGroups,
  getGroup,
  lookupByCode,
  joinGroup,
  cancelGroup,
  contributeToGroup,
  listGroupContributions,
} from '../services/groupService.js';

export async function create(req, res, next) {
  try {
    const group = await createGroup({ creatorId: req.user.id, ...req.body });
    res.status(201).json({ group });
  } catch (err) { next(err); }
}

export async function list(req, res, next) {
  try {
    const groups = await listMyGroups(req.user.id);
    res.json({ groups });
  } catch (err) { next(err); }
}

export async function detail(req, res, next) {
  try {
    const data = await getGroup({ userId: req.user.id, groupId: req.params.id });
    res.json(data);
  } catch (err) { next(err); }
}

export async function lookup(req, res, next) {
  try {
    const { inviteCode } = req.body;
    const preview = await lookupByCode(inviteCode);
    res.json({ group: preview });
  } catch (err) { next(err); }
}

export async function join(req, res, next) {
  try {
    const { inviteCode } = req.body;
    const group = await joinGroup({ userId: req.user.id, inviteCode });
    res.status(201).json({ group });
  } catch (err) { next(err); }
}

export async function cancel(req, res, next) {
  try {
    const group = await cancelGroup({ userId: req.user.id, groupId: req.params.id });
    res.json({ group });
  } catch (err) { next(err); }
}

export async function contribute(req, res, next) {
  try {
    const { amountNaira, pin, source } = req.body;
    if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
      const err = new Error('amountNaira must be a positive number');
      err.status = 400;
      throw err;
    }
    const result = await contributeToGroup({
      userId: req.user.id,
      groupId: req.params.id,
      amountKobo: Math.round(amountNaira * 100),
      pin,
      source,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function contributions(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const items = await listGroupContributions({
      userId: req.user.id,
      groupId: req.params.id,
      limit,
    });
    res.json({ contributions: items });
  } catch (err) { next(err); }
}
