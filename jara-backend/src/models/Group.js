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

const memberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: () => new Date() },
    /** How much this individual has contributed (kobo). */
    contributedAmount: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const groupSchema = new mongoose.Schema(
  {
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, maxlength: 300, default: '' },

    /** Unique 7-character invite code (uppercase alphanumeric). */
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      match: [/^[A-Z0-9]{7}$/, 'Invite code must be 7 uppercase alphanumeric chars'],
    },

    targetAmount:            { ...koboInteger, min: 1 },
    savedAmount:             { ...koboInteger, default: 0 },
    individualContribution:  { ...koboInteger, default: 0 },

    contributionFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'manual'],
      default: 'monthly',
    },
    groupType: {
      type: String,
      enum: ['pooled', 'rotating'],   // rotating (real Ajo turn-based) comes later
      default: 'pooled',
    },
    targetDate: { type: Date, required: true },
    rules:      { type: String, maxlength: 500, default: '' },

    members: {
      type: [memberSchema],
      default: [],
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

// Common query: "groups I'm in, newest first"
groupSchema.index({ 'members.userId': 1, createdAt: -1 });

// Safety net — savedAmount <= targetAmount.
groupSchema.pre('save', async function () {
  if (this.savedAmount > this.targetAmount) {
    throw new Error('savedAmount cannot exceed targetAmount');
  }
});

export const Group = mongoose.model('Group', groupSchema);
