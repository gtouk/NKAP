import db from '../config/db.js';

const checkUserStatus = async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Accès non autorisé' });
  }

  try {
    const [rows] = await db.query(
      'SELECT status, blockedUntil FROM users WHERE id = ?',
      [userId]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    if (user.status === 'blocked') {
      if (user.blockedUntil && new Date() >= new Date(user.blockedUntil)) {
        await db.query(
          'UPDATE users SET status = ?, blockedUntil = NULL WHERE id = ?',
          ['active', userId]
        );
      } else {
        return res.status(403).json({ message: 'Compte bloqué' });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

export default checkUserStatus;
