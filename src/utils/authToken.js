import jwt from 'jsonwebtoken';

const isProduction = process.env.NODE_ENV === 'production';

export const getJwtExpiresIn = () =>
  process.env.JWT_EXPIRES_IN || (isProduction ? '1h' : '24h');

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
    { expiresIn: getJwtExpiresIn() }
  );

export const getTokenExpiry = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) return null;
  return new Date(decoded.exp * 1000).toISOString();
};

export const setAuthCookie = (res, token) => {
  res.cookie('authToken', token, AUTH_COOKIE_OPTS);
};

export const clearAuthCookie = (res) => {
  res.clearCookie('authToken', AUTH_COOKIE_OPTS);
};
