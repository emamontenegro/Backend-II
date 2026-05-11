import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import connectDB from './config/db.js';
import userRoutes from './routes/usersRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import './config/passport.js';

connectDB();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Reemplazá con la URL de tu frontend en desarrollo
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Middlewares
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET)); 
app.use(passport.initialize()); 

// Rutas
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 3000;
const httpserver = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const shutdown = () => {
  console.log('Shutting down server...');
  httpserver.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);