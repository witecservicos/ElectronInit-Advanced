/**
 * =====================================================================
 *  AUTHENTIFICATION  -  login / profil / changement de mot de passe
 *  Connexion par email OU telephone principal + mot de passe (bcrypt).
 *  Les permissions sont agregees depuis les roles RBAC de l'utilisateur.
 * =====================================================================
 */
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import db from '../database/models.js';
import { signToken } from '../middleware/auth.js';
import { asyncHandler, computeAge } from '../utils/helpers.js';
import { httpError } from '../middleware/error.js';
import { config } from '../config/env.js';

const { User, Role, Permission } = db;

/** Agrege la liste des codes de permission d'un utilisateur. */
async function collectPermissions(user) {
  const roles = await user.getRoles({ include: [{ model: Permission }] });
  const set = new Set();
  let roleName = user.role; // ENUM simple par defaut
  for (const r of roles) {
    if (r.code) roleName = r.code;
    for (const p of r.Permissions || []) set.add(p.code);
  }
  // Le super-admin (ENUM ADMIN) herite de tous les droits
  if (user.role === 'ADMIN') set.add('*');
  return { permissions: [...set], roleName };
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) throw httpError(400, 'Identifiant et mot de passe requis.');

  console.log(req.body);

  const user = await User.findOne({
    where: { [Op.or]: [{ email: email }/* , { phonePrimary: login } */] },
  });
  if (!user || !user.isActive) throw httpError(401, 'Identifiants invalides.');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw httpError(401, 'Identifiants invalides.');

  const { permissions, roleName } = await collectPermissions(user);
  await user.update({ lastLoginAt: new Date() });

  const token = signToken({
    id: user.id,
    username: user.email || user.phonePrimary,
    roleName,
    permissions,
  });

  res.json({
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phonePrimary,
      role: roleName,
      permissions,
    },
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: { exclude: ['passwordHash'] } });
  if (!user) throw httpError(404, 'Utilisateur introuvable.');
  const json = user.toJSON();
  json.age = computeAge(user.birthDate);
  res.json(json);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) throw httpError(400, 'Nouveau mot de passe trop court (min 6).');
  const user = await User.findByPk(req.user.id);
  if (!user) throw httpError(404, 'Utilisateur introuvable.');
  const ok = await bcrypt.compare(currentPassword || '', user.passwordHash);
  if (!ok) throw httpError(401, 'Mot de passe actuel incorrect.');
  const hash = await bcrypt.hash(newPassword, config.auth.bcryptRounds);
  await user.update({ passwordHash: hash });
  res.json({ message: 'Mot de passe mis a jour.' });
});

/** Utilitaire interne reutilisable pour creer/ hacher un utilisateur. */
export async function hashPassword(plain) {
  return bcrypt.hash(plain, config.auth.bcryptRounds);
}
