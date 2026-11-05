/**
 * =====================================================================
 *  SERVICE DE SYNCHRONISATION  (Local  <->  Cloud MySQL)  -  TEMPLATE
 *  ---------------------------------------------------------------------
 *  IMPORTANT : squelette NON RELIE. La connexion distante reste coupee
 *  tant que le client n'a pas renseigne ses vrais acces dans .env
 *  (REMOTE_SYNC_ENABLED=true + REMOTE_DB_*). Aucun identifiant reel
 *  n'est code ici.
 *
 *  Principe Local-First :
 *   - Chaque ecriture locale depose une entree dans `sync_outbox`.
 *   - A intervalle regulier (node-cron), on pousse les entrees PENDING
 *     vers la base distante, puis on les marque SYNCED.
 *   - La resolution de conflit s'appuie sur `client_timestamp`
 *     (strategie "last-write-wins" a affiner avec le client).
 * =====================================================================
 */
import db from '../database/models.js';
import { config } from '../config/env.js';
import { buildRemoteSequelize, remoteSequelize } from '../config/database.js';

const { SyncOutbox } = db;

let remote = null;
let syncing = false;

/** Prepare (une seule fois) la connexion distante si elle est activee. */
export async function initRemote() {
  if (!config.remote.enabled) return false;
  remote = buildRemoteSequelize();
  if (!remote) return false;
  try {
    await remote.authenticate();
    console.log('[sync] Connexion DISTANTE etablie :', config.remote.host);
    return true;
  } catch (err) {
    console.error('[sync] Connexion distante impossible :', err.message);
    remote = null;
    return false;
  }
}

/**
 * Pousse les entrees en attente vers le cloud.
 * TEMPLATE : si la connexion distante n'est pas prete, on NE touche a
 * rien et on journalise simplement l'etat (dry-run).
 */
export async function pushPending() {
  if (syncing) return { skipped: 'deja en cours' };
  syncing = true;
  try {
    const pending = await SyncOutbox.findAll({
      where: { status: 'PENDING' },
      order: [['client_timestamp', 'ASC']],
      limit: 200,
    });

    if (!config.remote.enabled || !remote) {
      // Mode template : on compte seulement ce qui SERAIT envoye.
      return {
        mode: 'DRY_RUN (synchro distante desactivee)',
        pending: pending.length,
        hint: 'Renseignez REMOTE_SYNC_ENABLED=true et REMOTE_DB_* dans .env pour activer.',
      };
    }

    // --- Envoi reel (actif uniquement quand le client a branche le cloud) ---
    let ok = 0;
    for (const entry of pending) {
      try {
        // TODO (a brancher avec le schema distant reel) :
        //   upsert de entry.payload dans la table entry.entityType sur `remote`
        //   en respectant entry.operation (CREATE/UPDATE/DELETE).
        await entry.update({ status: 'SYNCED', syncedAt: new Date() });
        ok += 1;
      } catch (e) {
        await entry.update({ status: 'CONFLICT' });
        console.error('[sync] Conflit sur', entry.entityType, entry.entityUuid, e.message);
      }
    }
    return { mode: 'LIVE', pushed: ok, total: pending.length };
  } finally {
    syncing = false;
  }
}

export function getRemoteInstance() {
  return remote || remoteSequelize;
}
