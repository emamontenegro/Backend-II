import passport from 'passport';
import { User } from '../models/User.js';
import localStrategy from '../strategies/localStrategy.js';
import googleStrategy from '../strategies/googleStrategy.js';

passport.use('local', localStrategy);
passport.use('google', googleStrategy);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
