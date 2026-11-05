/**
 * =====================================================================
 *  ROUTES GENERIQUES (ressources "simples")
 *  Monte automatiquement un CRUD complet pour les tables sans logique
 *  metier particuliere (referentiels, abonnements, journaux...).
 *  Chaque ressource est protegee par :
 *    - GET      -> permission `<slug>:read`
 *    - POST/PUT/DELETE -> permission `<slug>:write`
 *  (l'ADMIN possede '*' et passe partout).
 * =====================================================================
 */
import { Router } from 'express';
import db from '../database/models.js';
import { crudController } from '../controllers/crud.factory.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

// slug d'URL  ->  { model, searchFields }
const RESOURCES = {
  'academic-years': { model: 'AcademicYear', search: ['label'] },
  rooms: { model: 'Room', search: ['name', 'code'] },
  cursos: { model: 'Curso', search: ['name', 'code'] },
  subjects: { model: 'Subject', search: ['name', 'code'] },
  users: { model: 'User', search: ['fullName', 'email', 'phonePrimary'] },
  roles: { model: 'Role', search: ['code', 'name'] },
  permissions: { model: 'Permission', search: ['code'] },
  'staff-members': { model: 'StaffMember', search: ['fullName', 'position'] },
  'class-sections': { model: 'ClassSection', search: ['name'] },
  'teacher-assignments': { model: 'TeacherAssignment', search: [] },
  'timetable-slots': { model: 'TimetableSlot', search: [] },
  guardians: { model: 'Guardian', search: ['fullName', 'phonePrimary'] },
  enrollments: { model: 'Enrollment', search: [] },
  attendances: { model: 'Attendance', search: [] },
  'absence-justifications': { model: 'AbsenceJustification', search: [] },
  'student-observations': { model: 'StudentObservation', search: [] },
  'student-exits': { model: 'StudentExit', search: [] },
  'creche-daily-reports': { model: 'CrecheDailyReport', search: [] },
  events: { model: 'Event', search: ['title'] },
  'curriculum-chapters': { model: 'CurriculumChapter', search: ['title'] },
  'bus-routes': { model: 'BusRoute', search: ['name', 'plate'] },
  'transport-subscriptions': { model: 'StudentTransportSubscription', search: [] },
  'bus-checkins': { model: 'BusCheckin', search: [] },
  'canteen-subscriptions': { model: 'StudentCanteenSubscription', search: [] },
  'canteen-access-logs': { model: 'CanteenAccessLog', search: [] },
  'fee-structures': { model: 'FeeStructure', search: ['label'] },
  transactions: { model: 'Transaction', search: ['description'] },
  'salary-payments': { model: 'SalaryPayment', search: [] },
  'staff-tasks': { model: 'StaffTask', search: [] },
  conversations: { model: 'Conversation', search: [] },
  messages: { model: 'Message', search: [] },
  notifications: { model: 'Notification', search: [] },
  'audit-logs': { model: 'AuditLog', search: [] },
};

const router = Router();
router.use(authenticate);

for (const [slug, cfg] of Object.entries(RESOURCES)) {
  const Model = db[cfg.model];
  if (!Model) continue;
  const ctrl = crudController(Model, { searchFields: cfg.search });
  const r = Router();
  r.get('/', requirePermission(`${slug}:read`), ctrl.list);
  r.get('/:id', requirePermission(`${slug}:read`), ctrl.getOne);
  r.post('/', requirePermission(`${slug}:write`), ctrl.create);
  r.put('/:id', requirePermission(`${slug}:write`), ctrl.update);
  r.delete('/:id', requirePermission(`${slug}:write`), ctrl.remove);
  router.use(`/${slug}`, r);
}

export const resourceSlugs = Object.keys(RESOURCES);
export default router;
