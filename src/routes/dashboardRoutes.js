import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth.js';

const router = Router();

router.get('/', isAuthenticated, (req, res) => {
  res.send(`Welcome ${req.session.user.username}`);
});

export default router;