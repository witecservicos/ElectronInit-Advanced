/**
 * =====================================================================
 *  WIWITRACK ESCOLA & CRECHE  -  MODELES SEQUELIZE (consolides)
 *  Toutes les entites + associations dans un seul fichier pour demarrer.
 *  En production, eclater chaque modele dans /models/<Nom>.js puis
 *  recomposer les associations dans /models/index.js.
 *
 *  Usage : import db from './models.js'; await db.sequelize.sync();
 * =====================================================================
 */

import { DataTypes, Sequelize } from 'sequelize';
import { sequelize } from '../config/database.js';


// Raccourci : cle primaire UUID commune a toutes les tables
const PK = { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true };

// =====================================================================
//  MODULE 0-1 : REFERENTIEL & INFRASTRUCTURE
// =====================================================================
const AcademicYear = sequelize.define('AcademicYear', {
  id: PK,
  label: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'end_date' },
  isCurrent: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_current' },
  status: { type: DataTypes.ENUM('OPEN', 'CLOSED', 'ARCHIVED'), defaultValue: 'OPEN' },
}, { tableName: 'academic_years', updatedAt: false });

const Room = sequelize.define('Room', {
  id: PK,
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  code: { type: DataTypes.STRING(30) },
  capacity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  location: { type: DataTypes.STRING(150) },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
}, { tableName: 'rooms', updatedAt: false });

const Curso = sequelize.define('Curso', {
  id: PK,
  name: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  code: { type: DataTypes.STRING(30) },
  cycle: { type: DataTypes.ENUM('CRECHE', 'PRESCOLAIRE', 'PRIMARIO', 'I_CICLO', 'II_CICLO', 'LICEU'), allowNull: false },
  description: { type: DataTypes.TEXT },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
}, { tableName: 'cursos', updatedAt: false });

const Subject = sequelize.define('Subject', {
  id: PK,
  cursoId: { type: DataTypes.UUID, allowNull: false, field: 'curso_id' },
  name: { type: DataTypes.STRING(150), allowNull: false },
  code: { type: DataTypes.STRING(30) },
  coefficient: { type: DataTypes.DECIMAL(4, 2), defaultValue: 1.0 },
  weeklyHours: { type: DataTypes.INTEGER.UNSIGNED, field: 'weekly_hours' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
}, { tableName: 'subjects', updatedAt: false });

// =====================================================================
//  MODULE 2 : UTILISATEURS, ROLES & PERMISSIONS (RBAC)
// =====================================================================
const User = sequelize.define('User', {
  id: PK,
  fullName: { type: DataTypes.STRING(150), allowNull: false, field: 'full_name' },
  gender: { type: DataTypes.ENUM('M', 'F') },
  birthDate: { type: DataTypes.DATEONLY, field: 'birth_date' },
  email: { type: DataTypes.STRING(150), unique: true },
  phonePrimary: { type: DataTypes.STRING(30), unique: true, field: 'phone_primary' },
  phones: { type: DataTypes.JSON }, // Numeros multiples : ["+244..."]
  passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
  role: { type: DataTypes.ENUM('ADMIN', 'DIRECTOR', 'SECRETARY', 'TEACHER', 'PARENT', 'STAFF'), allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  lastLoginAt: { type: DataTypes.DATE, field: 'last_login_at' },
}, { tableName: 'users' });

const Role = sequelize.define('Role', {
  id: PK,
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.STRING(255) },
}, { tableName: 'roles', timestamps: false });

const Permission = sequelize.define('Permission', {
  id: PK,
  code: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  description: { type: DataTypes.STRING(255) },
}, { tableName: 'permissions', timestamps: false });

const SecretariatProfile = sequelize.define('SecretariatProfile', {
  userId: { type: DataTypes.UUID, primaryKey: true, field: 'user_id' },
  employeeCode: { type: DataTypes.STRING(40), field: 'employee_code' },
  department: { type: DataTypes.ENUM('GENERAL', 'ADMISSIONS', 'FINANCE', 'ACADEMIC', 'STUDENT_LIFE'), defaultValue: 'GENERAL' },
  hireDate: { type: DataTypes.DATEONLY, field: 'hire_date' },
  baseSalary: { type: DataTypes.DECIMAL(12, 2), field: 'base_salary' },
}, { tableName: 'secretariat_profiles', timestamps: false });

const StaffMember = sequelize.define('StaffMember', {
  id: PK,
  fullName: { type: DataTypes.STRING(150), allowNull: false, field: 'full_name' },
  gender: { type: DataTypes.ENUM('M', 'F') },
  birthDate: { type: DataTypes.DATEONLY, field: 'birth_date' },
  phones: { type: DataTypes.JSON },
  position: { type: DataTypes.STRING(100), allowNull: false },
  hireDate: { type: DataTypes.DATEONLY, field: 'hire_date' },
  baseSalary: { type: DataTypes.DECIMAL(12, 2), field: 'base_salary' },
  status: { type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'TERMINATED'), defaultValue: 'ACTIVE' },
}, { tableName: 'staff_members', updatedAt: false });

