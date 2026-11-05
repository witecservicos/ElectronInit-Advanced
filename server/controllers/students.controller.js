/**
 * =====================================================================
 *  ELEVES  -  CRUD + age calcule a la volee depuis birth_date.
 *  Decision client : on stocke la DATE DE NAISSANCE (plus fiable que l'age)
 *  et on calcule l'age au moment de l'affichage.
 * =====================================================================
 */
import { Op } from 'sequelize';
import db from '../database/models.js';
import { asyncHandler, getPagination, paged, computeAge } from '../utils/helpers.js';
import { httpError } from '../middleware/error.js';

const { Student, Enrollment, StudentGuardian, Guardian, StudentHealthRecord } = db;

function withAge(student) {
  const json = student.toJSON ? student.toJSON() : student;
  json.age = computeAge(json.birthDate || json.birth_date);
  return json;
}

export const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.q) {
    where[Op.or] = [
      { fullName: { [Op.like]: `%${req.query.q}%` } },
      { matricule: { [Op.like]: `%${req.query.q}%` } },
      { idDocumentNumber: { [Op.like]: `%${req.query.q}%` } },
    ];
  }
  const { rows, count } = await Student.findAndCountAll({ where, limit, offset, order: [['full_name', 'ASC']] });
  res.json(paged(rows.map(withAge), count, page, limit));
});

export const getOne = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id, {
    include: [
      { model: StudentHealthRecord, as: 'healthRecord' },
      { model: Guardian, as: 'guardians', through: { attributes: ['relationship', 'isPrimary', 'canPickup'] } },
      { model: Enrollment },
    ],
  });
  if (!student) throw httpError(404, 'Eleve introuvable.');
  res.json(withAge(student));
});

export const create = asyncHandler(async (req, res) => {
  // Numero sequentiel auto-incremente cote applicatif (lisible par l'humain)
  const last = await Student.max('sequentialNumber');
  const student = await Student.create({ ...req.body, sequentialNumber: (last || 0) + 1 });
  res.status(201).json(withAge(student));
});

export const update = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) throw httpError(404, 'Eleve introuvable.');
  await student.update(req.body);
  res.json(withAge(student));
});

export const remove = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) throw httpError(404, 'Eleve introuvable.');
  // Suppression douce : on archive plutot que de perdre l'historique
  await student.update({ status: 'DROPPED' });
  res.json({ message: 'Eleve archive (statut DROPPED).' });
});
