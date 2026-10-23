import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import db from '../config/db.js';
import { signAccessToken, signRefreshToken, tokenBlacklist } from '../middleware/auth.js';
import { sendMailMessage } from '../utils/mailer.js';
import { notifyUser } from '../services/notify.js';
import { beginMfa } from './mfaController.js';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function formatDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function toPublicUser(row) {
  if (!row) return null;
  const {
    password,
    refresh_token,
    reset_token,
    reset_token_expires,
    mfa_code_hash,
    mfa_code_expires,
    ...rest
  } = row;

  return {
    ...rest,
    name: `${rest.firstName || ''} ${rest.lastName || ''}`.trim() || rest.username || rest.email,
    birthDate: formatDate(rest.birthDate),
    created_at: rest.created_at instanceof Date ? rest.created_at.toISOString() : rest.created_at,
  };
}

async function resolveBlock(user) {
  if (user.status !== 'blocked') return user;
  if (user.blockedUntil && new Date() >= new Date(user.blockedUntil)) {
    await db.query(
      'UPDATE users SET status = ?, blockedUntil = NULL WHERE id = ?',
      ['active', user.id]
    );
    user.status = 'active';
    user.blockedUntil = null;
  }
  return user;
}

export const register = async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    country,
    gender,
    birthDate,
    street,
    city,
    postalCode,
    phone,
    password,
  } = req.body;
  const confirmPassword = req.body.confirmPassword || req.body.passwordConfirm;

  if (!firstName || !lastName || !email || !gender || !birthDate || !country || !street || !city || !postalCode || !password || !confirmPassword || !phone) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'Email invalide' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query('INSERT INTO users SET ?', {
      username: email.slice(0, 191),
      firstName,
      lastName,
      email,
      country,
      birthDate,
      gender,
      street,
      city,
      postalCode,
      phone,
      password: hashedPassword,
      role: 'user',
      status: 'active',
    });

    const user = {
      id: result.insertId,
      email,
      role: 'user',
      firstName,
      lastName,
    };
    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

    await notifyUser({ id: user.id, email }, 'account_created');

    return res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      refreshToken,
      id: user.id,
      firstName,
      lastName,
      role: 'user',
      status: 'active',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const identifier = String(req.body.email || req.body.phone || '').trim();
  const { password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email ou téléphone, et mot de passe, sont requis' });
  }

  try {
    const [results] = await db.query(
      'SELECT * FROM users WHERE email = ? OR phone = ?',
      [identifier, identifier]
    );
    if (results.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = await resolveBlock(results[0]);
    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Compte bloqué' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    if (user.mfa_enabled) {
      return res.status(200).json(await beginMfa(user));
    }

    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

    return res.status(200).json({
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
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.token) tokenBlacklist.add(req.token);
    if (req.user?.id) {
      await db.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user.id]);
    }
    res.status(200).json({ message: 'Déconnexion réussie' });
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, firstName, lastName, country, gender, birthDate, street, city, postalCode,
              status, email, phone, role, wallet, created_at, kyc_status, mfa_enabled
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(toPublicUser(rows[0]));
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (req, res, next) => {
  const { firstName, lastName, email, phone, street, city, postalCode, country } = req.body;
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ message: 'Le nom et l\'email sont obligatoires' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'Email invalide' });
  }

  try {
    const [dupes] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id <> ?',
      [email, req.user.id]
    );
    if (dupes.length > 0) {
      return res.status(409).json({ message: 'Email déjà utilisé' });
    }

    const [result] = await db.query(
      `UPDATE users
       SET firstName = ?, lastName = ?, email = ?, phone = ?, street = ?, city = ?, postalCode = ?, country = ?, username = ?
       WHERE id = ?`,
      [firstName, lastName, email, phone || null, street || null, city || null, postalCode || null, country || null, email.slice(0, 191), req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.status(200).json({ message: 'Profil mis à jour' });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, firstName, lastName, email, phone, role, status, country, city, created_at, username
       FROM users ORDER BY created_at DESC`
    );
    res.status(200).json(rows.map(toPublicUser));
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  const { refreshToken: token } = req.body;
  if (!token) {
    return res.status(401).json({ message: 'Refresh token requis' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET_REFRESH);
    const [rows] = await db.query(
      'SELECT * FROM users WHERE id = ? AND refresh_token = ?',
      [payload.id, token]
    );
    if (!rows.length) {
      return res.status(403).json({ message: 'Refresh token invalide' });
    }
    const user = await resolveBlock(rows[0]);
    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Compte bloqué' });
    }
    const accessToken = signAccessToken(user);
    res.status(200).json({ accessToken, token: accessToken });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Refresh token invalide ou expiré' });
    }
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email requis' });
  }

  try {
    const [rows] = await db.query('SELECT id, email, firstName FROM users WHERE email = ?', [email]);
    const generic = { message: 'Si ce compte existe, un lien de réinitialisation a été envoyé.' };

    if (!rows.length) {
      return res.status(200).json(generic);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await db.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [tokenHash, expires, rows[0].id]
    );

    const client = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
    const resetLink = `${client}/reset-password/${rawToken}`;
    const sent = await sendMailMessage({
      to: email,
      subject: 'Réinitialisation de votre mot de passe NKAP',
      text: `Bonjour ${rows[0].firstName || ''},\n\nUtilisez ce lien pour choisir un nouveau mot de passe (valable 1 heure) :\n${resetLink}\n`,
    });

    const body = { ...generic };
    if (!sent && process.env.NODE_ENV !== 'production') {
      body.resetLink = resetLink;
      body.message = 'Email non configuré. Utilisez le lien de réinitialisation affiché.';
    }
    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Jeton et mot de passe requis' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await db.query(
      'SELECT id, reset_token_expires FROM users WHERE reset_token = ?',
      [tokenHash]
    );
    if (!rows.length || new Date(rows[0].reset_token_expires) < new Date()) {
      return res.status(400).json({ message: 'Lien de réinitialisation invalide ou expiré' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL, refresh_token = NULL WHERE id = ?',
      [hashedPassword, rows[0].id]
    );
    res.status(200).json({ message: 'Votre mot de passe a été réinitialisé' });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body;
  if (!oldPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }
  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: 'Les nouveaux mots de passe ne correspondent pas' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
  }
  if (oldPassword === newPassword) {
    return res.status(400).json({ message: 'Le nouveau mot de passe doit être différent' });
  }

  try {
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    const passwordMatch = await bcrypt.compare(oldPassword, rows[0].password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ?, refresh_token = NULL WHERE id = ?', [
      hashedPassword,
      req.user.id,
    ]);
    res.status(200).json({ message: 'Mot de passe mis à jour' });
  } catch (error) {
    next(error);
  }
};

export const exportUsers = async (req, res, next) => {
  const format = req.query.format || 'csv';
  try {
    const [results] = await db.query(
      `SELECT id, firstName, lastName, email, phone, role, status, country, city, created_at
       FROM users ORDER BY id`
    );
    const data = results.map(toPublicUser);

    if (format === 'csv') {
      const csv = new Parser().parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment('users.csv');
      return res.send(csv);
    }

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Users');
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Prénom', key: 'firstName', width: 20 },
        { header: 'Nom', key: 'lastName', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Téléphone', key: 'phone', width: 18 },
        { header: 'Rôle', key: 'role', width: 16 },
        { header: 'Statut', key: 'status', width: 14 },
      ];
      data.forEach((user) => worksheet.addRow(user));
      const buffer = await workbook.xlsx.writeBuffer();
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment('users.xlsx');
      return res.send(Buffer.from(buffer));
    }

    if (format === 'pdf') {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      let page = pdfDoc.addPage();
      let y = page.getSize().height - 50;
      data.forEach((user, index) => {
        if (y < 50) {
          page = pdfDoc.addPage();
          y = page.getSize().height - 50;
        }
        page.drawText(
          `${index + 1}. ${user.name} - ${user.email} - ${user.role || ''}`,
          { x: 40, y, size: 11, font }
        );
        y -= 18;
      });
      const pdfBytes = await pdfDoc.save();
      res.header('Content-Type', 'application/pdf');
      res.attachment('users.pdf');
      return res.send(Buffer.from(pdfBytes));
    }

    return res.status(400).json({ message: 'Format non supporté' });
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (req, res, next) => {
  const userId = Number(req.params.id);
  const minutes = Number(req.body?.duration);

  try {
    if (userId === Number(req.user.id)) {
      return res.status(400).json({ message: 'Vous ne pouvez pas bloquer votre propre compte' });
    }
    const [rows] = await db.query('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    if (rows[0].role === 'superAdmin' && req.user.role !== 'superAdmin') {
      return res.status(403).json({ message: 'Impossible de bloquer un super administrateur' });
    }

    const blockedUntil = Number.isFinite(minutes) && minutes > 0
      ? new Date(Date.now() + minutes * 60000)
      : null;
    await db.query(
      'UPDATE users SET status = ?, blockedUntil = ? WHERE id = ?',
      ['blocked', blockedUntil, userId]
    );
    res.status(200).json({ message: 'Utilisateur bloqué' });
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  const userId = Number(req.params.id);
  try {
    const [result] = await db.query(
      'UPDATE users SET status = ?, blockedUntil = NULL WHERE id = ?',
      ['active', userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.status(200).json({ message: 'Utilisateur débloqué' });
  } catch (error) {
    next(error);
  }
};
