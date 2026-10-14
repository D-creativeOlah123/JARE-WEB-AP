import mongoose from 'mongoose';

const beneficiarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['jara', 'bank'],
      required: true,
    },
    accountNumber: { type: String, required: true },
    accountName:   { type: String, required: true },

    // Only populated for `type === 'bank'` (added in step 5c).
    bankCode: { type: String },
    bankName: { type: String },

    // Optional user-provided nickname (e.g. "Mum").
    alias: { type: String, maxlength: 50 },
  },
  { timestamps: true },
);

// One saved beneficiary per (user, type, accountNumber).
beneficiarySchema.index(
  { userId: 1, type: 1, accountNumber: 1 },
  { unique: true },
);

export const Beneficiary = mongoose.model('Beneficiary', beneficiarySchema);
