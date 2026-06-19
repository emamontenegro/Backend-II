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

router.get('/google/register', startGoogleOAuth('register'));
router.get('/google/login', startGoogleOAuth('login'));
router.get('/google', startGoogleOAuth('login'));

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
