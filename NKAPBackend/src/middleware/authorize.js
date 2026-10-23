import db from '../config/db.js';

const STAFF = ['support', 'compliance', 'finance', 'admin', 'superAdmin'];

export function permit(...roles) {
  return async (req, res, next) => {
    try {
      const [rows] = await db.query('SELECT role, status FROM users WHERE id = ?', [req.user.id]);
      const user = rows[0];
      if (!user || user.status === 'blocked') {
        return res.status(403).json({ message: 'Accès refusé' });
      }
      req.user.role = user.role;
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: 'Permission insuffisante' });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const staffOnly = permit(...STAFF);

export { STAFF };
