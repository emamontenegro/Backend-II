import { Router } from 'express';
import passport from '../config/passport.js';
import { isAuthenticated } from '../middlewares/auth.js';
import {
  register,
  issueAuthResponse,
  logout
} from '../controllers/authController.js';
import { getGoogleOAuthConfig } from '../config/googleOAuth.js';
import logger from '../config/logger.js';

const router = Router();

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

const startGoogleOAuth = (intent) => (req, res, next) => {
  req.session.oauthIntent = intent;
  req.session.save((err) => {
    if (err) return next(err);
    passport.authenticate('google', { scope: GOOGLE_SCOPES })(req, res, next);
  });
};

export const handleGoogleCallback = (req, res, next) => {
  if (req.query.error) {
    return res.status(400).json({
      message: 'Google rechazó la autorización',
      error: req.query.error,
      detalle: req.query.error_description || null
    });
  }

  if (!req.query.code) {
    return res.status(400).json({
      message:
        'Falta el código de Google. Entrá por /api/v1/auth/google/register o /login, no abras /callback directo.'
    });
  }

  const intent = req.session?.oauthIntent || 'login';

  passport.authenticate('google', (err, user, info) => {
    delete req.session.oauthIntent;

    if (err) {
      logger.error({ error: err.message }, 'Google OAuth callback error');
      return res.status(400).json({
        message: 'Error al validar el código de Google',
        detalle: err.message
      });
    }

    if (!user) {
      const status = info?.status || 401;
      return res.status(status).json({
        message: info?.message || 'Autenticación con Google fallida'
      });
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }

      const isRegister = intent === 'register';
      issueAuthResponse(req, res, user, {
        status: isRegister ? 201 : 200,
        message: isRegister
          ? 'Registro con Google exitoso'
          : 'Login con Google exitoso'
      });
    });
  })(req, res, next);
};

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Registrar nuevo usuario
 *     description: Crea un usuario con email y contraseña. Devuelve JWT en cookie httpOnly y en el body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Giulio Montenegro
 *               email:
 *                 type: string
 *                 format: email
 *                 example: giulio@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "mi_password_segura"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Datos inválidos o email ya registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login con email y contraseña
 *     description: Autentica al usuario con Passport Local Strategy. Devuelve JWT en cookie httpOnly y en el body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: giulio@example.com
 *               password:
 *                 type: string
 *                 example: "mi_password_segura"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Cerrar sesión
 *     description: Invalida la sesión del servidor y limpia la cookie JWT. Requiere estar autenticado.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sesión cerrada correctamente
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', isAuthenticated, logout);

/**
 * @openapi
 * /api/v1/auth/google/register:
 *   get:
 *     tags:
 *       - Google OAuth
 *     summary: Iniciar registro con Google
 *     description: Redirige al flujo OAuth 2.0 de Google para crear una cuenta nueva. Abrí esta URL en el navegador.
 *     responses:
 *       302:
 *         description: Redirige a Google para autorización
 *
 * /api/v1/auth/google/login:
 *   get:
 *     tags:
 *       - Google OAuth
 *     summary: Iniciar login con Google
 *     description: Redirige al flujo OAuth 2.0 de Google para autenticarse. Abrí esta URL en el navegador.
 *     responses:
 *       302:
 *         description: Redirige a Google para autorización
 */
router.get('/google/register', startGoogleOAuth('register'));
router.get('/google/login', startGoogleOAuth('login'));
router.get('/google', startGoogleOAuth('login'));

/**
 * @openapi
 * /api/v1/auth/google/callback:
 *   get:
 *     tags:
 *       - Google OAuth
 *     summary: Callback de Google OAuth (no llamar directo)
 *     description: >
 *       Google redirige aquí después de la autorización. No llamar manualmente desde Postman.
 *       Si recibís error 400, revisá que el Callback URL en Google Cloud coincida exactamente con
 *       `http://localhost:3000/api/v1/auth/google/callback`.
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Código de autorización generado por Google
 *     responses:
 *       200:
 *         description: Login con Google exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       201:
 *         description: Registro con Google exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Google rechazó la autorización o falta el código
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/google/callback', handleGoogleCallback);

router.get('/google/failure', (req, res) => {
  res.status(401).json({ message: 'Autenticación con Google fallida' });
});

router.get('/google/check', (req, res) => {
  const { clientID, clientSecret, callbackURL } = getGoogleOAuthConfig();
  res.json({
    ok: !!(clientID && clientSecret),
    clientIdConfigured: !!clientID,
    clientSecretConfigured: !!clientSecret,
    clientIdLooksValid: clientID?.endsWith('.apps.googleusercontent.com') ?? false,
    callbackURL,
    enGoogleCloudDebeCoincidir: callbackURL,
    urisInvalidasComunes: [
      'http://localhost:3000/api/v1/users/auth/google/callback',
      'https://localhost:3000/api/v1/auth/google/callback'
    ],
    uriCorrecta: 'http://localhost:3000/api/v1/auth/google/callback'
  });
});

// Muestra la URL exacta que Google recibe (para comparar con "Detalles del error")
router.get('/google/debug-auth', (req, res) => {
  const { clientID, callbackURL } = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientID || 'FALTA_CLIENT_ID',
    redirect_uri: callbackURL,
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' ')
  });

  res.json({
    instruccion:
      'Abrí authorizationUrl. Si Google da 400, tocá "Detalles del error" y compará redirect_uri con enGoogleCloudDebeCoincidir.',
    callbackURL,
    clientIdTerminaEn: clientID?.slice(-30) ?? 'NO_CONFIGURADO',
    authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  });
});

export default router;
