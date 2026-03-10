import express from 'express';
import cookieParser from 'cookie-parser';
import { applySecurity } from './middleware/security';
import { healthCheck } from './config/database';
import { logger } from './utils/logger';
import authRoutes from './routes/auth';
import postsRoutes from './routes/posts';
import settingsRoutes from './routes/settings';
import webhookRoutes from './routes/webhook';

const app = express();
const port = parseInt(process.env.BACKEND_PORT || '3001', 10);

// Security
applySecurity(app);

// Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Health check
app.get('/api/health', async (req, res) => {
  const dbOk = await healthCheck();
  const status = dbOk ? 200 : 503;
  res.status(status).json({
    status: dbOk ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbOk ? 'connected' : 'disconnected',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/admin', settingsRoutes);
app.use('/api/webhook', webhookRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, '0.0.0.0', () => {
  logger.info('Backend started', { port, env: process.env.NODE_ENV });
});

export default app;
