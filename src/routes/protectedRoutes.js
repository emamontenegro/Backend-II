import { Router } from 'express';
import { isAuthenticated, requireRole } from '../middlewares/auth.js';
import { getSession } from '../controllers/authController.js';
import { getProfile, getAdmin } from '../controllers/profileController.js';

const router = Router();

router.get('/session', getSession);
router.get('/profile', isAuthenticated, getProfile);
router.get('/admin', isAuthenticated, requireRole('admin'), getAdmin);

export default router;