// =====================================================================
//  MODULE 3 : SECTIONS / CLASSES + PROFILS PROFESSEURS
// =====================================================================
const ClassSection = sequelize.define('ClassSection', {
  id: PK,
  cursoId: { type: DataTypes.UUID, allowNull: false, field: 'curso_id' },
  roomId: { type: DataTypes.UUID, field: 'room_id' },
  academicYearId: { type: DataTypes.UUID, allowNull: false, field: 'academic_year_id' },
  name: { type: DataTypes.STRING(100), allowNull: false }, // "Comptabilite A - Matin"
  shift: { type: DataTypes.ENUM('MORNING', 'AFTERNOON', 'EVENING'), allowNull: false },
  maxCapacity: { type: DataTypes.INTEGER.UNSIGNED, field: 'max_capacity' },
  mainTeacherId: { type: DataTypes.UUID, field: 'main_teacher_id' },
}, { tableName: 'class_sections', updatedAt: false });

const TeacherProfile = sequelize.define('TeacherProfile', {
  userId: { type: DataTypes.UUID, primaryKey: true, field: 'user_id' },
  employeeCode: { type: DataTypes.STRING(40), field: 'employee_code' },
  hireDate: { type: DataTypes.DATEONLY, field: 'hire_date' },
  isMainTeacher: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_main_teacher' },
  mainClassSectionId: { type: DataTypes.UUID, field: 'main_class_section_id' },
  contractType: { type: DataTypes.ENUM('PERMANENT', 'CONTRACT', 'HOURLY'), field: 'contract_type' },
  baseSalary: { type: DataTypes.DECIMAL(12, 2), field: 'base_salary' },
  status: { type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'TERMINATED'), defaultValue: 'ACTIVE' },
}, { tableName: 'teacher_profiles', timestamps: false });

const TeacherAssignment = sequelize.define('TeacherAssignment', {
  id: PK,
  teacherId: { type: DataTypes.UUID, allowNull: false, field: 'teacher_id' },
  classSectionId: { type: DataTypes.UUID, allowNull: false, field: 'class_section_id' },
  subjectId: { type: DataTypes.UUID, allowNull: false, field: 'subject_id' },
  academicYearId: { type: DataTypes.UUID, allowNull: false, field: 'academic_year_id' },
  status: { type: DataTypes.ENUM('ACTIVE', 'ENDED'), defaultValue: 'ACTIVE' },
  startDate: { type: DataTypes.DATEONLY, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, field: 'end_date' },
}, { tableName: 'teacher_assignments', updatedAt: false });

const TimetableSlot = sequelize.define('TimetableSlot', {
  id: PK,
  classSectionId: { type: DataTypes.UUID, allowNull: false, field: 'class_section_id' },
  subjectId: { type: DataTypes.UUID, allowNull: false, field: 'subject_id' },
  teacherId: { type: DataTypes.UUID, field: 'teacher_id' },
  roomId: { type: DataTypes.UUID, field: 'room_id' },
  academicYearId: { type: DataTypes.UUID, allowNull: false, field: 'academic_year_id' },
  weekday: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false }, // 1=Lundi
  startTime: { type: DataTypes.TIME, allowNull: false, field: 'start_time' },
  endTime: { type: DataTypes.TIME, allowNull: false, field: 'end_time' },
}, { tableName: 'timetable_slots', updatedAt: false });

// =====================================================================
//  MODULE 5 : ELEVES, SANTE & FAMILLE
// =====================================================================
const Student = sequelize.define('Student', {
  id: PK,
  sequentialNumber: { type: DataTypes.INTEGER.UNSIGNED, unique: true, field: 'sequential_number' },
  matricule: { type: DataTypes.STRING(40) },
  fullName: { type: DataTypes.STRING(150), allowNull: false, field: 'full_name' },
  gender: { type: DataTypes.ENUM('M', 'F'), allowNull: false },
  birthDate: { type: DataTypes.DATEONLY, field: 'birth_date' },
  idDocumentType: { type: DataTypes.ENUM('BI', 'CEDULA', 'PASSPORT', 'BIRTH_CERT', 'OTHER'), field: 'id_document_type' },
  idDocumentNumber: { type: DataTypes.STRING(60), unique: true, field: 'id_document_number' },
  nif: { type: DataTypes.STRING(40) },
  qrCodeToken: { type: DataTypes.UUID, unique: true, field: 'qr_code_token', defaultValue: DataTypes.UUIDV4 },
  photoUrl: { type: DataTypes.STRING(255), field: 'photo_url' },
  status: { type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'EXPELLED', 'GRADUATED', 'DROPPED'), defaultValue: 'ACTIVE' },
}, { tableName: 'students' });

const StudentHealthRecord = sequelize.define('StudentHealthRecord', {
  studentId: { type: DataTypes.UUID, primaryKey: true, field: 'student_id' },
  bloodType: { type: DataTypes.STRING(5), field: 'blood_type' },
  allergies: { type: DataTypes.JSON },
  chronicConditions: { type: DataTypes.JSON, field: 'chronic_conditions' },
  dietaryRestrictions: { type: DataTypes.JSON, field: 'dietary_restrictions' },
  prohibitions: { type: DataTypes.JSON },
  canDoPhysicalActivity: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'can_do_physical_activity' },
  emergencyNotes: { type: DataTypes.TEXT, field: 'emergency_notes' },
}, { tableName: 'student_health_records', createdAt: false });

