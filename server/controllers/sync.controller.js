/**
 * Endpoints de pilotage de la synchronisation (admin).
 * Permet de declencher / inspecter la synchro manuellement.
 */
import { asyncHandler } from '../utils/helpers.js';
import { pushPending } from '../services/sync.service.js';
import { config } from '../config/env.js';
import db from '../database/models.js';

const { SyncOutbox } = db;

export const status = asyncHandler(async (req, res) => {
  const pending = await SyncOutbox.count({ where: { status: 'PENDING' } });
  const conflicts = await SyncOutbox.count({ where: { status: 'CONFLICT' } });
  res.json({
    remoteEnabled: config.remote.enabled,
    remoteHost: config.remote.host || null,
    cron: config.remote.cron,
    pending,
    conflicts,
  });
});

export const runNow = asyncHandler(async (req, res) => {
  const result = await pushPending();
  res.json(result);
});
