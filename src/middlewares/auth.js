import jwt from 'jsonwebtoken';

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  if (req.cookies?.authToken) {
    return req.cookies.authToken;
  }
  return null;
};

export const isAuthenticated = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'No autenticado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = decoded;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'No autenticado. Token inválido o expirado.' });
  }
};

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado.' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'No autorizado. Permisos insuficientes.' });
  }
  next();
};

export const isAdmin = requireRole('admin');
