import logger from './logger.js';

export const getGoogleOAuthConfig = () => {
  const clientID     = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const port         = Number(process.env.PORT) || 8080;
  const callbackURL  = (
    process.env.GOOGLE_CALLBACK_URL?.trim() ||
    `http://localhost:${port}/api/v1/auth/google/callback`
  ).replace(/\/$/, '');

  return { clientID, clientSecret, callbackURL };
};

export const logGoogleOAuthStatus = () => {
  const { clientID, clientSecret, callbackURL } = getGoogleOAuthConfig();

  if (!clientID || !clientSecret) {
    logger.error('Google OAuth: GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET no están configurados');
    return;
  }

  if (!clientID.endsWith('.apps.googleusercontent.com')) {
    logger.warn('GOOGLE_CLIENT_ID debería terminar en .apps.googleusercontent.com (cliente tipo Web)');
  }

  logger.info(`Google OAuth activo — callback: ${callbackURL}`);
};
