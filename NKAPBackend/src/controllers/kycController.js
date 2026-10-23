import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import db from '../config/db.js';
import { kycProvider } from '../providers/kycProvider.js';
import { writeAudit } from '../services/audit.js';
import { notifyUser } from '../services/notify.js';
import { HttpError, sendError } from '../utils/httpError.js';

const DIR = path.join(process.cwd(), 'uploads', 'kyc');
const TYPES = ['identity', 'proof_of_address', 'other'];

export const uploadKyc = async (req, res, next) => {
  const { docType, fileName, mimeType, contentBase64 } = req.body;
  if (!TYPES.includes(docType) || !fileName || !contentBase64) {
    return res.status(400).json({ message: 'Type de document et fichier requis' });
  }
  try {
    const buffer = Buffer.from(contentBase64, 'base64');
    if (!buffer.length || buffer.length > 1_500_000) {
      throw new HttpError(400, 'Le fichier doit faire moins de 1,5 Mo');
    }
    await fs.mkdir(DIR, { recursive: true });
    const stored = `${crypto.randomBytes(16).toString('hex')}${path.extname(fileName).slice(0, 8)}`;
    await fs.writeFile(path.join(DIR, stored), buffer);
    const provider = await kycProvider.submit({ userId: req.user.id, docType });
    const [result] = await db.query('INSERT INTO kyc_documents SET ?', {
      user_id: req.user.id,
      doc_type: docType,
      original_name: path.basename(fileName).slice(0, 255),
      stored_name: stored,
      mime_type: mimeType || 'application/octet-stream',
      status: 'pending',
    });
    await db.query('INSERT INTO kyc_events SET ?', {
      user_id: req.user.id,
      document_id: result.insertId,
      actor_id: req.user.id,
      status: 'pending',
      provider: provider.provider,
    });
    await db.query('UPDATE users SET kyc_status = ? WHERE id = ? AND kyc_status <> ?', [
      'pending', req.user.id, 'approved',
    ]);
    res.status(201).json({ message: 'Document reçu', id: result.insertId, provider: provider.provider });
  } catch (error) {
    sendError(res, error, next);
  }
};

export const myKyc = async (req, res, next) => {
  try {
    const [docs] = await db.query(
      `SELECT id, doc_type, original_name, status, note, created_at, reviewed_at
       FROM kyc_documents WHERE user_id = ? ORDER BY id DESC`,
      [req.user.id]
    );
    const [events] = await db.query(
      'SELECT status, note, provider, created_at FROM kyc_events WHERE user_id = ? ORDER BY id DESC',
      [req.user.id]
    );
    const [user] = await db.query('SELECT kyc_status FROM users WHERE id = ?', [req.user.id]);
    res.json({ status: user[0]?.kyc_status || 'pending', documents: docs, history: events });
  } catch (error) {
    next(error);
  }
};

export const reviewKyc = async (req, res, next) => {
  const { status, note } = req.body;
  if (!['approved', 'rejected', 'more_info'].includes(status)) {
    return res.status(400).json({ message: 'Statut KYC invalide' });
  }
  try {
    const [docs] = await db.query('SELECT * FROM kyc_documents WHERE id = ?', [req.params.id]);
    if (!docs[0]) throw new HttpError(404, 'Document introuvable');
    await db.query(
      'UPDATE kyc_documents SET status = ?, reviewer_id = ?, note = ?, reviewed_at = NOW() WHERE id = ?',
      [status, req.user.id, note || null, docs[0].id]
    );
    const userStatus = status === 'more_info' ? 'more_info' : status;
    await db.query('UPDATE users SET kyc_status = ? WHERE id = ?', [userStatus, docs[0].user_id]);
    await db.query('INSERT INTO kyc_events SET ?', {
      user_id: docs[0].user_id,
      document_id: docs[0].id,
      actor_id: req.user.id,
      status,
      note: note || null,
      provider: 'manual',
    });
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [docs[0].user_id]);
    const event = status === 'approved' ? 'kyc_approved' : status === 'rejected' ? 'kyc_rejected' : 'kyc_more_info';
    if (users[0]) await notifyUser(users[0], event, note || '');
    await writeAudit({
      actorId: req.user.id,
      action: 'kyc.review',
      entityType: 'kyc_document',
      entityId: docs[0].id,
      oldValue: docs[0].status,
      newValue: status,
      reason: note,
    });
    res.json({ message: 'Revue KYC enregistrée' });
  } catch (error) {
    sendError(res, error, next);
  }
};

export const downloadKyc = async (req, res, next) => {
  try {
    const [docs] = await db.query('SELECT * FROM kyc_documents WHERE id = ?', [req.params.id]);
    if (!docs[0]) return res.status(404).json({ message: 'Document introuvable' });
    const staff = ['compliance', 'admin', 'superAdmin'].includes(req.user.role);
    if (docs[0].user_id !== req.user.id && !staff) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const file = path.join(DIR, docs[0].stored_name);
    res.setHeader('Content-Type', docs[0].mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${docs[0].original_name}"`);
    res.send(await fs.readFile(file));
  } catch (error) {
    next(error);
  }
};
