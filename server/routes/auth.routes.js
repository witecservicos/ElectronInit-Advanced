import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/security.js';

const router = Router();

router.post('/login', loginLimiter, auth.login);
router.get('/me', authenticate, auth.me);
router.post('/change-password', authenticate, auth.changePassword);

export default router;
