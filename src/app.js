import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRoutes from './routes/usersRoutes.js';
import sessionConfig from './config/sessionConfig.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();
connectDB();

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(session(sessionConfig));

// usar rutas
app.use('/api/users', userRoutes);
app.use('/dashboard', dashboardRoutes);

// Server
const PORT = process.env.PORT;
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