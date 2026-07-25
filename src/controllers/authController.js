import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import {
  signAuthToken,
  setAuthCookie,
  clearAuthCookie,
  getTokenExpiry
} from '../utils/authToken.js';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTS } from '../config/sessionConfig.js';
import logger from '../config/logger.js';

// ─── Typedefs JSDoc ──────────────────────────────────────────────────────────

/**
 * Documento de usuario de MongoDB (sin contraseña en respuestas).
 *
 * @typedef  {Object} AuthUser
 * @property {string} _id      - ObjectId de MongoDB
 * @property {string} username - Nombre de usuario único
 * @property {string} email    - Dirección de email
 * @property {string} role     - Rol del usuario: 'user' | 'admin'
 * @property {string} provider - Proveedor de autenticación: 'local' | 'google'
 */

/**
 * Request de Express enriquecido con el usuario autenticado.
 * Seteado por el middleware `isAuthenticated` después de validar el JWT.
 *
 * @typedef {import('express').Request & { user: AuthUser }} AuthRequest
 */

/**
 * Opciones para personalizar la respuesta de autenticación.
 *
 * @typedef  {Object}  AuthResponseOptions
 * @property {string}  [message='Login exitoso'] - Mensaje de respuesta
 * @property {number}  [status=200]              - Código HTTP de respuesta
 */

/**
 * Body esperado en el endpoint de registro.
 *
 * @typedef  {Object} RegisterBody
 * @property {string} username          - Nombre de usuario
 * @property {string} password          - Contraseña en texto plano (se hashea con bcrypt)
 * @property {string} [email]           - Email opcional (se genera uno por defecto si falta)
 */

// ─────────────────────────────────────────────────────────────────────────────

const bcryptRounds = Number(process.env.BCRYPT_ROUNDS) || 10;

/**
 * Registra un nuevo usuario local en la base de datos.
 * Hashea la contraseña con bcrypt antes de persistirla.
 *
 * @param {import('express').Request & { body: RegisterBody }} req
 * @param {import('express').Response} res - 201 con datos del usuario creado
 * @returns {Promise<void>}
 */
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

/**
 * Emite el JWT de autenticación y lo setea en una cookie httpOnly.
 * Usado tanto por el login local como por el callback de Google OAuth.
 *
 * @param {import('express').Request}  req     - Request de Express
 * @param {import('express').Response} res     - Response de Express
 * @param {AuthUser}                   user    - Documento Mongoose del usuario autenticado
 * @param {AuthResponseOptions}        [options={}]
 * @returns {void}
 */
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

/**
 * Cierra la sesión del usuario.
 * Limpia la cookie JWT, destruye la sesión de Passport (si existe)
 * y borra la cookie de sesión del servidor.
 *
 * @param {AuthRequest}                req - Requiere token válido (vía middleware isAuthenticated)
 * @param {import('express').Response} res - 200 confirmando el logout
 * @returns {Promise<void>}
 */
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
    logger.error({ error: error.message }, 'Error en logout');
    res.status(500).json({ message: 'Error al cerrar sesión' });
  }
};

/**
 * Devuelve el estado de la sesión activa del usuario.
 * No requiere token JWT — solo una sesión de Passport activa.
 *
 * @param {AuthRequest}                req - Usuario en req.user si está autenticado
 * @param {import('express').Response} res - 200 con datos de sesión / 401 si no hay sesión
 * @returns {void}
 */
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
