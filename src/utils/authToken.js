import jwt from 'jsonwebtoken';

const isProduction = process.env.NODE_ENV === 'production';

export const AUTH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  maxAge: Number(process.env.SESSION_TIMEOUT) || 3600000,
  path: '/'
};

export const signAuthToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

export const setAuthCookie = (res, token) => {
  res.cookie('authToken', token, AUTH_COOKIE_OPTS);
};

export const clearAuthCookie = (res) => {
  res.clearCookie('authToken', AUTH_COOKIE_OPTS);
};
