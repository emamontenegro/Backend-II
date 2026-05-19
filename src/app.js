import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from './config/passport.js';
import sessionConfig from './config/sessionConfig.js';
import connectDB from './config/db.js';
import { logGoogleOAuthStatus } from './config/googleOAuth.js';
import apiRoutes from './routes/index.js';
import { handleGoogleCallback } from './routes/authRoutes.js';

connectDB();

const app = express();

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

// Callback legacy (solo si en Google Cloud seguís usando la URI con /users/)
app.get('/api/v1/users/auth/google/callback', handleGoogleCallback);

app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'API Backend-II',
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
  console.error(err);
  res.status(500).json({
    message: 'Error interno del servidor',
    detalle: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
const httpserver = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  logGoogleOAuthStatus();
});

const shutdown = () => {
  console.log('Shutting down server...');
  httpserver.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
