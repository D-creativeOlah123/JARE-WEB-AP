import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      match: [/^9\d{9}$/, 'Account number must be 10 digits starting with 9'],
    },
    /**
     * Balance is stored as an INTEGER number of kobo. 1 NGN = 100 kobo.
     * Never Number-with-decimals — floats lose money to rounding.
     */
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Balance must be an integer (kobo)',
      },
    },
    currency: {
      type: String,
      default: 'NGN',
      enum: ['NGN'],
    },
  },
  { timestamps: true },
);

export const Account = mongoose.model('Account', accountSchema);