const Guardian = sequelize.define('Guardian', {
  id: PK,
  userId: { type: DataTypes.UUID, field: 'user_id' },
  fullName: { type: DataTypes.STRING(150), allowNull: false, field: 'full_name' },
  phone: { type: DataTypes.STRING(30) },
  email: { type: DataTypes.STRING(150) },
}, { tableName: 'guardians', updatedAt: false });

const StudentGuardian = sequelize.define('StudentGuardian', {
  id: PK,
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  guardianId: { type: DataTypes.UUID, allowNull: false, field: 'guardian_id' },
  relationship: { type: DataTypes.ENUM('FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'UNCLE', 'AUNT', 'SIBLING', 'FRIEND', 'OTHER'), allowNull: false },
  isEnroller: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_enroller' },
  isEmergency: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_emergency' },
  priorityOrder: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 1, field: 'priority_order' },
  recoveryPinHash: { type: DataTypes.STRING(255), field: 'recovery_pin_hash' },
}, { tableName: 'student_guardians', timestamps: false });

const Enrollment = sequelize.define('Enrollment', {
  id: PK,
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  classSectionId: { type: DataTypes.UUID, allowNull: false, field: 'class_section_id' },
  academicYearId: { type: DataTypes.UUID, allowNull: false, field: 'academic_year_id' },
  enrollmentType: { type: DataTypes.ENUM('NEW', 'RE_ENROLLMENT'), defaultValue: 'NEW', field: 'enrollment_type' },
  status: { type: DataTypes.ENUM('ACTIVE', 'TRANSFERRED', 'DROPPED', 'COMPLETED'), defaultValue: 'ACTIVE' },
  startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, field: 'end_date' },
  transferReason: { type: DataTypes.STRING(255), field: 'transfer_reason' },
}, { tableName: 'enrollments', updatedAt: false });

const StudentStatusHistory = sequelize.define('StudentStatusHistory', {
  id: PK,
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  status: { type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'EXPELLED', 'GRADUATED', 'DROPPED'), allowNull: false },
  reason: { type: DataTypes.TEXT },
  startDate: { type: DataTypes.DATEONLY, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, field: 'end_date' },
  decidedBy: { type: DataTypes.UUID, field: 'decided_by' },
}, { tableName: 'student_status_history', updatedAt: false });

// =====================================================================
//  MODULE 6 : VIE SCOLAIRE
// =====================================================================
const Attendance = sequelize.define('Attendance', {
  id: PK,
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  classSectionId: { type: DataTypes.UUID, allowNull: false, field: 'class_section_id' },
  subjectId: { type: DataTypes.UUID, field: 'subject_id' },
  attendanceDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'attendance_date' },
  period: { type: DataTypes.ENUM('DAY', 'MORNING', 'AFTERNOON', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'), defaultValue: 'DAY' },
  status: { type: DataTypes.ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED'), allowNull: false },
  recordedBy: { type: DataTypes.UUID, allowNull: false, field: 'recorded_by' },
}, { tableName: 'attendances', updatedAt: false });

const AbsenceJustification = sequelize.define('AbsenceJustification', {
  id: PK,
  attendanceId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'attendance_id' },
  reason: { type: DataTypes.TEXT, allowNull: false },
  documentUrl: { type: DataTypes.STRING(255), field: 'document_url' },
  submittedBy: { type: DataTypes.UUID, field: 'submitted_by' },
  status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'), defaultValue: 'PENDING' },
  validatedBy: { type: DataTypes.UUID, field: 'validated_by' },
  validatedAt: { type: DataTypes.DATE, field: 'validated_at' },
}, { tableName: 'absence_justifications', updatedAt: false });

const StudentObservation = sequelize.define('StudentObservation', {
  id: PK,
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  teacherId: { type: DataTypes.UUID, allowNull: false, field: 'teacher_id' },
  classSectionId: { type: DataTypes.UUID, field: 'class_section_id' },
  type: { type: DataTypes.ENUM('POSITIVE', 'WARNING', 'INCIDENT', 'NOTE'), allowNull: false },
  comment: { type: DataTypes.TEXT, allowNull: false },
  approvalStatus: { type: DataTypes.ENUM('PENDING_SECRETARIAT', 'REVIEWED', 'ARCHIVED'), defaultValue: 'PENDING_SECRETARIAT', field: 'approval_status' },
  secretariatNotes: { type: DataTypes.TEXT, field: 'secretariat_notes' },
  reviewedBy: { type: DataTypes.UUID, field: 'reviewed_by' },
}, { tableName: 'student_observations', updatedAt: false });

const StudentExit = sequelize.define('StudentExit', {
  id: PK,
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  exitDatetime: { type: DataTypes.DATE, allowNull: false, field: 'exit_datetime' },
  reasonType: { type: DataTypes.ENUM('MEDICAL', 'PERSONAL', 'APPOINTMENT', 'EMERGENCY', 'OTHER'), allowNull: false, field: 'reason_type' },
  reasonDetail: { type: DataTypes.TEXT, field: 'reason_detail' },
  authorizedBy: { type: DataTypes.UUID, allowNull: false, field: 'authorized_by' },
  pickedUpByName: { type: DataTypes.STRING(150), allowNull: false, field: 'picked_up_by_name' },
  pickedUpRelationship: { type: DataTypes.STRING(60), field: 'picked_up_relationship' },
  pinVerified: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'pin_verified' },
  parentNotified: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'parent_notified' },
}, { tableName: 'student_exits', updatedAt: false });

