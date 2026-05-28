import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import votesRoutes from './routes/votes.routes.js';
import electionsRoutes from './routes/elections.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { isChainConfigured } from './blockchain/blockchainClient.js';
import { checkDatabaseConnection, isDatabaseEnabled } from './db/pool.js';
import { config } from './config.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json());

  app.get('/api/health', async (_req, res) => {
    const db = isDatabaseEnabled() ? await checkDatabaseConnection() : { ok: false, reason: 'not_configured' };
    res.json({
      ok: true,
      enrollmentSource: config.enrollmentSource,
      database: db.ok ? 'connected' : db.reason || 'not_configured',
      blockchain: isChainConfigured() ? 'configured' : 'not_configured',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/votes', votesRoutes);
  app.use('/api/elections', electionsRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(errorHandler);
  return app;
}
