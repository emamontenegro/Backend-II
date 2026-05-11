import jwt from 'jsonwebtoken';

export const isAuthenticated = (req, res, next) => {
  let token = null;

  // Buscar en el Header Authorization
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } 
  // Si no hay header, buscar en la cookie firmada
  else if (req.signedCookies && req.signedCookies.currentUser) {
    token = req.signedCookies.currentUser;
  }

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No hay token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido o expirado.' });
  }
};

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Acceso denegado. No hay token.' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Acceso denegado. Permisos insuficientes.' });
  }
  next();
};

export const isAdmin = requireRole('admin');