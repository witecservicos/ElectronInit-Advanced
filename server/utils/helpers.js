/**
 * Petits utilitaires partages.
 */

/** Enveloppe un handler async pour router les rejets vers errorHandler. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** Pagination standard a partir de la query string. */
export function getPagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 25));
  return { page, limit, offset: (page - 1) * limit };
}

/** Calcule l'age (annees revolues) a partir d'une date de naissance. */
export function computeAge(birthDate) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age;
}

/** Formatte une reponse paginee homogene. */
export function paged(rows, count, page, limit) {
  return {
    data: rows,
    meta: { total: count, page, limit, pages: Math.ceil(count / limit) },
  };
}
