import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { myAccount, devSeed } from '../controllers/accountController.js';

const router = Router();

router.get('/me', requireAuth, myAccount);

// DEV-ONLY seed endpoint — the controller also gates on env.isProd.
router.post(
  '/dev-seed',
  requireAuth,
  [body('amountNaira').isFloat({ gt: 0 }).withMessage('amountNaira must be a positive number')],
  validate,
  devSeed,
);

export default router;
