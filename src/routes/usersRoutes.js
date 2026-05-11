import { Router } from "express";
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { User } from "../models/User.js";
import { login, logout, register, getCurrentUser } from "../controllers/usersController.js";
import { requireRole, isAuthenticated } from "../middlewares/auth.js";

const router = Router();

// Obtener todos los usuarios (Protegido para admins)
router.get('/', isAuthenticated, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find({}, '-password'); 
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Autenticación tradicional
router.post('/register', register);
router.post('/login', login);
router.post('/logout', isAuthenticated, logout);
router.get('/current', isAuthenticated, getCurrentUser);

// Google OAuth
router.get('/auth/google', passport.authenticate('google', { 
  scope: ['profile', 'email'], 
  session: false 
}));

router.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/api/v1/users/login', 
    session: false 
  }),
  (req, res) => {
    const token = jwt.sign(
      { 
        id: req.user._id, 
        username: req.user.username, 
        email: req.user.email, 
        role: req.user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('currentUser', token, {
      httpOnly: true,
      signed: true,
      maxAge: 3600000,
      sameSite: 'lax',
      path: '/'
    });

    res.send(`
      <script>
        alert("Autenticación exitosa. Redirigiendo...");
        window.location.href = "/api/v1/users/current";
      </script>
    `);
  }
);

export default router;