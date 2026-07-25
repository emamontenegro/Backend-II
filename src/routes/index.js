import { Router } from 'express';
import authRoutes from './authRoutes.js';
import protectedRoutes from './protectedRoutes.js';
import adoptionRouter from './adoption.router.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/adoptions', adoptionRouter);
router.use('/', protectedRoutes);

export default router;
