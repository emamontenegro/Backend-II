/**
 * Servidor HTTP + Express. Este módulo se importa DINÁMICAMENTE desde app.js
 * recién cuando Vault terminó de inyectar los secretos en process.env:
 * los imports de abajo (passport, session, db) leen variables al cargarse.
 */
import http from 'http';
import cluster from 'node:cluster';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import swaggerUi from 'swagger-ui-express';
import passport from './config/passport.js';
import sessionConfig from './config/sessionConfig.js';
import connectDB from './config/db.js';
import logger from './config/logger.js';
import { register, metricsMiddleware } from './config/metrics.js';
import { logGoogleOAuthStatus } from './config/googleOAuth.js';
import { isConfigRoute, dispatchConfigRoute } from './config/processConfig.js';
import swaggerSpec from './config/swagger.js';
import apiRoutes from './routes/index.js';
import { handleGoogleCallback } from './routes/authRoutes.js';

const PORT = Number(process.env.PORT) || 8080;

await connectDB();
const app = express();

// Métricas Prometheus — debe ir antes de las rutas para medir todos los requests
app.use(metricsMiddleware);

// Log de requests HTTP con Pino
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const msg = `${req.method} ${req.originalUrl} ${res.statusCode} — ${ms}ms`;
    if (res.statusCode >= 500)      logger.error(msg);
    else if (res.statusCode >= 400) logger.warn(msg);
    else                            logger.info(msg);
  });
  next();
});

app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// Swagger UI — documentación interactiva de la API
// Express 5 no acepta arrays en app.use(), swaggerUi.serve es un array → spread obligatorio
app.use('/api-docs', ...swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Backend 3 Course API — Docs',
  swaggerOptions: { persistAuthorization: true },
}));

// Endpoint de métricas para Prometheus / Grafana
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

app.use('/api/v1', apiRoutes);

app.get('/api/v1/users/auth/google/callback', handleGoogleCallback);

app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'API Backend-II',
    endpoints: {
      docs:           'GET /api-docs',
      metrics:        'GET /metrics',
      config:         'GET/POST /config',
      auth:           '/api/v1/auth',
      googleRegister: '/api/v1/auth/google/register',
      googleLogin:    '/api/v1/auth/google/login'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  logger.error({ err: err.message, stack: err.stack }, 'Error interno del servidor');
  res.status(500).json({
    message: 'Error interno del servidor',
    detalle: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Servidor HTTP nativo: /config (process.env) + API Express en el mismo puerto
const server = http.createServer(async (req, res) => {
  if (isConfigRoute(req.method, req.url)) {
    return dispatchConfigRoute(req, res);
  }
  app(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  const pid = process.pid;
  const wid = cluster.worker?.id ?? 'primary';
  logger.info({ pid, wid }, `Servidor corriendo en el puerto ${PORT}`);
  logger.info({ pid, wid }, `API Docs:  http://localhost:${PORT}/api-docs`);
  logger.info({ pid, wid }, `Métricas:  GET http://localhost:${PORT}/metrics`);
  logger.info({ pid, wid }, `Config:    GET/POST http://localhost:${PORT}/config`);
  logger.info({ pid, wid }, `Auth API:  http://localhost:${PORT}/api/v1`);
  logGoogleOAuthStatus();
});

const shutdown = () => {
  logger.info('Apagando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
