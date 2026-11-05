/**
 * =====================================================================
 *  WIWITRACK ESCOLA  -  POINT D'ENTREE DU SERVEUR
 *  Sequence de demarrage :
 *    1. Connexion a la base LOCALE (source de verite Local-First).
 *    2. (dev) sync/alter du schema si active dans .env.
 *    3. Demarrage HTTP.
 *    4. Publication du nom de domaine mDNS (au lieu d'une IP).
 *    5. Init de la synchro cloud (template) + planification node-cron.
 * =====================================================================
 */
import cron from 'node-cron';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { assertLocalConnection, sequelize } from './config/database.js';
import db from './database/models.js';
import { startDiscovery, stopDiscovery } from './config/discovery.js';
import { initRemote, pushPending } from './services/sync.service.js';

async function bootstrap() {
  // 1. Base locale
  const connected = await assertLocalConnection();
  if (!connected) {
    console.error('[boot] Impossible de joindre la base locale. Verifiez .env (DB_*).');
    process.exit(1);
  }

  // 2. Schema (dev uniquement)
  if (config.db.autoSync) {
    await sequelize.sync({ alter: config.db.autoAlter });
    console.log('[boot] Schema synchronise (sync/alter).');
  }

  // 3. HTTP
  const app = createApp();
  const server = app.listen(config.server.port, config.server.host, () => {
    console.log(`[boot] API en ecoute sur http://${config.server.host}:${config.server.port}`);
  });

  // 4. Nom de domaine mDNS
  const hostname = startDiscovery();
  if (hostname) console.log(`[boot] Accessible via http://${hostname}:${config.server.port}`);

  // 5. Synchro cloud (template)
  await initRemote();
  if (config.remote.enabled && cron.validate(config.remote.cron)) {
    cron.schedule(config.remote.cron, async () => {
      const r = await pushPending();
      console.log('[cron][sync]', JSON.stringify(r));
    });
    console.log('[boot] Synchro planifiee :', config.remote.cron);
  } else {
    console.log('[boot] Synchro cloud desactivee (template). Renseignez .env pour l\'activer.');
  }

  // Arret propre
  const shutdown = () => {
    console.log('\n[boot] Arret en cours...');
    stopDiscovery();
    server.close(() => sequelize.close().finally(() => process.exit(0)));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('[boot] Echec du demarrage :', err);
  process.exit(1);
});