const CrecheDailyReport = sequelize.define('CrecheDailyReport', {
  id: PK,
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  reportDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'report_date' },
  nap: { type: DataTypes.STRING(120) },
  meals: { type: DataTypes.JSON },
  diaperChanges: { type: DataTypes.INTEGER.UNSIGNED, field: 'diaper_changes' },
  mood: { type: DataTypes.ENUM('HAPPY', 'CALM', 'TIRED', 'CRYING', 'SICK', 'OTHER') },
  notes: { type: DataTypes.TEXT },
  recordedBy: { type: DataTypes.UUID, field: 'recorded_by' },
}, { tableName: 'creche_daily_reports', updatedAt: false });

// =====================================================================
//  MODULE 7 : EVENEMENTS & PROGRAMME
// =====================================================================
const Event = sequelize.define('Event', {
  id: PK,
  title: { type: DataTypes.STRING(200), allowNull: false },
  type: { type: DataTypes.ENUM('HOMEWORK', 'EXAM', 'QUIZ', 'PRESENTATION', 'ACTIVITY', 'SCHOOL_TRIP', 'CULTURAL', 'SPORTS', 'OTHER'), allowNull: false },
  description: { type: DataTypes.TEXT },
  classSectionId: { type: DataTypes.UUID, field: 'class_section_id' },
  cursoId: { type: DataTypes.UUID, field: 'curso_id' },
  subjectId: { type: DataTypes.UUID, field: 'subject_id' },
  eventDate: { type: DataTypes.DATE, allowNull: false, field: 'event_date' },
  dueDate: { type: DataTypes.DATE, field: 'due_date' },
  isGraded: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_graded' },
  maxGrade: { type: DataTypes.DECIMAL(5, 2), field: 'max_grade' },
  coefficient: { type: DataTypes.DECIMAL(4, 2) },
  isPaid: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_paid' },
  cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
  approvalStatus: { type: DataTypes.ENUM('AUTO_APPROVED', 'PENDING_SECRETARIAT', 'APPROVED', 'REJECTED'), defaultValue: 'AUTO_APPROVED', field: 'approval_status' },
  approvedBy: { type: DataTypes.UUID, field: 'approved_by' },
  rejectionReason: { type: DataTypes.STRING(255), field: 'rejection_reason' },
  createdBy: { type: DataTypes.UUID, allowNull: false, field: 'created_by' },
}, { tableName: 'events', updatedAt: false });

const StudentEvent = sequelize.define('StudentEvent', {
  id: PK,
  eventId: { type: DataTypes.UUID, allowNull: false, field: 'event_id' },
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  grade: { type: DataTypes.DECIMAL(5, 2) },
  teacherComment: { type: DataTypes.TEXT, field: 'teacher_comment' },
  attendanceStatus: { type: DataTypes.ENUM('PRESENT', 'ABSENT', 'EXCUSED'), field: 'attendance_status' },
  paymentStatus: { type: DataTypes.ENUM('NOT_APPLICABLE', 'PENDING', 'PAID'), defaultValue: 'NOT_APPLICABLE', field: 'payment_status' },
  permissionStatus: { type: DataTypes.ENUM('NOT_APPLICABLE', 'PENDING', 'APPROVED_BY_PARENT', 'REFUSED'), defaultValue: 'NOT_APPLICABLE', field: 'permission_status' },
  paidAt: { type: DataTypes.DATE, field: 'paid_at' },
}, { tableName: 'student_events', timestamps: false });

const CurriculumChapter = sequelize.define('CurriculumChapter', {
  id: PK,
  subjectId: { type: DataTypes.UUID, allowNull: false, field: 'subject_id' },
  academicYearId: { type: DataTypes.UUID, allowNull: false, field: 'academic_year_id' },
  chapterNumber: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'chapter_number' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  estimatedHours: { type: DataTypes.INTEGER.UNSIGNED, field: 'estimated_hours' },
  description: { type: DataTypes.TEXT },
}, { tableName: 'curriculum_chapters', timestamps: false });

const TeacherSyllabusProgress = sequelize.define('TeacherSyllabusProgress', {
  id: PK,
  teacherId: { type: DataTypes.UUID, allowNull: false, field: 'teacher_id' },
  classSectionId: { type: DataTypes.UUID, allowNull: false, field: 'class_section_id' },
  chapterId: { type: DataTypes.UUID, allowNull: false, field: 'chapter_id' },
  status: { type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED'), defaultValue: 'PENDING' },
  progressPercent: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0, field: 'progress_percent' },
  lastStoppedAt: { type: DataTypes.TEXT, field: 'last_stopped_at' },
  startedAt: { type: DataTypes.DATEONLY, field: 'started_at' },
  completedDate: { type: DataTypes.DATEONLY, field: 'completed_date' },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'teacher_syllabus_progress', timestamps: false });

// =====================================================================
//  MODULE 8 : SERVICES (TRANSPORT & CANTINE)
// =====================================================================
const BusRoute = sequelize.define('BusRoute', {
  id: PK,
  name: { type: DataTypes.STRING(150), allowNull: false },
  driverId: { type: DataTypes.UUID, field: 'driver_id' },
  plate: { type: DataTypes.STRING(20) },
  capacity: { type: DataTypes.INTEGER.UNSIGNED },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
}, { tableName: 'bus_routes', timestamps: false });

