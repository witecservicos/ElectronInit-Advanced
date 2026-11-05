/**
 * =====================================================================
 *  AMORCAGE (SEED) MINIMAL  -  a lancer une seule fois au 1er demarrage
 *  Cree : permissions de base, role ADMIN, et un super-utilisateur.
 *  Usage :  node ./server/database/seed.js
 *  (necessite DB_AUTO_SYNC=true une fois, ou le schema SQL deja importe)
 * =====================================================================
 */
import db from './models.js';
import { sequelize } from '../config/database.js';
import { hashPassword } from '../controllers/auth.controller.js';

const { User, Role, Permission } = db;

// Codes de permission par defaut (format `ressource:action`)
const PERMISSIONS = [
  '*', // super-admin
  'students:read', 'students:create', 'students:update', 'students:delete',
  'billing:read', 'billing:create',
  'grades:read', 'grades:write',
];

const ADMIN = {
  email: /* process.env.SEED_ADMIN_EMAIL || */ 'admin@wiwitrack.com',
  phone: /* process.env.SEED_ADMIN_PHONE || */ '+244000000000',
  password: /* process.env.SEED_ADMIN_PASSWORD || */ 'admin',
  fullName: 'Administrador WIWITRACK',
};

async function run() {
  await sequelize.authenticate();
  await sequelize.sync(); // cree les tables si absentes

  // Permissions
  const perms = [];
  for (const code of PERMISSIONS) {
    const [p] = await Permission.findOrCreate({ where: { code }, defaults: { code } });
    perms.push(p);
  }

  // Role ADMIN
  const [adminRole] = await Role.findOrCreate({
    where: { code: 'ADMIN' },
    defaults: { code: 'ADMIN', name: 'Administrador', description: 'Acces total' },
  });
  await adminRole.setPermissions(perms);

  // Super-utilisateur
  const [user] = await User.findOrCreate({
    where: { email: ADMIN.email },
    defaults: {
      fullName: ADMIN.fullName,
      email: ADMIN.email,
      phonePrimary: ADMIN.phone,
      gender: 'M',
      role: 'ADMIN',
      passwordHash: await hashPassword(ADMIN.password),
      isActive: true,
    },
  });
  await user.setRoles([adminRole]);

  console.log('[seed] Termine. Connexion :', ADMIN.email, '/ mot de passe par defaut :', ADMIN.password);
  await sequelize.close();
}

run().catch((e) => {
  console.error('[seed] Echec :', e.message);
  process.exit(1);
});
