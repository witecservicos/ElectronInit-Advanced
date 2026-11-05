import { Router } from 'express';
import * as billing from '../controllers/billing.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);

router.get('/invoices', requirePermission('billing:read'), billing.listInvoices);
// Feuilles de composition : 1 feuille par matiere -> N matieres x tarif unitaire
router.post('/invoices/composition', requirePermission('billing:create'), billing.generateCompositionInvoice);
router.post('/payments', requirePermission('billing:create'), billing.recordPayment);

export default router;
