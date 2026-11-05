/**
 * Middleware d'authentification JWT.
 * Attend un header `Authorization: Bearer <token>`.
 * Attache `req.user = { id, roleId, permissions }` si valide.
 */
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Token manquant.' });
  }
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expire.' });
  }
}

/** Signe un jeton pour un utilisateur. */
export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      roleId: user.roleId || user.role_id || null,
      roleName: user.roleName || null,
      permissions: user.permissions || [],
    },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpires }
  );
}
