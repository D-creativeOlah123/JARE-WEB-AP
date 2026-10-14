import mongoose from 'mongoose';

/**
 * Support ticket — a message from a user to the support team.
 * Written immutably (each new message is a new document); status flips
 * open → in_progress → resolved as admins work through them.
 */
const supportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject:  { type: String, required: true, trim: true, maxlength: 120 },
    category: {
      type: String,
      enum: ['account', 'transfer', 'payment', 'card', 'other'],
      default: 'other',
      index: true,
    },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status:  {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open',
      index: true,
    },
    contact: {
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    resolution: { type: String, maxlength: 2000 },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

supportTicketSchema.index({ userId: 1, createdAt: -1 });

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
