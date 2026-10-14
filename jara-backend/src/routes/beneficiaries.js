import { Router } from 'express';
import mongoose from 'mongoose';
import { param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { list, remove } from '../controllers/beneficiaryController.js';

const router = Router();

router.get('/', requireAuth, list);

router.delete(
  '/:id',
  requireAuth,
  [
    param('id')
      .custom((v) => mongoose.isValidObjectId(v))
      .withMessage('Invalid id'),
  ],
  validate,
  remove,
);

export default router;
