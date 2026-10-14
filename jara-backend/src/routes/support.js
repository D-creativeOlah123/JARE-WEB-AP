import { Router } from 'express';
import { body, param, query } from 'express-validator';
import mongoose from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  create,
  listMine,
  adminList,
  adminUpdate,
} from '../controllers/supportController.js';

const router = Router();

// User-facing
router.get('/mine', requireAuth, listMine);

router.post(
  '/',
  requireAuth,
  [
    body('subject').isString().trim().isLength({ min: 3, max: 120 })
      .withMessage('Subject is required (3–120 chars)'),
    body('category').optional().isIn(['account', 'transfer', 'payment', 'card', 'other']),
    body('message').isString().trim().isLength({ min: 10, max: 2000 })
      .withMessage('Message must be 10–2000 characters'),
    body('contact.email').optional().isEmail().normalizeEmail(),
    body('contact.phone').optional().isString().trim(),
  ],
  validate,
  create,
);

// Admin-only
router.get(
  '/admin',
  requireAuth,
  requireRole('admin'),
  [
    query('status').optional().isIn(['open', 'in_progress', 'resolved']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  adminList,
);

router.patch(
  '/admin/:id',
  requireAuth,
  requireRole('admin'),
  [
    param('id').custom((v) => mongoose.isValidObjectId(v)),
    body('status').optional().isIn(['open', 'in_progress', 'resolved']),
    body('resolution').optional().isString().isLength({ max: 2000 }),
  ],
  validate,
  adminUpdate,
);

export default router;
