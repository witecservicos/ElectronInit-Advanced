/**
 * Securite HTTP : helmet, CORS, limitation de debit (rate limit).
 * Pensé pour un deploiement LAN (Local-First) avec exposition controlee.
 */
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

export function corsMiddleware() {
  const { origins } = config.cors;
  return cors({
    origin: origins.length ? origins : true, // true = reflete l'origine (LAN)
    credentials: true,
  });
}

export function helmetMiddleware() {
  // crossOriginResourcePolicy relache pour servir des ressources sur le LAN
  return helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } });
}

/** Limiteur global : protege contre les abus / boucles accidentelles. */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requetes, reessayez dans un instant.' },
});

/** Limiteur strict pour le login (anti brute-force). */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion. Reessayez plus tard.' },
});
