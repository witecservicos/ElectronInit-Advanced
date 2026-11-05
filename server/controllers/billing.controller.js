/**
 * =====================================================================
 *  FACTURATION & ENCAISSEMENTS
 *  Inclut la logique des FEUILLES DE COMPOSITION (feuilles d'examen) :
 *  regle client -> 1 feuille par matiere. Donc pour un eleve inscrit
 *  dans une filiere a N matieres, avec un tarif unitaire F :
 *       montant total = N x F
 *  (ex : 14 matieres x 100 AOA = 1400 AOA).
 * =====================================================================
 */
import { Op } from 'sequelize';
import db from '../database/models.js';
import { asyncHandler } from '../utils/helpers.js';
import { httpError } from '../middleware/error.js';

const {
  sequelize, Invoice, Payment, FeeStructure, Subject, ClassSection,
  Enrollment, Student, Transaction,
} = db;

/**
 * Calcule le prix d'une feuille de composition pour un eleve :
 *   nb de matieres de sa filiere  x  tarif unitaire EXAM_SHEET.
 * Body attendu : { enrollmentId, academicYearId, referenceLabel? }
 */
export const generateCompositionInvoice = asyncHandler(async (req, res) => {
  const { enrollmentId, referenceLabel } = req.body;
  if (!enrollmentId) throw httpError(400, 'enrollmentId requis.');

  const enrollment = await Enrollment.findByPk(enrollmentId, {
    include: [{ model: ClassSection }, { model: Student }],
  });
  if (!enrollment) throw httpError(404, 'Inscription introuvable.');

  const section = enrollment.ClassSection;
  if (!section) throw httpError(409, 'Inscription sans section de classe.');

  // 1 feuille par matiere active de la filiere
  const subjectCount = await Subject.count({
    where: { cursoId: section.cursoId, isActive: true },
  });
  if (subjectCount === 0) throw httpError(409, 'Aucune matiere active pour cette filiere.');

  // Tarif unitaire : grille EXAM_SHEET de la filiere, sinon globale
  const fee = await FeeStructure.findOne({
    where: {
      feeType: 'EXAM_SHEET',
      academicYearId: enrollment.academicYearId,
      isActive: true,
      [Op.or]: [{ cursoId: section.cursoId }, { cursoId: null }],
    },
    order: [['curso_id', 'DESC']], // priorite au tarif specifique filiere
  });
  if (!fee) throw httpError(409, 'Aucun tarif "feuille de composition" (EXAM_SHEET) defini.');

  const unit = Number(fee.amount);
  const total = +(unit * subjectCount).toFixed(2);

  const invoice = await Invoice.create({
    studentId: enrollment.studentId,
    feeStructureId: fee.id,
    academicYearId: enrollment.academicYearId,
    feeType: 'EXAM_SHEET',
    referenceMonth: referenceLabel || null,
    amount: total,
    totalDue: total,
    status: 'UNPAID',
  });

  res.status(201).json({
    invoice,
    breakdown: {
      subjects: subjectCount,
      unitFee: unit,
      total,
      formula: `${subjectCount} matieres x ${unit} = ${total}`,
    },
  });
});

/** Liste des factures d'un eleve. */
export const listInvoices = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.studentId) where.studentId = req.query.studentId;
  if (req.query.status) where.status = req.query.status;
  if (req.query.feeType) where.feeType = req.query.feeType;
  const invoices = await Invoice.findAll({ where, order: [['created_at', 'DESC']] });
  res.json({ data: invoices });
});

/**
 * Enregistre un paiement, met a jour la facture et ecrit une ligne de
 * tresorerie (grand livre). Transaction SQL pour garantir la coherence.
 * Body : { invoiceId, studentId, amount, method, reference? }
 */
export const recordPayment = asyncHandler(async (req, res) => {
  const { invoiceId, amount, method, reference } = req.body;
  if (!amount || amount <= 0) throw httpError(400, 'Montant invalide.');
  if (!method) throw httpError(400, 'Mode de paiement requis.');

  const result = await sequelize.transaction(async (t) => {
    let invoice = null;
    let studentId = req.body.studentId;
    if (invoiceId) {
      invoice = await Invoice.findByPk(invoiceId, { transaction: t });
      if (!invoice) throw httpError(404, 'Facture introuvable.');
      studentId = invoice.studentId;
    }
    if (!studentId) throw httpError(400, 'studentId ou invoiceId requis.');

    const receiptNumber = `REC-${Date.now()}`;
    const payment = await Payment.create({
      invoiceId: invoiceId || null,
      studentId,
      amount,
      method,
      reference: reference || null,
      receiptNumber,
      cashierId: req.user.id,
    }, { transaction: t });

    if (invoice) {
      const paid = Number(invoice.amountPaid) + Number(amount);
      let status = invoice.status;
      if (paid >= Number(invoice.totalDue)) status = 'PAID';
      else if (paid > 0) status = 'PARTIAL';
      await invoice.update({ amountPaid: paid, status }, { transaction: t });
    }

    // Ligne de tresorerie (entree de caisse)
    await Transaction.create({
      direction: 'INCOME',
      category: invoice ? invoice.feeType : 'OTHER',
      referenceType: invoice ? 'invoice' : 'payment',
      referenceId: invoiceId || null,
      amount,
      studentId,
      recordedBy: req.user.id,
      description: `Encaissement ${receiptNumber}`,
    }, { transaction: t });

    return { payment, invoice };
  });

  res.status(201).json(result);
});
