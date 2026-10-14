import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import {
  loginLimiter,
  otpLimiter,
  resetLimiter,
  signupLimiter,
} from '../middleware/rateLimit.js';
import {
  register,
  login,
  refresh,
  logout,
  me,
  setTransferPin,
  changePassword,
  changeTransferPin,
  updateProfile,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  devPromote,
} from '../controllers/authController.js';

const router = Router();

// --- POST /api/auth/register ----------------------------------------------
router.post(
  '/register',
  signupLimiter,
  [
    body('fullName').isString().trim().isLength({ min: 2, max: 80 })
      .withMessage('Full name is required (2–80 chars)'),
    body('email').isEmail().withMessage('Valid email required')
      .normalizeEmail(),
    body('phone').matches(/^\+234\d{10}$/)
      .withMessage('Phone must be +234 followed by 10 digits'),
    body('bvn').optional().matches(/^\d{11}$/)
      .withMessage('BVN must be exactly 11 digits'),
    body('password').isString().isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[A-Za-z]/).withMessage('Password must include a letter')
      .matches(/\d/).withMessage('Password must include a number'),
  ],
  validate,
  register,
);

// --- POST /api/auth/login -------------------------------------------------
router.post(
  '/login',
  loginLimiter,
  [
    body('identifier').isString().trim().notEmpty()
      .withMessage('Email or phone required'),
    body('password').isString().notEmpty()
      .withMessage('Password required'),
  ],
  validate,
  login,
);

// --- POST /api/auth/refresh -----------------------------------------------
router.post('/refresh', refresh);

// --- POST /api/auth/logout ------------------------------------------------
router.post('/logout', logout);

// --- GET /api/auth/me -----------------------------------------------------
router.get('/me', requireAuth, me);

// --- POST /api/auth/dev-promote -- DEV ONLY (gated in controller) ---------
router.post('/dev-promote', requireAuth, devPromote);

// --- POST /api/auth/transfer-pin ------------------------------------------
router.post(
  '/transfer-pin',
  requireAuth,
  [ body('pin').matches(/^\d{4}$/).withMessage('PIN must be exactly 4 digits') ],
  validate,
  setTransferPin,
);

// --- PATCH /api/auth/profile ----------------------------------------------
router.patch(
  '/profile',
  requireAuth,
  [
    body('fullName').optional().isString().trim().isLength({ min: 2, max: 80 }),
    body('phone').optional().isString().trim().matches(/^\+234\d{10}$/)
      .withMessage('Phone must be +234 followed by 10 digits'),
    body('dob').optional({ nullable: true }).isString(),
    body('address').optional().isString().isLength({ max: 200 }),
    body('avatar').optional().isString().isLength({ max: 700_000 }),
  ],
  validate,
  updateProfile,
);

// --- POST /api/auth/change-password ---------------------------------------
router.post(
  '/change-password',
  requireAuth,
  [
    body('currentPassword').isString().notEmpty(),
    body('newPassword').isString().isLength({ min: 8 })
      .matches(/[A-Za-z]/).withMessage('Password must include a letter')
      .matches(/\d/).withMessage('Password must include a number'),
  ],
  validate,
  changePassword,
);

// --- POST /api/auth/change-pin --------------------------------------------
router.post(
  '/change-pin',
  requireAuth,
  [
    body('currentPin').optional().matches(/^\d{4}$/),
    body('newPin').matches(/^\d{4}$/).withMessage('New PIN must be exactly 4 digits'),
  ],
  validate,
  changeTransferPin,
);

// --- POST /api/auth/send-otp ----------------------------------------------
router.post(
  '/send-otp',
  otpLimiter,
  [
    body('channel').isIn(['sms', 'email']).withMessage('channel: sms|email'),
    body('purpose').isIn(['signup', 'reset']).withMessage('purpose: signup|reset'),
    body('identifier').optional().isString().trim(),
  ],
  validate,
  sendOtp,
);

// --- POST /api/auth/verify-otp --------------------------------------------
router.post(
  '/verify-otp',
  [
    body('channel').isIn(['sms', 'email']).withMessage('channel: sms|email'),
    body('purpose').isIn(['signup', 'reset']).withMessage('purpose: signup|reset'),
    body('identifier').isString().trim().notEmpty(),
    body('code').isString().isLength({ min: 5, max: 5 })
      .withMessage('code must be 5 digits')
      .matches(/^\d{5}$/).withMessage('code must be numeric'),
  ],
  validate,
  verifyOtp,
);

// --- POST /api/auth/forgot-password ---------------------------------------
router.post(
  '/forgot-password',
  resetLimiter,
  [
    body('identifier').isString().trim().notEmpty(),
    body('channel').isIn(['sms', 'email']).withMessage('channel: sms|email'),
  ],
  validate,
  forgotPassword,
);

// --- POST /api/auth/reset-password ----------------------------------------
router.post(
  '/reset-password',
  resetLimiter,
  [
    body('identifier').isString().trim().notEmpty(),
    body('channel').isIn(['sms', 'email']),
    body('code').matches(/^\d{5}$/).withMessage('code must be 5 digits'),
    body('newPassword').isString().isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[A-Za-z]/).withMessage('Password must include a letter')
      .matches(/\d/).withMessage('Password must include a number'),
  ],
  validate,
  resetPassword,
);

export default router;
