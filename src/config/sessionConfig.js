import dotenv from 'dotenv';

dotenv.config();

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 900000,
    httpOnly: true,
    secure: false
  }
};

export default sessionConfig;