const StudentTransportSubscription = sequelize.define('StudentTransportSubscription', {
  id: PK,
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  routeId: { type: DataTypes.UUID, field: 'route_id' },
  academicYearId: { type: DataTypes.UUID, allowNull: false, field: 'academic_year_id' },
  monthlyFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'monthly_fee' },
  subscriptionStatus: { type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'EXPIRED'), defaultValue: 'ACTIVE', field: 'subscription_status' },
  paymentStatus: { type: DataTypes.ENUM('PAID', 'PENDING'), defaultValue: 'PENDING', field: 'payment_status' },
  validFrom: { type: DataTypes.DATEONLY, field: 'valid_from' },
  validTo: { type: DataTypes.DATEONLY, field: 'valid_to' },
}, { tableName: 'student_transport_subscriptions', timestamps: false });

const BusCheckin = sequelize.define('BusCheckin', {
  id: PK,
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  routeId: { type: DataTypes.UUID, field: 'route_id' },
  direction: { type: DataTypes.ENUM('BOARD', 'ALIGHT'), allowNull: false },
  checkpoint: { type: DataTypes.STRING(100) },
  gpsLat: { type: DataTypes.DECIMAL(10, 7), field: 'gps_lat' },
  gpsLng: { type: DataTypes.DECIMAL(10, 7), field: 'gps_lng' },
  scannedBy: { type: DataTypes.UUID, field: 'scanned_by' },
  checkinAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'checkin_at' },
}, { tableName: 'bus_checkins', timestamps: false });

const StudentCanteenSubscription = sequelize.define('StudentCanteenSubscription', {
  id: PK,
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  academicYearId: { type: DataTypes.UUID, allowNull: false, field: 'academic_year_id' },
  formulaType: { type: DataTypes.ENUM('MONTHLY_UNLIMITED', 'TICKET_BOOK', 'A_LA_CARTE'), allowNull: false, field: 'formula_type' },
  monthlyFee: { type: DataTypes.DECIMAL(10, 2), field: 'monthly_fee' },
  subscriptionStatus: { type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'EXPIRED'), defaultValue: 'ACTIVE', field: 'subscription_status' },
  paymentStatus: { type: DataTypes.ENUM('PAID', 'PENDING'), defaultValue: 'PENDING', field: 'payment_status' },
  validFrom: { type: DataTypes.DATEONLY, field: 'valid_from' },
  validTo: { type: DataTypes.DATEONLY, field: 'valid_to' },
}, { tableName: 'student_canteen_subscriptions', timestamps: false });

const CanteenAccessLog = sequelize.define('CanteenAccessLog', {
  id: PK,
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  accessAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'access_at' },
  granted: { type: DataTypes.BOOLEAN, allowNull: false },
  denyReason: { type: DataTypes.STRING(150), field: 'deny_reason' },
  scannedBy: { type: DataTypes.UUID, field: 'scanned_by' },
}, { tableName: 'canteen_access_logs', timestamps: false });

// =====================================================================
//  MODULE 9 : FINANCES
// =====================================================================
const FEE_TYPES = ['REGISTRATION', 'PROPINA', 'CANTEEN', 'TRANSPORT', 'EXAM_SHEET', 'TRIP', 'OTHER'];

const FeeStructure = sequelize.define('FeeStructure', {
  id: PK,
  academicYearId: { type: DataTypes.UUID, allowNull: false, field: 'academic_year_id' },
  cursoId: { type: DataTypes.UUID, field: 'curso_id' },
  feeType: { type: DataTypes.ENUM(...FEE_TYPES), allowNull: false, field: 'fee_type' },
  label: { type: DataTypes.STRING(150), allowNull: false },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  periodicity: { type: DataTypes.ENUM('ONE_TIME', 'MONTHLY', 'TRIMESTER', 'ANNUAL'), defaultValue: 'MONTHLY' },
  dueDay: { type: DataTypes.TINYINT.UNSIGNED, field: 'due_day' },
  lateFeeAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0, field: 'late_fee_amount' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
}, { tableName: 'fee_structures', timestamps: false });

const Invoice = sequelize.define('Invoice', {
  id: PK,
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  feeStructureId: { type: DataTypes.UUID, field: 'fee_structure_id' },
  academicYearId: { type: DataTypes.UUID, allowNull: false, field: 'academic_year_id' },
  feeType: { type: DataTypes.ENUM(...FEE_TYPES), allowNull: false, field: 'fee_type' },
  referenceMonth: { type: DataTypes.STRING(7), field: 'reference_month' },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  discount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0 },
  lateFee: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0, field: 'late_fee' },
  totalDue: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'total_due' },
  amountPaid: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0, field: 'amount_paid' },
  dueDate: { type: DataTypes.DATEONLY, field: 'due_date' },
  status: { type: DataTypes.ENUM('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'), defaultValue: 'UNPAID' },
}, { tableName: 'invoices', updatedAt: false });

const Payment = sequelize.define('Payment', {
  id: PK,
  invoiceId: { type: DataTypes.UUID, field: 'invoice_id' },
  studentId: { type: DataTypes.UUID, allowNull: false, field: 'student_id' },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  method: { type: DataTypes.ENUM('CASH', 'MULTICAIXA_EXPRESS', 'UNITEL_MONEY', 'BANK_TRANSFER', 'OTHER'), allowNull: false },
  reference: { type: DataTypes.STRING(100) },
  receiptNumber: { type: DataTypes.STRING(50), unique: true, field: 'receipt_number' },
  cashierId: { type: DataTypes.UUID, allowNull: false, field: 'cashier_id' },
  paidAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'paid_at' },
}, { tableName: 'payments', timestamps: false });

