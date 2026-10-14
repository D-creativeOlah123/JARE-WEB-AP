import mongoose from 'mongoose';

/**
 * Generic ledger for bill payments — airtime, data, TV, electricity, etc.
 * `type` narrows which fields are populated; `product` carries the
 * plan-specific identifier when applicable (data plan id, cable package, …).
 */
const serviceTxSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['airtime', 'data', 'electricity', 'cable', 'education'],
      required: true,
    },
    /** Provider slug — network id for airtime/data, disco/cable/edu id otherwise. */
    provider: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 40,
    },
    /** For data: plan id (e.g. "mtn-500mb-30d"). For airtime: null. */
    product: { type: String, default: null },

    /** Beneficiary of the top-up — phone/meter number. */
    recipient: { type: String, required: true, trim: true, maxlength: 40 },

    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'Amount must be an integer (kobo)',
      },
    },

    reference: { type: String, required: true, unique: true },
    /** Provider's own reference — populated when we get one back. */
    providerReference: { type: String, default: null },

    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    failureReason: { type: String },
  },
  { timestamps: true },
);

serviceTxSchema.index({ userId: 1, createdAt: -1 });

export const ServiceTransaction = mongoose.model('ServiceTransaction', serviceTxSchema);
