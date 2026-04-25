import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/users/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ 
        $or: [{ googleId: profile.id }, { username: profile.emails[0].value }] 
      });

      if (!user) {
        user = await User.create({
          googleId: profile.id,
          username: profile.emails[0].value,
        });
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));