import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/helpers.js';
import { buildBulletinData } from '../services/bulletin.service.js';
import { httpError } from '../middleware/error.js';

const router = Router();
router.use(authenticate);

// Renvoie les DONNEES du bulletin (sans mise en page).
// La mise en page officielle MINED est realisee manuellement (cf. service).
router.get('/:studentId', requirePermission('grades:read'), asyncHandler(async (req, res) => {
  const { academicYearId, period } = req.query;
  if (!academicYearId) throw httpError(400, 'academicYearId requis.');
  const data = await buildBulletinData(req.params.studentId, academicYearId, period || 'T1');
  if (!data) throw httpError(404, 'Eleve introuvable.');
  res.json(data);
}));

export default router;
