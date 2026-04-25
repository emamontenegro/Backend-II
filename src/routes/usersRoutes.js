import { Router } from "express";
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { User } from "../models/User.js";
import { login, logout, register, getCurrentUser } from "../controllers/usersController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = Router();

// Obtener todos los usuarios 
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const users = await User.find({}, '-password'); 
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Registro, Login, Logout
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Endpoint para obtener el usuario actual autenticado
router.get('/current', isAuthenticated, getCurrentUser);

// Rutas de autenticación con Google OAuth

// Iniciar el flujo
router.get('/auth/google', passport.authenticate('google', { 
  scope: ['profile', 'email'], 
  session: false 
}));

// Callback de Google
router.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/api/users/login', 
    session: false 
  }),
  (req, res) => {
    // Generamos un token JWT
    const token = jwt.sign(
      { id: req.user._id, username: req.user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Guardamos el token en la COOKIE para el navegador
    res.cookie('currentUser', token, {
      httpOnly: true,
      signed: true,
      maxAge: 3600000,
      sameSite: 'lax',
      path: '/'
    });

    // Enviamos una respuesta que redirige al usuario a la página de perfil o dashboard
    res.send(`
      <script>
        alert("Autenticación exitosa. Redirigiendo...");
        window.location.href = "/api/users/current";
      </script>
    `);
  }
);

export default router;