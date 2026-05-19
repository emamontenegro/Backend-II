import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.js';
import { getGoogleOAuthConfig } from '../config/googleOAuth.js';

const findGoogleUser = async (profile) => {
  const email = profile.emails?.[0]?.value;
  return User.findOne({
    $or: [
      { googleSubjectId: profile.id },
      ...(email ? [{ username: email }, { email }] : [])
    ]
  });
};

const { clientID, clientSecret, callbackURL } = getGoogleOAuthConfig();

export default new GoogleStrategy(
  {
    clientID,
    clientSecret,
    callbackURL,
    passReqToCallback: true,
    authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenURL: 'https://oauth2.googleapis.com/token'
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const intent = req.session?.oauthIntent || 'login';
      const email = profile.emails?.[0]?.value;
      let user = await findGoogleUser(profile);

      if (intent === 'register') {
        if (user) {
          return done(null, false, {
            status: 409,
            message: 'Ya tenés una cuenta con este Google. Usá login con Google.'
          });
        }

        user = await User.create({
          googleSubjectId: profile.id,
          username: email || `google_${profile.id}`,
          email
        });

        return done(null, user);
      }

      // login
      if (!user) {
        return done(null, false, {
          status: 404,
          message: 'No tenés cuenta con Google. Registrate primero en /api/v1/auth/google/register'
        });
      }

      if (!user.googleSubjectId) {
        user.googleSubjectId = profile.id;
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
);
