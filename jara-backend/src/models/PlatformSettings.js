import mongoose from 'mongoose';

/**
 * Singleton settings document. There is one row keyed by `key: 'global'`.
 * Reads via getOrCreate() (returns defaults on first access); writes via
 * upsert so we never need a two-step init.
 */
const platformSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    flags: {
      jaraTransfer:  { type: Boolean, default: true },
      bankTransfer:  { type: Boolean, default: true },
      airtime:       { type: Boolean, default: true },
      data:          { type: Boolean, default: true },
      signups:       { type: Boolean, default: true },
      devPromote:    { type: Boolean, default: false },
    },
    limits: {
      minTransferNaira:   { type: Number, default: 100 },
      maxTransferNaira:   { type: Number, default: 1_000_000 },
      minGoalTargetNaira: { type: Number, default: 500 },
      otpTtlMinutes:      { type: Number, default: 10 },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);
