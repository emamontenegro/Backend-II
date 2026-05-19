export const getGoogleOAuthConfig = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const port = process.env.PORT || 3000;
  const callbackURL = (
    process.env.GOOGLE_CALLBACK_URL?.trim() ||
    `http://localhost:${port}/api/v1/auth/google/callback`
  ).replace(/\/$/, '');

  return { clientID, clientSecret, callbackURL };
};

export const logGoogleOAuthStatus = () => {
  const { clientID, clientSecret, callbackURL } = getGoogleOAuthConfig();

  if (!clientID || !clientSecret) {
    console.error('❌ Google OAuth: definí GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env');
    return;
  }

  if (!clientID.endsWith('.apps.googleusercontent.com')) {
    console.warn(
      '⚠️ GOOGLE_CLIENT_ID debería terminar en .apps.googleusercontent.com (cliente tipo Web)'
    );
  }

  console.log('🔗 Google OAuth — pegá esta URI en Google Cloud → Credenciales → URIs de redirección:');
  console.log(`   ${callbackURL}`);
};
