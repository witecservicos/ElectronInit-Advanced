/**
 * =====================================================================
 *  WIWITRACK ESCOLA  -  INSTANCES SEQUELIZE
 *  - `sequelize`       : base LOCALE (source de verite Local-First)
 *  - `remoteSequelize` : base DISTANTE (cloud) -> TEMPLATE non relie.
 *    Reste `null` tant que REMOTE_SYNC_ENABLED n'est pas a true ET que
 *    les identifiants ne sont pas fournis. Le client branchera ses
 *    vrais acces via le fichier .env, sans toucher au code.
 * =====================================================================
 */
import { Sequelize } from 'sequelize';
import { config } from './env.js';

const commonOptions = {
  logging: config.db.logging ? (msg) => console.log('[sql]', msg) : false,
  define: { timestamps: true, underscored: true },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  dialectOptions: { dateStrings: true, typeCast: true },
};

// --- Connexion LOCALE (toujours active) ---
export const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.pass,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    ...commonOptions,
    timezone: '+01:00', // Luanda (WAT)
  }
);

// --- Connexion DISTANTE (cloud) : TEMPLATE, cree seulement si active ---
export let remoteSequelize = null;

export function buildRemoteSequelize() {
  if (!config.remote.enabled) return null;
  if (!config.remote.host || !config.remote.name) {
    console.warn('[sync] REMOTE_SYNC_ENABLED=true mais identifiants distants incomplets -> synchro ignoree.');
    return null;
  }
  remoteSequelize = new Sequelize(
    config.remote.name,
    config.remote.user,
    config.remote.pass,
    {
      host: config.remote.host,
      port: config.remote.port,
      dialect: config.remote.dialect,
      ...commonOptions,
    }
  );
  return remoteSequelize;
}

/** Teste la connexion locale et renvoie true/false sans jeter. */
export async function assertLocalConnection() {
  try {
    await sequelize.authenticate();
    console.log('[db] Connexion LOCALE etablie :', config.db.host + '/' + config.db.name);
    return true;
  } catch (err) {
    console.error('[db] Echec connexion LOCALE :', err.message);
    return false;
  }
}

export default sequelize;
