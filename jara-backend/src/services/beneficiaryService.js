import { Beneficiary } from '../models/Beneficiary.js';

/**
 * Save a Jara recipient the first time a user sends to them.
 * Idempotent — subsequent transfers to the same recipient are a no-op
 * thanks to the unique compound index.
 */
export async function saveJaraBeneficiary({ userId, accountNumber, accountName }) {
  try {
    await Beneficiary.updateOne(
      { userId, type: 'jara', accountNumber },
      { $setOnInsert: { userId, type: 'jara', accountNumber, accountName } },
      { upsert: true },
    );
  } catch (err) {
    // Never fail a completed transfer because we couldn't save a beneficiary.
    console.error('[beneficiary:save-failed]', err.message);
  }
}

export async function listBeneficiaries(userId) {
  return Beneficiary.find({ userId }).sort({ createdAt: -1 }).lean();
}

/**
 * Delete a beneficiary. Guarded by userId so one user can't delete
 * another's rows.
 */
export async function deleteBeneficiary({ userId, id }) {
  const result = await Beneficiary.deleteOne({ _id: id, userId });
  if (result.deletedCount === 0) {
    const err = new Error('Beneficiary not found');
    err.status = 404;
    throw err;
  }
}
