import { Router } from 'express';
import authRoutes from './authRoutes.js';
import protectedRoutes from './protectedRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/', protectedRoutes);

export default router;
