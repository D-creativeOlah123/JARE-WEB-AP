import mongoose from 'mongoose';

/**
 * Immutable ledger entry for money going into a savings goal OR a group.
 * Exactly one of goalId / groupId is set, enforced by a pre-validate hook.
 */
const contributionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavingsGoal',
      default: null,
      index: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
      index: true,
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

    source: {
      type: String,
      enum: ['wallet', 'bank', 'card'],
      required: true,
    },

    reference: { type: String, required: true, unique: true },

    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
  },
  { timestamps: true },
);

contributionSchema.pre('validate', function () {
  const hasGoal = Boolean(this.goalId);
  const hasGroup = Boolean(this.groupId);
  if (hasGoal === hasGroup) {   // both set OR both null
    throw new Error('Contribution must target exactly one of goalId or groupId');
  }
});

contributionSchema.index({ goalId: 1, createdAt: -1 });
contributionSchema.index({ groupId: 1, createdAt: -1 });

export const Contribution = mongoose.model('Contribution', contributionSchema);
