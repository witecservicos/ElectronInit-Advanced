import { Router } from 'express';
import * as students from '../controllers/students.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('students:read'), students.list);
router.get('/:id', requirePermission('students:read'), students.getOne);
router.post('/', requirePermission('students:create'), students.create);
router.put('/:id', requirePermission('students:update'), students.update);
router.delete('/:id', requirePermission('students:delete'), students.remove);

export default router;
