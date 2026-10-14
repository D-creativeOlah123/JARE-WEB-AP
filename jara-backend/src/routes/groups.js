import { Router } from 'express';
import mongoose from 'mongoose';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  create, list, detail, lookup, join, cancel,
  contribute, contributions,
} from '../controllers/groupController.js';

const router = Router();
const objectId = () =>
  param('id').custom((v) => mongoose.isValidObjectId(v)).withMessage('Invalid group id');

// --- Create / list ------------------------------------------------------
router.post(
  '/',
  requireAuth,
  [
    body('name').isString().trim().isLength({ min: 1, max: 80 }),
    body('description').optional().isString().isLength({ max: 300 }),
    body('targetAmountNaira').isFloat({ gt: 0 }),
    body('individualContributionNaira').optional().isFloat({ min: 0 }),
    body('contributionFrequency').optional().isIn(['daily', 'weekly', 'monthly', 'manual']),
    body('groupType').optional().isIn(['pooled', 'rotating']),
    body('targetDate').isISO8601(),
    body('rules').optional().isString().isLength({ max: 500 }),
  ],
  validate,
  create,
);
router.get('/', requireAuth, list);

// --- Preview + join by code --------------------------------------------
router.post(
  '/lookup',
  requireAuth,
  [body('inviteCode').isString().trim().isLength({ min: 7, max: 7 })],
  validate,
  lookup,
);
router.post(
  '/join',
  requireAuth,
  [body('inviteCode').isString().trim().isLength({ min: 7, max: 7 })],
  validate,
  join,
);

// --- One group ---------------------------------------------------------
router.get('/:id', requireAuth, [objectId()], validate, detail);
router.delete('/:id', requireAuth, [objectId()], validate, cancel);

// --- Contribute --------------------------------------------------------
router.post(
  '/:id/contribute',
  requireAuth,
  [
    objectId(),
    body('amountNaira').isFloat({ gt: 0 }),
    body('pin').matches(/^\d{4}$/),
    body('source').optional().isIn(['wallet', 'bank', 'card']),
  ],
  validate,
  contribute,
);
router.get('/:id/contributions', requireAuth, [objectId()], validate, contributions);

export default router;