const Transaction = sequelize.define('Transaction', {
  id: PK,
  direction: { type: DataTypes.ENUM('INCOME', 'EXPENSE'), allowNull: false },
  category: { type: DataTypes.ENUM('PROPINA', 'REGISTRATION', 'CANTEEN', 'TRANSPORT', 'EXAM_SHEET', 'TRIP', 'SALARY', 'UTILITY_BILL', 'SUPPLY', 'OTHER'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  description: { type: DataTypes.STRING(255) },
  referenceType: { type: DataTypes.STRING(40), field: 'reference_type' },
  referenceId: { type: DataTypes.UUID, field: 'reference_id' },
  studentId: { type: DataTypes.UUID, field: 'student_id' },
  recordedBy: { type: DataTypes.UUID, allowNull: false, field: 'recorded_by' },
  occurredAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'occurred_at' },
}, { tableName: 'transactions', timestamps: false });

const SalaryPayment = sequelize.define('SalaryPayment', {
  id: PK,
  beneficiaryType: { type: DataTypes.ENUM('TEACHER', 'SECRETARY', 'STAFF', 'DIRECTOR'), allowNull: false, field: 'beneficiary_type' },
  beneficiaryUserId: { type: DataTypes.UUID, field: 'beneficiary_user_id' },
  beneficiaryStaffId: { type: DataTypes.UUID, field: 'beneficiary_staff_id' },
  periodMonth: { type: DataTypes.STRING(7), allowNull: false, field: 'period_month' },
  baseAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'base_amount' },
  bonuses: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0 },
  deductions: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0 },
  netAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'net_amount' },
  status: { type: DataTypes.ENUM('PENDING', 'PAID'), defaultValue: 'PENDING' },
  paidAt: { type: DataTypes.DATE, field: 'paid_at' },
  recordedBy: { type: DataTypes.UUID, allowNull: false, field: 'recorded_by' },
}, { tableName: 'salary_payments', updatedAt: false });

// =====================================================================
//  MODULE 10-12 : TACHES, MESSAGERIE, SYNC & AUDIT
// =====================================================================
const StaffTask = sequelize.define('StaffTask', {
  id: PK,
  staffId: { type: DataTypes.UUID, allowNull: false, field: 'staff_id' },
  taskDescription: { type: DataTypes.STRING(255), allowNull: false, field: 'task_description' },
  scheduledTime: { type: DataTypes.TIME, field: 'scheduled_time' },
  taskDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'task_date' },
  status: { type: DataTypes.ENUM('PENDING', 'COMPLETED', 'MISSED'), defaultValue: 'PENDING' },
  checkedBy: { type: DataTypes.UUID, field: 'checked_by' },
  supervisorComment: { type: DataTypes.STRING(255), field: 'supervisor_comment' },
  checkedAt: { type: DataTypes.DATE, field: 'checked_at' },
}, { tableName: 'staff_tasks', updatedAt: false });

const Conversation = sequelize.define('Conversation', {
  id: PK,
  type: { type: DataTypes.ENUM('DIRECT', 'CLASS_GROUP', 'ANNOUNCEMENT'), allowNull: false },
  title: { type: DataTypes.STRING(150) },
  classSectionId: { type: DataTypes.UUID, field: 'class_section_id' },
  createdBy: { type: DataTypes.UUID, field: 'created_by' },
}, { tableName: 'conversations', updatedAt: false });

const ConversationParticipant = sequelize.define('ConversationParticipant', {
  id: PK,
  conversationId: { type: DataTypes.UUID, allowNull: false, field: 'conversation_id' },
  userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
  joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'joined_at' },
  lastReadAt: { type: DataTypes.DATE, field: 'last_read_at' },
}, { tableName: 'conversation_participants', timestamps: false });

const Message = sequelize.define('Message', {
  id: PK,
  conversationId: { type: DataTypes.UUID, allowNull: false, field: 'conversation_id' },
  senderId: { type: DataTypes.UUID, field: 'sender_id' },
  body: { type: DataTypes.TEXT },
  attachmentUrl: { type: DataTypes.STRING(255), field: 'attachment_url' },
  isAnnouncement: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_announcement' },
  sentAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'sent_at' },
}, { tableName: 'messages', timestamps: false });

const Notification = sequelize.define('Notification', {
  id: PK,
  userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
  type: { type: DataTypes.STRING(50), allowNull: false },
  title: { type: DataTypes.STRING(150), allowNull: false },
  body: { type: DataTypes.TEXT },
  referenceType: { type: DataTypes.STRING(40), field: 'reference_type' },
  referenceId: { type: DataTypes.UUID, field: 'reference_id' },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_read' },
}, { tableName: 'notifications', updatedAt: false });

