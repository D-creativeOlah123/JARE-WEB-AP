import mongoose from 'mongoose';

/**
 * A tokenised payment card. We never store the PAN — only Paystack's
 * authorization_code (or a stub token in dev), plus the display fields
 * Paystack returns so we can render a card row without another call.
 */
const cardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Paystack authorization_code — usable for future charges. Stub mode
    // stores a `STUB_AUTH_...` sentinel.
    authCode: { type: String, required: true },

    // Display fields (safe to keep client-side).
    brand:      { type: String, required: true },   // 'Visa', 'Mastercard', 'Verve'
    last4:      { type: String, required: true, match: /^\d{4}$/ },
    expMonth:   { type: String, required: true, match: /^\d{2}$/ },
    expYear:    { type: String, required: true, match: /^\d{2,4}$/ },
    bank:       { type: String },
    channel:    { type: String, default: 'card' },
    reusable:   { type: Boolean, default: true },
    countryCode:{ type: String, default: 'NG' },

    isDefault: { type: Boolean, default: false },
    mode:      { type: String, enum: ['live', 'stub'], default: 'stub' },
  },
  { timestamps: true },
);

// One row per (user, authCode) — prevents double-adding the same card.
cardSchema.index({ userId: 1, authCode: 1 }, { unique: true });

export const Card = mongoose.model('Card', cardSchema);
