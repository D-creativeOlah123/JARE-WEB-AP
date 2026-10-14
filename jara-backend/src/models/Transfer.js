import mongoose from 'mongoose';

/**
 * Immutable ledger record. Once written, never mutate — issue a reversal
 * transfer instead if you need to undo. That's how real bank ledgers work.
 */
const transferSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['jara', 'bank'], required: true },

    // Sender
    fromUserId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true, index: true },
    fromAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },

    // Recipient — one of these is populated depending on `type`
    toUserId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    toAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    toBank: {
      bankCode:      { type: String },
      bankName:      { type: String },
      accountNumber: { type: String },
      accountName:   { type: String },
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'Amount must be an integer (kobo)',
      },
    },
    remark: { type: String, maxlength: 200, default: '' },

    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      required: true,
      default: 'pending',
    },

    reference: {
      type: String,
      required: true,
      unique: true,
    },
    failureReason: { type: String },
  },
  { timestamps: true },
);

// Compound index for a user's transfer history sorted by newest
transferSchema.index({ fromUserId: 1, createdAt: -1 });

export const Transfer = mongoose.model('Transfer', transferSchema);
