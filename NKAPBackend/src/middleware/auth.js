import jwt from 'jsonwebtoken';

export const tokenBlacklist = new Set();

export function signAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET_REFRESH,
    { expiresIn: '7d' }
  );
}

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès non autorisé' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Accès non autorisé' });
  }

  if (tokenBlacklist.has(token)) {
    return res.status(403).json({ message: 'Session expirée' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Jeton invalide ou expiré' });
    }
    req.user = user;
    req.userId = user.id;
    req.token = token;
    next();
  });
};

export default authenticateJWT;
