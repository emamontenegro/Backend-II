import { Router } from 'express';
import passport from '../config/passport.js';
import { isAuthenticated } from '../middlewares/auth.js';
import {
  register,
  issueAuthResponse,
  logout
} from '../controllers/authController.js';
import { signAuthToken, setAuthCookie } from '../utils/authToken.js';

const router = Router();

router.post('/register', register);

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        message: info?.message || 'Credenciales inválidas'
      });
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }
      issueAuthResponse(req, res, user);
    });
  })(req, res, next);
});

router.post('/logout', isAuthenticated, logout);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/api/v1/auth/google/failure'
  }),
  (req, res) => {
    const token = signAuthToken(req.user);
    setAuthCookie(res, token);

    res.status(200).json({
      message: 'Autenticación con Google exitosa',
      token,
      user: {
        userId: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  }
);

router.get('/google/failure', (req, res) => {
  res.status(401).json({ message: 'Autenticación con Google fallida' });
});

export default router;
