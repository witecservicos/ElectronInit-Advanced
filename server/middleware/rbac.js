/**
 * Controle d'acces base sur les roles / permissions (RBAC).
 * `req.user.permissions` est un tableau de codes (ex : 'students:create').
 * Le code special '*' accorde tous les droits (super-admin).
 */
export function requirePermission(...needed) {
  return (req, res, next) => {
    const perms = req.user?.permissions || [];
    if (perms.includes('*')) return next();
    const ok = needed.every((p) => perms.includes(p));
    if (!ok) {
      return res.status(403).json({
        error: 'Permission refusee.',
        required: needed,
      });
    }
    return next();
  };
}

/** Exige l'un des roles indiques (par nom). */
export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.roleName;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: 'Role non autorise.', required: roles });
    }
    return next();
  };
}
