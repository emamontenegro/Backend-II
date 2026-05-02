import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth.js';

const router = Router();

router.get('/', isAuthenticated, (req, res) => {
  res.send(`Bienvenido ${req.user.username}. Tu rol es ${req.user.role}. Esta es tu dashboard.`);
});

export default router;