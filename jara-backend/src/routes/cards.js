import { Router } from 'express';
import mongoose from 'mongoose';
import { param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { list, initiate, verify, remove, makeDefault } from '../controllers/cardController.js';

const router = Router();

router.get('/',           requireAuth, list);
router.post('/initiate',  requireAuth, initiate);

router.get(
  '/verify/:reference',
  requireAuth,
  [param('reference').isString().isLength({ min: 6, max: 100 })],
  validate,
  verify,
);

router.delete(
  '/:id',
  requireAuth,
  [param('id').custom((v) => mongoose.isValidObjectId(v))],
  validate,
  remove,
);

router.patch(
  '/:id/default',
  requireAuth,
  [param('id').custom((v) => mongoose.isValidObjectId(v))],
  validate,
  makeDefault,
);

export default router;
