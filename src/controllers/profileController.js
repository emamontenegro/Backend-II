import { User } from '../models/User.js';

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
 *
 * @typedef {import('express').Request & { user: AuthUser }} AuthRequest
 */

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve el perfil del usuario autenticado.
 * Obtiene los datos frescos desde MongoDB (sin la contraseña).
 *
 * @param {AuthRequest}                req - req.user.userId seteado por isAuthenticated
 * @param {import('express').Response} res - 200 con datos del perfil / 401 si no se encuentra
 * @returns {Promise<void>}
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'No autenticado. Usuario no encontrado.' });
    }

    res.status(200).json({
      message: 'Perfil del usuario autenticado',
      user: {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el perfil' });
  }
};

/**
 * Panel de administración — devuelve la lista completa de usuarios.
 * Solo accesible con rol `admin` (verificado por requireRole en la ruta).
 *
 * @param {AuthRequest}                req - req.user.role debe ser 'admin'
 * @param {import('express').Response} res - 200 con array de usuarios (sin passwords)
 * @returns {Promise<void>}
 */
export const getAdmin = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.status(200).json({
      message: 'Panel de administración',
      role: req.user.role,
      users
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener datos de admin' });
  }
};
