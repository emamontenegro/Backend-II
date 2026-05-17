import session from 'express-session';
import MongoStore from 'connect-mongo';

const isProduction = process.env.NODE_ENV === 'production';
const maxAge = Number(process.env.SESSION_TIMEOUT) || 3600000;

export const SESSION_COOKIE_NAME = 'sid';

export const SESSION_COOKIE_OPTS = {
  path: '/',
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax'
};

const sessionConfig = {
  name: SESSION_COOKIE_NAME,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: Math.floor(maxAge / 1000)
  }),
  cookie: {
    maxAge,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax'
  }
};

export default sessionConfig;
