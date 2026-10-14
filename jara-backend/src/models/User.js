import mongoose from 'mongoose';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+234\d{10}$/;   // Nigerian +234 followed by 10 digits
const bvnRegex = /^\d{11}$/;          // exactly 11 numeric digits

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, 'Invalid email address'],
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [phoneRegex, 'Phone must be +234 followed by 10 digits'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,   // hidden by default; must .select('+passwordHash') to fetch
    },
    // TODO(2c): encrypt at rest with AES-256-GCM. Stored plain for MVP.
    bvn: {
      type: String,
      match: [bvnRegex, 'BVN must be exactly 11 digits'],
      unique: true,
      sparse: true,    // allows nulls without violating unique
      select: false,   // never returned in default queries
    },
    transferPinHash: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    suspended:     { type: Boolean, default: false, index: true },

    /** Data-URI avatar (client-resized ≤ 200×200 JPEG). Empty string = none. */
    avatar: { type: String, default: '', maxlength: 700_000 },

    /** Free-form profile fields — nullable, filled from EditProfile. */
    dob:     { type: Date, default: null },
    address: { type: String, default: '', maxlength: 200, trim: true },
  },
  {
    timestamps: true,   // adds createdAt + updatedAt
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.hasTransferPin = Boolean(ret.transferPinHash);
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.transferPinHash;
        delete ret.bvn;
        return ret;
      },
    },
  },
);

export const User = mongoose.model('User', userSchema);
