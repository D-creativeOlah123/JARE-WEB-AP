import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { NIGERIAN_BANKS } from '../data/nigerianBanks.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  res.json({ banks: NIGERIAN_BANKS });
});

export default router;
