import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.js';

export default new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/v1/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      let user = await User.findOne({
        $or: [
          { googleSubjectId: profile.id },
          ...(email ? [{ username: email }, { email }] : [])
        ]
      });

      if (!user) {
        user = await User.create({
          googleSubjectId: profile.id,
          username: email || `google_${profile.id}`,
          email
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
);
