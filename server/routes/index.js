/**
 * Agregateur de routes : monte tous les modules sous /api.
 */
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import studentsRoutes from './students.routes.js';
import billingRoutes from './billing.routes.js';
import syncRoutes from './sync.routes.js';
import bulletinRoutes from './bulletin.routes.js';
import resourcesRoutes, { resourceSlugs } from './resources.routes.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    app: 'WIWITRACK ESCOLA - API',
    version: '1.0.0',
    endpoints: [
      'POST /api/auth/login', 
      'GET  /api/students',
      'POST /api/billing/invoices/composition',
      'POST /api/billing/payments',
      'GET  /api/bulletins/:studentId',
      'GET  /api/sync/status',
      ...resourceSlugs.map((s) => `*** /api/${s}`),
    ],
  });
});

// Modules a logique dediee
router.use('/auth', authRoutes);
router.use('/students', studentsRoutes);
router.use('/billing', billingRoutes);
router.use('/sync', syncRoutes);
router.use('/bulletins', bulletinRoutes);

// Ressources generiques (CRUD auto)
router.use('/', resourcesRoutes);

export default router;
