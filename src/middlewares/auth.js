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

  if (!token.includes('.') || token.split('.').length !== 3) {
    return res.status(401).json({
      message:
        'Token inválido. Copiá el campo "token" del JSON del callback (empieza con eyJ...). No uses el "code" de la URL de Google.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = decoded;
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado. Volvé a iniciar sesión.' });
    }
    return res.status(401).json({
      message: 'Token inválido o firma incorrecta.',
      ayuda: 'Usá el "token" del JSON tras login/register. En Postman: Authorization → Bearer Token → solo el JWT.'
    });
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
