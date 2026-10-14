import { Router } from 'express';
import mongoose from 'mongoose';
import { body, param, query } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  create, list, detail, patch, remove,
  contribute, contributions,
} from '../controllers/goalController.js';

const router = Router();
const objectId = () =>
  param('id').custom((v) => mongoose.isValidObjectId(v)).withMessage('Invalid goal id');

// --- Create ---------------------------------------------------------------
router.post(
  '/',
  requireAuth,
  [
    body('name').isString().trim().isLength({ min: 1, max: 80 }),
    body('targetAmountNaira').isFloat({ gt: 0 }),
    body('endDate').isISO8601().withMessage('endDate must be ISO date'),
    body('startDate').optional().isISO8601(),
    body('category').optional().isString().trim().isLength({ max: 40 }),
    body('savingFrequency').optional().isIn(['daily', 'weekly', 'monthly', 'manual']),
    body('autoSaveEnabled').optional().isBoolean(),
    body('autoSaveAmountNaira').optional().isFloat({ min: 0 }),
    body('paymentMethod').optional().isIn(['wallet', 'bank', 'card']),
  ],
  validate,
  create,
);

// --- Read -----------------------------------------------------------------
router.get(
  '/',
  requireAuth,
  [query('status').optional().isIn(['active', 'completed', 'cancelled'])],
  validate,
  list,
);
router.get('/:id', requireAuth, [objectId()], validate, detail);
router.get('/:id/contributions', requireAuth, [objectId()], validate, contributions);

// --- Update / cancel ------------------------------------------------------
router.patch('/:id', requireAuth, [objectId()], validate, patch);
router.delete('/:id', requireAuth, [objectId()], validate, remove);

// --- Contribute (wallet) --------------------------------------------------
router.post(
  '/:id/contribute',
  requireAuth,
  [
    objectId(),
    body('amountNaira').isFloat({ gt: 0 }),
    body('pin').matches(/^\d{4}$/).withMessage('pin must be 4 digits'),
    body('source').optional().isIn(['wallet', 'bank', 'card']),
  ],
  validate,
  contribute,
);

export default router;
