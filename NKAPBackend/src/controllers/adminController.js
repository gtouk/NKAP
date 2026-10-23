import bcrypt from 'bcrypt';
import db from '../config/db.js';

function splitName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || 'Admin';
  const lastName = parts.slice(1).join(' ') || 'NKAP';
  return { firstName, lastName };
}

export const createAdmin = async (req, res, next) => {
  const { name, email, phone, password, passwordConfirm, role } = req.body;

  if (!name || !email || !phone || !password || !passwordConfirm) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }
  if (password !== passwordConfirm) {
    return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
  }
  if (!['support', 'compliance', 'finance', 'admin', 'superAdmin'].includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide' });
  }
  if (role !== 'admin' && req.user.role !== 'superAdmin') {
    return res.status(403).json({ message: 'Seul un super administrateur peut créer ce rôle' });
  }
  if (role === 'superAdmin' && req.user.role !== 'superAdmin') {
    return res.status(403).json({ message: 'Seul un super administrateur peut créer un super administrateur' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email déjà utilisé' });
    }

    if (role === 'superAdmin') {
      const [countRows] = await db.query(
        'SELECT COUNT(*) AS count FROM users WHERE role = ?',
        ['superAdmin']
      );
      if (Number(countRows[0].count) >= 2) {
        return res.status(400).json({ message: 'Nombre maximum de super administrateurs atteint (2)' });
      }
    }

    const { firstName, lastName } = splitName(name);
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users SET ?', {
      username: email.slice(0, 191),
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role,
      status: 'active',
      country: 'Canada',
    });

    const label = role === 'superAdmin' ? 'Super administrateur créé' : 'Administrateur créé';
    res.status(201).json({ message: label });
  } catch (error) {
    next(error);
  }
};
