import { Router } from 'express';
import usersRoutes from './usersRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';

const router = Router();

// Todas las rutas de usuarios como registro, login y current
router.use('/users', usersRoutes);

// Todas las rutas del dashboard como profile, settings, etc.
router.use('/dashboard', dashboardRoutes);

export default router;