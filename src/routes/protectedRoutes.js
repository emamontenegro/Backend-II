import { Router } from 'express';
import { isAuthenticated, requireRole } from '../middlewares/auth.js';
import { getSession } from '../controllers/authController.js';
import { getProfile, getAdmin } from '../controllers/profileController.js';

const router = Router();

/**
 * @openapi
 * /api/v1/session:
 *   get:
 *     tags:
 *       - Usuarios
 *     summary: Estado de la sesión actual
 *     description: Devuelve si hay una sesión activa y los datos básicos del usuario logueado, sin requerir token.
 *     responses:
 *       200:
 *         description: Estado de sesión
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authenticated:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
router.get('/session', getSession);

/**
 * @openapi
 * /api/v1/profile:
 *   get:
 *     tags:
 *       - Usuarios
 *     summary: Perfil del usuario autenticado
 *     description: Retorna los datos del usuario actualmente logueado. Requiere JWT válido.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del perfil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: No autenticado — token ausente o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', isAuthenticated, getProfile);

/**
 * @openapi
 * /api/v1/admin:
 *   get:
 *     tags:
 *       - Usuarios
 *     summary: Panel de administración (solo admin)
 *     description: Acceso exclusivo para usuarios con rol `admin`. Requiere JWT válido con rol admin.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del panel de administración
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bienvenido al panel de administración
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acceso denegado — rol insuficiente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/admin', isAuthenticated, requireRole('admin'), getAdmin);

export default router;
