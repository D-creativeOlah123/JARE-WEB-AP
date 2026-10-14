import { Router } from 'express';
import mongoose from 'mongoose';
import { param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { list, unreadCount, readOne, readAll } from '../controllers/notificationController.js';

const router = Router();

router.get('/', requireAuth, list);
router.get('/unread-count', requireAuth, unreadCount);
router.patch(
  '/:id/read',
  requireAuth,
  [param('id').custom((v) => mongoose.isValidObjectId(v))],
  validate,
  readOne,
);
router.post('/read-all', requireAuth, readAll);

export default router;
