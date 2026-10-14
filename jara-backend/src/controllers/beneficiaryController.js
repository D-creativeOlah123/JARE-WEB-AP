import { listBeneficiaries, deleteBeneficiary } from '../services/beneficiaryService.js';

export async function list(req, res, next) {
  try {
    const beneficiaries = await listBeneficiaries(req.user.id);
    res.json({ beneficiaries });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await deleteBeneficiary({ userId: req.user.id, id: req.params.id });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
}
