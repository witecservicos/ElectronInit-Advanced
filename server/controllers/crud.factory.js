/**
 * =====================================================================
 *  FABRIQUE DE CONTROLEURS CRUD GENERIQUES
 *  Evite de reecrire le meme code pour chaque table. Chaque ressource
 *  "simple" (referentiels, logs, abonnements...) reutilise ces 5 actions.
 *  Les modules a logique metier forte (eleves, facturation, synchro)
 *  gardent leur propre controleur dedie.
 * =====================================================================
 */
import { asyncHandler, getPagination, paged } from '../utils/helpers.js';
import { httpError } from '../middleware/error.js';

/**
 * @param {object} Model  modele Sequelize
 * @param {object} opts   { searchFields?: string[], include?: [], allowSync?: bool }
 */
export function crudController(Model, opts = {}) {
  const { searchFields = [], include = [] } = opts;

  const list = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req.query);
    const where = {};
    // Recherche plein-texte simple sur les champs declares
    if (req.query.q && searchFields.length) {
      const { Op } = await import('sequelize');
      where[Op.or] = searchFields.map((f) => ({ [f]: { [Op.like]: `%${req.query.q}%` } }));
    }
    const { rows, count } = await Model.findAndCountAll({ where, include, limit, offset, order: [['created_at', 'DESC']] });
    res.json(paged(rows, count, page, limit));
  });

  const getOne = asyncHandler(async (req, res) => {
    const row = await Model.findByPk(req.params.id, { include });
    if (!row) throw httpError(404, 'Enregistrement introuvable.');
    res.json(row);
  });

  const create = asyncHandler(async (req, res) => {
    const row = await Model.create(req.body);
    res.status(201).json(row);
  });

  const update = asyncHandler(async (req, res) => {
    const row = await Model.findByPk(req.params.id);
    if (!row) throw httpError(404, 'Enregistrement introuvable.');
    await row.update(req.body);
    res.json(row);
  });

  const remove = asyncHandler(async (req, res) => {
    const row = await Model.findByPk(req.params.id);
    if (!row) throw httpError(404, 'Enregistrement introuvable.');
    await row.destroy();
    res.status(204).send();
  });

  return { list, getOne, create, update, remove };
}
