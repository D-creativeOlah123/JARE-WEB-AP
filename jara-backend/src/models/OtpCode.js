import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    contact: { type: String, required: true, index: true },
    channel: { type: String, enum: ['sms', 'email'], required: true },
    purpose: {
      type: String,
      enum: ['signup', 'reset', 'transfer'],
      required: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

// Speed up "live OTP for this contact + purpose" lookups.
otpSchema.index({ contact: 1, purpose: 1, consumedAt: 1 });

// Auto-delete expired docs (Mongo runs this cleanup roughly every minute).
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpCode = mongoose.model('OtpCode', otpSchema);
