import {
  createGoal,
  listGoals,
  getGoal,
  updateGoal,
  cancelGoal,
  contributeToGoal,
  listGoalContributions,
} from '../services/goalService.js';

/** POST /api/goals */
export async function create(req, res, next) {
  try {
    const goal = await createGoal({ userId: req.user.id, ...req.body });
    res.status(201).json({ goal });
  } catch (err) { next(err); }
}

/** GET /api/goals?status=active|completed|cancelled */
export async function list(req, res, next) {
  try {
    const goals = await listGoals(req.user.id, { status: req.query.status });
    res.json({ goals });
  } catch (err) { next(err); }
}

/** GET /api/goals/:id */
export async function detail(req, res, next) {
  try {
    const data = await getGoal({ userId: req.user.id, goalId: req.params.id });
    res.json(data);
  } catch (err) { next(err); }
}

/** PATCH /api/goals/:id */
export async function patch(req, res, next) {
  try {
    const goal = await updateGoal({
      userId: req.user.id,
      goalId: req.params.id,
      patch: req.body,
    });
    res.json({ goal });
  } catch (err) { next(err); }
}

/** DELETE /api/goals/:id — sets status to 'cancelled' (soft delete) */
export async function remove(req, res, next) {
  try {
    const goal = await cancelGoal({ userId: req.user.id, goalId: req.params.id });
    res.json({ goal });
  } catch (err) { next(err); }
}

/** POST /api/goals/:id/contribute — { amountNaira, pin, source? } */
export async function contribute(req, res, next) {
  try {
    const { amountNaira, pin, source } = req.body;
    if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
      const err = new Error('amountNaira must be a positive number');
      err.status = 400;
      throw err;
    }
    const result = await contributeToGoal({
      userId: req.user.id,
      goalId: req.params.id,
      amountKobo: Math.round(amountNaira * 100),
      pin,
      source,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

/** GET /api/goals/:id/contributions */
export async function contributions(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const items = await listGoalContributions({
      userId: req.user.id,
      goalId: req.params.id,
      limit,
    });
    res.json({ contributions: items });
  } catch (err) { next(err); }
}
