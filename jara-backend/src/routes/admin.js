import { Router } from 'express';
import mongoose from 'mongoose';
import { body, param, query } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  summary, users, userDetail, patchUser,
  transfers, services, analytics, moderation,
  goals, groups,
  getSettings, patchSettings,
  search,
} from '../controllers/adminController.js';

const router = Router();

// Every route requires an authenticated ADMIN user.
router.use(requireAuth, requireRole('admin'));

router.get('/summary', summary);

router.get(
  '/search',
  [query('q').isString().trim().isLength({ min: 2, max: 100 })],
  validate,
  search,
);

router.get('/analytics',
  [query('period').optional().isIn(['week', 'month', 'year'])],
  validate,
  analytics,
);

router.get('/moderation',
  [query('limit').optional().isInt({ min: 1, max: 200 })],
  validate,
  moderation,
);

router.get('/users',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['customer', 'admin']),
  ],
  validate,
  users,
);
router.get('/users/:id',
  [param('id').custom((v) => mongoose.isValidObjectId(v))],
  validate,
  userDetail,
);
router.patch('/users/:id',
  [
    param('id').custom((v) => mongoose.isValidObjectId(v)),
    body('role').optional().isIn(['customer', 'admin']),
    body('emailVerified').optional().isBoolean(),
    body('phoneVerified').optional().isBoolean(),
    body('suspended').optional().isBoolean(),
  ],
  validate,
  patchUser,
);

router.get('/transfers',
  [
    query('type').optional().isIn(['jara', 'bank']),
    query('status').optional().isIn(['pending', 'completed', 'failed']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  transfers,
);

router.get('/services',
  [
    query('type').optional().isIn(['airtime', 'data', 'electricity', 'cable', 'education']),
    query('status').optional().isIn(['pending', 'completed', 'failed']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  services,
);

router.get('/goals',
  [
    query('status').optional().isIn(['active', 'completed', 'cancelled']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  goals,
);

router.get('/groups',
  [
    query('status').optional().isIn(['active', 'completed', 'cancelled']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  groups,
);

router.get('/settings', getSettings);
router.patch('/settings', patchSettings);

export default router;
