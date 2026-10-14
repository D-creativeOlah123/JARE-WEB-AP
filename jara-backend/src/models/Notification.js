import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['transfer', 'contribution', 'goal', 'group', 'service', 'system'],
      required: true,
    },
    title: { type: String, required: true, maxlength: 120 },
    body:  { type: String, maxlength: 400, default: '' },

    /**
     * Optional structured payload — e.g. { transferId, amount, ... }.
     * The frontend uses `meta.link` (if present) to deep-link on click.
     */
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },

    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Newest-first per user is the dominant query.
notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
