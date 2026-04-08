import dotenv from 'dotenv';
import session from 'express-session';
import MongoStore from 'connect-mongo';

dotenv.config();

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,

  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 60 * 60
  }),

  cookie: { 
    maxAge: 1000 * 60 * 60,
    httpOnly: true,
    secure: false
  }
};

export default sessionConfig;