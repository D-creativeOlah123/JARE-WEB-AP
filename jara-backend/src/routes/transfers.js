import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { quote, execute, list, verifyBank, executeBank } from '../controllers/transferController.js';

const router = Router();

router.post(
  '/quote',
  requireAuth,
  [
    body('toAccountNumber').matches(/^\d{10}$/).withMessage('Account number must be 10 digits'),
  ],
  validate,
  quote,
);

router.post(
  '/',
  requireAuth,
  [
    body('toAccountNumber').matches(/^\d{10}$/).withMessage('Account number must be 10 digits'),
    body('amountNaira').isFloat({ gt: 0 }).withMessage('amountNaira must be a positive number'),
    body('pin').matches(/^\d{4}$/).withMessage('pin must be 4 digits'),
    body('remark').optional().isString().isLength({ max: 200 }),
  ],
  validate,
  execute,
);

router.get('/', requireAuth, list);

// --- Bank transfer routes ---
router.post(
  '/bank/verify',
  requireAuth,
  [
    body('bankCode').isString().trim().notEmpty(),
    body('accountNumber').matches(/^\d{10}$/),
  ],
  validate,
  verifyBank,
);

router.post(
  '/bank',
  requireAuth,
  [
    body('bankCode').isString().trim().notEmpty(),
    body('accountNumber').matches(/^\d{10}$/),
    body('accountName').isString().trim().notEmpty(),
    body('amountNaira').isFloat({ gt: 0 }),
    body('pin').matches(/^\d{4}$/),
    body('remark').optional().isString().isLength({ max: 200 }),
  ],
  validate,
  executeBank,
);

export default router;
