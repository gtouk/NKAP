import db from '../config/db.js';

async function loadRole(req, res) {
  const [rows] = await db.query(
    'SELECT role, status FROM users WHERE id = ?',
    [req.user.id]
  );
  const user = rows[0];
  if (!user) {
    res.status(401).json({ message: 'Utilisateur introuvable' });
    return null;
  }
  if (user.status === 'blocked') {
    res.status(403).json({ message: 'Compte bloqué' });
    return null;
  }
  req.user.role = user.role;
  return user.role;
}

export async function isSuperAdmin(req, res, next) {
  try {
    const role = await loadRole(req, res);
    if (!role) return;
    if (role !== 'superAdmin') {
      return res.status(403).json({ message: 'Accès réservé aux super administrateurs' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

export async function isAdmin(req, res, next) {
  try {
    const role = await loadRole(req, res);
    if (!role) return;
    if (role !== 'admin' && role !== 'superAdmin') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

export default { isSuperAdmin, isAdmin };
