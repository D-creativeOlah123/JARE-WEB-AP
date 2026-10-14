import { Router } from 'express';
import { body, query } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  networks, dataPlans, airtime, data, history,
  bills, verifyMeter, verifySmartcard,
  electricity, cable, education,
} from '../controllers/serviceController.js';

const router = Router();

// --- Catalogue ---------------------------------------------------------
router.get('/networks', requireAuth, networks);
router.get(
  '/data-plans',
  requireAuth,
  [query('network').optional().isString().trim()],
  validate,
  dataPlans,
);

// --- Purchases ---------------------------------------------------------
router.post(
  '/airtime',
  requireAuth,
  [
    body('network').isIn(['mtn', 'airtel', 'glo', '9mobile']),
    body('phone').isString().trim().notEmpty(),
    body('amountNaira').isFloat({ gt: 0 }),
    body('pin').matches(/^\d{4}$/),
  ],
  validate,
  airtime,
);

router.post(
  '/data',
  requireAuth,
  [
    body('network').isIn(['mtn', 'airtel', 'glo', '9mobile']),
    body('phone').isString().trim().notEmpty(),
    body('planId').isString().trim().notEmpty(),
    body('pin').matches(/^\d{4}$/),
  ],
  validate,
  data,
);

// --- Bill catalogue ----------------------------------------------------
router.get('/bills', requireAuth, bills);

// --- Verifications -----------------------------------------------------
router.post(
  '/verify-meter',
  requireAuth,
  [
    body('discoId').isString().trim().notEmpty(),
    body('meterNumber').matches(/^\d{6,20}$/),
    body('meterType').isIn(['prepaid', 'postpaid']),
  ],
  validate,
  verifyMeter,
);

router.post(
  '/verify-smartcard',
  requireAuth,
  [
    body('providerId').isIn(['dstv', 'gotv', 'startimes', 'showmax']),
    body('smartcard').matches(/^\d{8,14}$/),
  ],
  validate,
  verifySmartcard,
);

// --- Bill purchases ----------------------------------------------------
router.post(
  '/electricity',
  requireAuth,
  [
    body('discoId').isString().trim().notEmpty(),
    body('meterNumber').matches(/^\d{6,20}$/),
    body('meterType').isIn(['prepaid', 'postpaid']),
    body('amountNaira').isFloat({ gt: 0 }),
    body('phone').optional().isString().trim(),
    body('pin').matches(/^\d{4}$/),
  ],
  validate,
  electricity,
);

router.post(
  '/cable',
  requireAuth,
  [
    body('providerId').isIn(['dstv', 'gotv', 'startimes', 'showmax']),
    body('packageId').isString().trim().notEmpty(),
    body('smartcard').matches(/^\d{8,14}$/),
    body('phone').optional().isString().trim(),
    body('pin').matches(/^\d{4}$/),
  ],
  validate,
  cable,
);

router.post(
  '/education',
  requireAuth,
  [
    body('providerId').isString().trim().notEmpty(),
    body('productId').isString().trim().notEmpty(),
    body('phone').optional().isString().trim(),
    body('pin').matches(/^\d{4}$/),
  ],
  validate,
  education,
);

router.get('/history', requireAuth, history);

export default router;
