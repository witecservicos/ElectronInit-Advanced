/**
 * Gestion centralisee des erreurs + route 404.
 * Traduit les erreurs Sequelize courantes en reponses HTTP lisibles.
 */
import { config } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ error: 'Ressource introuvable.', path: req.originalUrl });
}

// Express 5 : la signature a 4 arguments identifie le gestionnaire d'erreurs.
export function errorHandler(err, req, res, _next) {
  // Erreurs de validation / contrainte Sequelize
  if (err?.name === 'SequelizeValidationError' || err?.name === 'SequelizeUniqueConstraintError') {
    return res.status(422).json({
      error: 'Donnees invalides.',
      details: (err.errors || []).map((e) => ({ field: e.path, message: e.message })),
    });
  }
  if (err?.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({ error: 'Reference etrangere invalide ou dependance existante.' });
  }

  const status = err.status || err.statusCode || 500;
  console.error('[error]', status, err.message);
  const body = { error: err.publicMessage || err.message || 'Erreur interne.' };
  if (!config.isProd) body.stack = err.stack;
  res.status(status).json(body);
}

/** Petit helper pour creer une erreur HTTP avec statut. */
export function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  e.publicMessage = message;
  return e;
}
