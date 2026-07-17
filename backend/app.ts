import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mainRouter from './routes/mainRouter';
import { errorHandler } from './core/middleware/errorHandler';
import { env } from './config';
import { corsOptions } from './config/cors';
import { initializeRedis } from './infrastructure/redis';
import { logger } from './core/logger';

// Initialize core services if needed
import './infrastructure/firebase';
import { liveSyncService } from './services/liveSync.service';
import './modules/interaction-engine/worker';
import { attendanceAnalyticsWorker } from './modules/analytics/attendance.worker';

const app = express();

import { requestIdMiddleware } from './core/middleware/requestId';
app.use(requestIdMiddleware);

// Helmet: disable global frameguard so /player/:token can set its own
// per-response frame-ancestors CSP (it allows localhost:* in dev and *.nermai.com in prod).
// All other Helmet protections remain active.
app.use(helmet({
  frameguard: false,
  contentSecurityPolicy: false,
}));

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { globalRateLimiter } from './core/middleware/rateLimiter';
app.use(globalRateLimiter);

export const API_VERSION = 'v1';

// Metrics endpoint (Prometheus/OpenTelemetry stub)
app.get('/metrics', (req, res) => {
  // In the future, prom-client can hook in here
  res.set('Content-Type', 'text/plain');
  res.send('# HELP system_health Status of system\n# TYPE system_health gauge\nsystem_health 1\n');
});

// API Aggregation Route
app.use(`/api/${API_VERSION}`, mainRouter); // New standard
app.use('/api', mainRouter); // Temporary compatibility alias

// Player Route
import { renderPlayer } from './modules/courses/player';
app.get('/player/:token', renderPlayer);

// Global Error Handler
app.use(errorHandler);

const PORT = env.PORT || 3000;

async function startServer() {
  await initializeRedis();
  liveSyncService.init();
  attendanceAnalyticsWorker.start();

  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT} in ${env.NODE_ENV} mode.`);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