const SyncOutbox = sequelize.define('SyncOutbox', {
  id: PK,
  deviceId: { type: DataTypes.STRING(100), allowNull: false, field: 'device_id' },
  entityType: { type: DataTypes.STRING(60), allowNull: false, field: 'entity_type' },
  entityUuid: { type: DataTypes.UUID, allowNull: false, field: 'entity_uuid' },
  operation: { type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'), allowNull: false },
  payload: { type: DataTypes.JSON, allowNull: false },
  clientTimestamp: { type: DataTypes.DATE, allowNull: false, field: 'client_timestamp' },
  status: { type: DataTypes.ENUM('PENDING', 'SYNCED', 'CONFLICT'), defaultValue: 'PENDING' },
  syncedAt: { type: DataTypes.DATE, field: 'synced_at' },
}, { tableName: 'sync_outbox', updatedAt: false });

const AuditLog = sequelize.define('AuditLog', {
  id: PK,
  userId: { type: DataTypes.UUID, field: 'user_id' },
  action: { type: DataTypes.STRING(80), allowNull: false },
  entityType: { type: DataTypes.STRING(60), field: 'entity_type' },
  entityId: { type: DataTypes.UUID, field: 'entity_id' },
  oldValues: { type: DataTypes.JSON, field: 'old_values' },
  newValues: { type: DataTypes.JSON, field: 'new_values' },
  ipAddress: { type: DataTypes.STRING(45), field: 'ip_address' },
}, { tableName: 'audit_logs', updatedAt: false });

// =====================================================================
//  ASSOCIATIONS
// =====================================================================

// --- RBAC ---
Role.belongsToMany(Permission, { through: 'role_permissions', foreignKey: 'role_id', otherKey: 'permission_id', timestamps: false });
Permission.belongsToMany(Role, { through: 'role_permissions', foreignKey: 'permission_id', otherKey: 'role_id', timestamps: false });
User.belongsToMany(Role, { through: 'user_roles', foreignKey: 'user_id', otherKey: 'role_id', timestamps: false });
Role.belongsToMany(User, { through: 'user_roles', foreignKey: 'role_id', otherKey: 'user_id', timestamps: false });

// --- Profils 1-1 ---
User.hasOne(TeacherProfile, { foreignKey: 'user_id', as: 'teacherProfile' });
TeacherProfile.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(SecretariatProfile, { foreignKey: 'user_id', as: 'secretariatProfile' });
SecretariatProfile.belongsTo(User, { foreignKey: 'user_id' });

// --- Structure academique ---
Curso.hasMany(Subject, { foreignKey: 'curso_id' });
Subject.belongsTo(Curso, { foreignKey: 'curso_id' });
Curso.hasMany(ClassSection, { foreignKey: 'curso_id' });
ClassSection.belongsTo(Curso, { foreignKey: 'curso_id' });
Room.hasMany(ClassSection, { foreignKey: 'room_id' });
ClassSection.belongsTo(Room, { foreignKey: 'room_id' });
AcademicYear.hasMany(ClassSection, { foreignKey: 'academic_year_id' });
ClassSection.belongsTo(AcademicYear, { foreignKey: 'academic_year_id' });
ClassSection.belongsTo(User, { foreignKey: 'main_teacher_id', as: 'mainTeacher' });
TeacherProfile.belongsTo(ClassSection, { foreignKey: 'main_class_section_id', as: 'mainClassSection' });

// --- Affectation prof <-> section <-> matiere ---
User.belongsToMany(ClassSection, { through: TeacherAssignment, foreignKey: 'teacher_id', otherKey: 'class_section_id', as: 'assignedSections' });
ClassSection.belongsToMany(User, { through: TeacherAssignment, foreignKey: 'class_section_id', otherKey: 'teacher_id', as: 'teachers' });
TeacherAssignment.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
TeacherAssignment.belongsTo(ClassSection, { foreignKey: 'class_section_id' });
TeacherAssignment.belongsTo(Subject, { foreignKey: 'subject_id' });

// --- Emploi du temps ---
ClassSection.hasMany(TimetableSlot, { foreignKey: 'class_section_id' });
TimetableSlot.belongsTo(ClassSection, { foreignKey: 'class_section_id' });
TimetableSlot.belongsTo(Subject, { foreignKey: 'subject_id' });
TimetableSlot.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
TimetableSlot.belongsTo(Room, { foreignKey: 'room_id' });

// --- Eleve, sante, famille, scolarite ---
Student.hasOne(StudentHealthRecord, { foreignKey: 'student_id', as: 'health' });
StudentHealthRecord.belongsTo(Student, { foreignKey: 'student_id' });
Student.belongsToMany(Guardian, { through: StudentGuardian, foreignKey: 'student_id', otherKey: 'guardian_id', as: 'guardians' });
Guardian.belongsToMany(Student, { through: StudentGuardian, foreignKey: 'guardian_id', otherKey: 'student_id', as: 'students' });
Guardian.belongsTo(User, { foreignKey: 'user_id' });
Student.belongsToMany(ClassSection, { through: Enrollment, foreignKey: 'student_id', otherKey: 'class_section_id', as: 'sections' });
ClassSection.belongsToMany(Student, { through: Enrollment, foreignKey: 'class_section_id', otherKey: 'student_id', as: 'students' });
Student.hasMany(StudentStatusHistory, { foreignKey: 'student_id', as: 'statusHistory' });
StudentStatusHistory.belongsTo(Student, { foreignKey: 'student_id' });

// --- Vie scolaire ---
Student.hasMany(Attendance, { foreignKey: 'student_id' });
Attendance.belongsTo(Student, { foreignKey: 'student_id' });
Attendance.belongsTo(ClassSection, { foreignKey: 'class_section_id' });
Attendance.hasOne(AbsenceJustification, { foreignKey: 'attendance_id', as: 'justification' });
AbsenceJustification.belongsTo(Attendance, { foreignKey: 'attendance_id' });
Student.hasMany(StudentObservation, { foreignKey: 'student_id' });
StudentObservation.belongsTo(Student, { foreignKey: 'student_id' });
StudentObservation.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
Student.hasMany(StudentExit, { foreignKey: 'student_id' });
StudentExit.belongsTo(Student, { foreignKey: 'student_id' });
StudentExit.belongsTo(User, { foreignKey: 'authorized_by', as: 'authorizer' });
Student.hasMany(CrecheDailyReport, { foreignKey: 'student_id' });
CrecheDailyReport.belongsTo(Student, { foreignKey: 'student_id' });

// --- Evenements & programme ---
Event.belongsTo(ClassSection, { foreignKey: 'class_section_id' });
Event.belongsTo(Subject, { foreignKey: 'subject_id' });
Event.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Student.belongsToMany(Event, { through: StudentEvent, foreignKey: 'student_id', otherKey: 'event_id', as: 'events' });
Event.belongsToMany(Student, { through: StudentEvent, foreignKey: 'event_id', otherKey: 'student_id', as: 'students' });
Subject.hasMany(CurriculumChapter, { foreignKey: 'subject_id' });
CurriculumChapter.belongsTo(Subject, { foreignKey: 'subject_id' });
CurriculumChapter.hasMany(TeacherSyllabusProgress, { foreignKey: 'chapter_id' });
TeacherSyllabusProgress.belongsTo(CurriculumChapter, { foreignKey: 'chapter_id' });
TeacherSyllabusProgress.belongsTo(ClassSection, { foreignKey: 'class_section_id' });
TeacherSyllabusProgress.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

// --- Services ---
// Chauffeur = membre du personnel (staff_members), decision client
BusRoute.belongsTo(StaffMember, { foreignKey: 'driver_id', as: 'driver' });
StaffMember.hasMany(BusRoute, { foreignKey: 'driver_id', as: 'routes' });
Student.hasMany(StudentTransportSubscription, { foreignKey: 'student_id', as: 'transportSubs' });
StudentTransportSubscription.belongsTo(Student, { foreignKey: 'student_id' });
StudentTransportSubscription.belongsTo(BusRoute, { foreignKey: 'route_id' });
Student.hasMany(BusCheckin, { foreignKey: 'student_id' });
BusCheckin.belongsTo(Student, { foreignKey: 'student_id' });
Student.hasMany(StudentCanteenSubscription, { foreignKey: 'student_id', as: 'canteenSubs' });
StudentCanteenSubscription.belongsTo(Student, { foreignKey: 'student_id' });
Student.hasMany(CanteenAccessLog, { foreignKey: 'student_id' });
CanteenAccessLog.belongsTo(Student, { foreignKey: 'student_id' });

// --- Finances ---
FeeStructure.belongsTo(Curso, { foreignKey: 'curso_id' });
Student.hasMany(Invoice, { foreignKey: 'student_id' });
Invoice.belongsTo(Student, { foreignKey: 'student_id' });
Invoice.belongsTo(FeeStructure, { foreignKey: 'fee_structure_id' });
Invoice.hasMany(Payment, { foreignKey: 'invoice_id' });
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id' });
Payment.belongsTo(Student, { foreignKey: 'student_id' });
Payment.belongsTo(User, { foreignKey: 'cashier_id', as: 'cashier' });
Transaction.belongsTo(Student, { foreignKey: 'student_id' });
Transaction.belongsTo(User, { foreignKey: 'recorded_by', as: 'recorder' });

// --- Taches / messagerie / audit ---
StaffMember.hasMany(StaffTask, { foreignKey: 'staff_id' });
StaffTask.belongsTo(StaffMember, { foreignKey: 'staff_id' });
StaffTask.belongsTo(User, { foreignKey: 'checked_by', as: 'checker' });
Conversation.hasMany(ConversationParticipant, { foreignKey: 'conversation_id', as: 'participants' });
ConversationParticipant.belongsTo(Conversation, { foreignKey: 'conversation_id' });
ConversationParticipant.belongsTo(User, { foreignKey: 'user_id' });
Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

// =====================================================================
//  EXPORT
// =====================================================================
export default {
  sequelize, Sequelize,
  AcademicYear, Room, Curso, Subject,
  User, Role, Permission, SecretariatProfile, StaffMember,
  ClassSection, TeacherProfile, TeacherAssignment, TimetableSlot,
  Student, StudentHealthRecord, Guardian, StudentGuardian, Enrollment, StudentStatusHistory,
  Attendance, AbsenceJustification, StudentObservation, StudentExit, CrecheDailyReport,
  Event, StudentEvent, CurriculumChapter, TeacherSyllabusProgress,
  BusRoute, StudentTransportSubscription, BusCheckin, StudentCanteenSubscription, CanteenAccessLog,
  FeeStructure, Invoice, Payment, Transaction, SalaryPayment,
  StaffTask, Conversation, ConversationParticipant, Message, Notification,
  SyncOutbox, AuditLog,
};
