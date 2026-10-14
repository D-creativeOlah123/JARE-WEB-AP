import mongoose from 'mongoose';

const koboInteger = {
  type: Number,
  required: true,
  min: 0,
  validate: {
    validator: Number.isInteger,
    message: 'Amount must be an integer (kobo)',
  },
};

const savingsGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Optional link to a Group (Ajo / Esusu) — populated in step 6b.
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },

    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, trim: true, maxlength: 40, default: '' },

    targetAmount: { ...koboInteger, min: 1 },
    savedAmount:  { ...koboInteger, default: 0 },

    startDate: { type: Date, required: true, default: () => new Date() },
    endDate:   { type: Date, required: true },

    savingFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'manual'],
      default: 'manual',
    },
    autoSaveEnabled: { type: Boolean, default: false },
    autoSaveAmount:  { type: Number, min: 0, default: 0 },

    paymentMethod: {
      type: String,
      enum: ['wallet', 'bank', 'card'],
      default: 'wallet',
    },

    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true },
);

// Common query: my active goals newest first
savingsGoalSchema.index({ userId: 1, status: 1, createdAt: -1 });

// Cross-check savedAmount ≤ targetAmount at write time as a safety net —
// contributeToGoal also enforces this atomically. Mongoose 9 uses the
// async-style hook (no `next` callback).
savingsGoalSchema.pre('save', async function () {
  if (this.savedAmount > this.targetAmount) {
    throw new Error('savedAmount cannot exceed targetAmount');
  }
});

export const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);
