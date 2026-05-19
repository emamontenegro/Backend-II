import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import {
  signAuthToken,
  setAuthCookie,
  clearAuthCookie,
  getTokenExpiry
} from '../utils/authToken.js';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTS } from '../config/sessionConfig.js';

const bcryptRounds = Number(process.env.BCRYPT_ROUNDS) || 10;

export const register = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, bcryptRounds);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      email: email || `${username}@example.com`
    });

    res.status(201).json({
      message: 'Usuario creado con éxito',
      user: {
        userId: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el usuario' });
  }
};

export const issueAuthResponse = (req, res, user, options = {}) => {
  const { message = 'Login exitoso', status = 200 } = options;
  const token = signAuthToken(user);
  setAuthCookie(res, token);

  res.status(status).json({
    message,
    token,
    expiresAt: getTokenExpiry(token),
    user: {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
};

export const logout = async (req, res) => {
  try {
    clearAuthCookie(res);

    // Solo Passport logout si hay sesión de servidor (evita 500 cuando
    // Postman envía solo Bearer y isAuthenticated puso req.user desde JWT).
    if (req.session?.passport?.user) {
      await new Promise((resolve, reject) => {
        req.logout((err) => (err ? reject(err) : resolve()));
      });
    }

    if (req.session) {
      await new Promise((resolve, reject) => {
        req.session.destroy((err) => (err ? reject(err) : resolve()));
      });
    }

    res.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTS);

    res.status(200).json({
      message: 'Logout exitoso. Sesión destruida y cookie eliminada.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error al cerrar sesión' });
  }
};

export const getSession = (req, res) => {
  if (!req.isAuthenticated?.()) {
    return res.status(401).json({ message: 'No autenticado. No hay sesión activa.' });
  }

  res.status(200).json({
    message: 'Sesión activa',
    session: {
      sessionId: req.sessionID,
      expires: req.session.cookie?.expires,
      maxAge: req.session.cookie?.maxAge
    },
    user: {
      userId: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
};
