/**
 * Servidor HTTP + Express. Este módulo se importa DINÁMICAMENTE desde app.js
 * recién cuando Vault terminó de inyectar los secretos en process.env:
 * los imports de abajo (passport, session, db) leen variables al cargarse.
 */
import http from 'http';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from './config/passport.js';
import sessionConfig from './config/sessionConfig.js';
import connectDB from './config/db.js';
import logger from './config/logger.js';
import { logGoogleOAuthStatus } from './config/googleOAuth.js';
import {
  isConfigRoute,
  dispatchConfigRoute
} from './config/processConfig.js';
import apiRoutes from './routes/index.js';
import { handleGoogleCallback } from './routes/authRoutes.js';

const PORT = Number(process.env.PORT) || 8080;

await connectDB();
const app = express();

// Middleware de log de requests HTTP
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';
    logger.log(level, `${req.method} ${req.originalUrl} ${res.statusCode} — ${ms}ms`);
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

app.use('/api/v1', apiRoutes);

app.get('/api/v1/users/auth/google/callback', handleGoogleCallback);

app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'API Backend-II',
    config: { get: 'GET /config', set: 'POST /config { "level": "high"|"low" }' },
    googleRegister: '/api/v1/auth/google/register',
    googleLogin: '/api/v1/auth/google/login'
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  logger.error('Error interno del servidor', { error: err.message, stack: err.stack });
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

server.listen(PORT, () => {
  logger.info(`Servidor corriendo en el puerto ${PORT}`);
  logger.info(`Config:   GET/POST http://localhost:${PORT}/config`);
  logger.info(`Auth API: http://localhost:${PORT}/api/v1`);
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
