import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import passport from 'passport';
import connectDB from './config/db.js';
import userRoutes from './routes/usersRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import './config/passport.js';

dotenv.config();
connectDB();

const app = express();

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