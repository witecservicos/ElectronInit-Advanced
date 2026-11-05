/**
 * =====================================================================
 *  WIWITRACK ESCOLA  -  CONFIGURATION CENTRALE (variables d'environnement)
 *  Charge .env puis expose un objet `config` type et valide.
 *  Aucune valeur sensible n'est codee en dur : tout vient de .env.
 * =====================================================================
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// .env a la racine de /server
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const bool = (v, def = false) =>
  v === undefined ? def : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
const int = (v, def) => (v === undefined || v === '' ? def : parseInt(v, 10));

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',

  server: {
    port: int(process.env.PORT, 4000),
    host: process.env.HOST || '0.0.0.0', // ecoute LAN (Local-First)
  },

  // --- Base LOCALE (celle qui tourne sur le poste serveur de l'ecole) ---
  db: {
    name: process.env.DB_NAME || 'wiwitrack_escola',
    user: process.env.DB_USER || 'root',
    pass: process.env.DB_PASS || '',
    host: process.env.DB_HOST || '127.0.0.1',
    port: int(process.env.DB_PORT, 3306),
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: bool(process.env.DB_LOGGING, false),
    // sync({ alter }) UNIQUEMENT en dev ; en prod on utilise des migrations
    autoSync: bool(process.env.DB_AUTO_SYNC, false),
    autoAlter: bool(process.env.DB_AUTO_ALTER, false),
  },

  // --- Base DISTANTE (cloud) : TEMPLATE non relie. ---
  // Laisse vide par defaut : la synchro est desactivee tant que l'URL
  // ou les identifiants ne sont pas fournis manuellement par le client.
  remote: {
    enabled: bool(process.env.REMOTE_SYNC_ENABLED, false),
    name: process.env.REMOTE_DB_NAME || '',
    user: process.env.REMOTE_DB_USER || '',
    pass: process.env.REMOTE_DB_PASS || '',
    host: process.env.REMOTE_DB_HOST || '',
    port: int(process.env.REMOTE_DB_PORT, 3306),
    dialect: process.env.REMOTE_DB_DIALECT || 'mysql',
    // Expression cron de la synchro periodique (ex : toutes les 10 min)
    cron: process.env.REMOTE_SYNC_CRON || '*/10 * * * *',
  },
 
  auth: {
    jwtSecret: process.env.JWT_SECRET ,
    jwtExpires: process.env.JWT_EXPIRES || '12h',
    bcryptRounds: int(process.env.BCRYPT_ROUNDS, 10),
  },

  // --- Decouverte reseau : publie un nom de domaine mDNS au lieu d'une IP ---
  discovery: {
    enabled: bool(process.env.DISCOVERY_ENABLED, true),
    // Les clients joignent http://<serviceName>.local:<port> au lieu de l'IP
    serviceName: process.env.DISCOVERY_NAME || 'wiwitrack-escola',
    serviceType: process.env.DISCOVERY_TYPE || 'http',
  },

  cors: {
    // Liste blanche separee par des virgules ; vide = tout autoriser (LAN)
    origins: (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
  },
};

export default config;
