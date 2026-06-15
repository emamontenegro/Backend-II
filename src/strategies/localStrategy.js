import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';

export default new LocalStrategy(
  { usernameField: 'username', passwordField: 'password' },
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user?.password) {
        return done(null, false, { message: 'Credenciales inválidas' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Credenciales inválidas' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
);
