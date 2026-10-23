import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { signAccessToken, signRefreshToken } from '../middleware/auth.js';
import { notifyUser } from '../services/notify.js';
import { HttpError, sendError } from '../utils/httpError.js';

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

async function issueCode(user) {
  const code = String(crypto.randomInt(100000, 999999));
  const expires = new Date(Date.now() + 10 * 60 * 1000);
  await db.query(
    'UPDATE users SET mfa_code_hash = ?, mfa_code_expires = ? WHERE id = ?',
    [hashCode(code), expires, user.id]
  );
  await notifyUser(user, 'mfa_code', `Code : ${code}`);
  return code;
}

export const setupMfa = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!rows[0]) throw new HttpError(404, 'Utilisateur introuvable');
    const code = await issueCode(rows[0]);
    const body = { message: 'Code envoyé' };
    if (process.env.NODE_ENV !== 'production') body.devCode = code;
    res.json(body);
  } catch (error) {
    sendError(res, error, next);
  }
};

export const confirmMfa = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    if (!user || user.mfa_code_hash !== hashCode(req.body.code) || new Date(user.mfa_code_expires) < new Date()) {
      return res.status(401).json({ message: 'Code invalide ou expiré' });
    }
    await db.query(
      'UPDATE users SET mfa_enabled = 1, mfa_code_hash = NULL, mfa_code_expires = NULL WHERE id = ?',
      [user.id]
    );
    res.json({ message: 'Authentification à deux facteurs activée' });
  } catch (error) {
    next(error);
  }
};

export const disableMfa = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const valid = rows[0] && await bcrypt.compare(req.body.password || '', rows[0].password);
    if (!valid) return res.status(401).json({ message: 'Mot de passe incorrect' });
    await db.query('UPDATE users SET mfa_enabled = 0 WHERE id = ?', [req.user.id]);
    res.json({ message: 'Authentification à deux facteurs désactivée' });
  } catch (error) {
    next(error);
  }
};

export async function beginMfa(user) {
  const code = await issueCode(user);
  const mfaToken = jwt.sign(
    { id: user.id, purpose: 'mfa' },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
  const body = { mfaRequired: true, mfaToken };
  if (process.env.NODE_ENV !== 'production') body.devCode = code;
  return body;
}

export const verifyMfa = async (req, res, next) => {
  try {
    const payload = jwt.verify(req.body.mfaToken || '', process.env.JWT_SECRET);
    if (payload.purpose !== 'mfa') return res.status(401).json({ message: 'Jeton invalide' });
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [payload.id]);
    const user = rows[0];
    if (!user || user.mfa_code_hash !== hashCode(req.body.code) || new Date(user.mfa_code_expires) < new Date()) {
      return res.status(401).json({ message: 'Code invalide ou expiré' });
    }
    await db.query(
      'UPDATE users SET mfa_code_hash = NULL, mfa_code_expires = NULL WHERE id = ?',
      [user.id]
    );
    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);
    res.json({
      message: 'Connexion réussie',
      token,
      refreshToken,
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      role: user.role || 'user',
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Jeton invalide ou expiré' });
    }
    next(error);
  }
};
