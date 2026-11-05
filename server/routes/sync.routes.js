import { Router } from 'express';
import * as sync from '../controllers/sync.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);

router.get('/status', sync.status);
router.post('/run', requireRole('ADMIN', 'DIRECTOR'), sync.runNow);

export default router;
