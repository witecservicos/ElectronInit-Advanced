/**
 * =====================================================================
 *  WIWITRACK ESCOLA  -  ASSEMBLAGE DE L'APPLICATION EXPRESS 5
 * =====================================================================
 */
import express from 'express';
import { corsMiddleware, helmetMiddleware, globalLimiter } from './middleware/security.js';
import { notFound, errorHandler } from './middleware/error.js';
import apiRoutes from './routes/index.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmetMiddleware());
  app.use(corsMiddleware());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(globalLimiter);

  // Sonde de sante (utilisee par la decouverte / les clients)
  app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
