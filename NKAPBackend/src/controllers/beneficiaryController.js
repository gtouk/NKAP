import db from '../config/db.js';
import { writeAudit } from '../services/audit.js';
import { HttpError, sendError } from '../utils/httpError.js';

const MODES = ['bank', 'mobile_money', 'other', 'Orange Money', 'Mobile Money', 'Dépôt bancaire'];

export const listBeneficiaries = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM beneficiaries WHERE user_id = ? ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const saveBeneficiary = async (req, res, next) => {
  const { firstName, lastName, phone, country, receptionMode, bankName, accountNumber, city, address } = req.body;
  if (!firstName || !lastName || !country || !receptionMode) {
    return res.status(400).json({ message: 'Nom, prénom, pays et mode de réception sont requis' });
  }
  if (!MODES.includes(receptionMode)) {
    return res.status(400).json({ message: 'Mode de réception invalide' });
  }
  try {
    const payload = {
      user_id: req.user.id,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      country,
      reception_mode: receptionMode,
      bank_name: bankName || null,
      account_number: accountNumber || null,
      city: city || null,
      address: address || null,
    };
    if (req.params.id) {
      const [owned] = await db.query(
        'SELECT id FROM beneficiaries WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      if (!owned[0]) throw new HttpError(404, 'Bénéficiaire introuvable');
      await db.query('UPDATE beneficiaries SET ? WHERE id = ?', [payload, req.params.id]);
      await writeAudit({
        actorId: req.user.id,
        action: 'beneficiary.update',
        entityType: 'beneficiary',
        entityId: req.params.id,
        newValue: payload,
      });
      return res.json({ message: 'Bénéficiaire mis à jour', id: Number(req.params.id) });
    }
    const [result] = await db.query('INSERT INTO beneficiaries SET ?', payload);
    res.status(201).json({ message: 'Bénéficiaire ajouté', id: result.insertId });
  } catch (error) {
    sendError(res, error, next);
  }
};

export const deleteBeneficiary = async (req, res, next) => {
  try {
    const [result] = await db.query(
      'DELETE FROM beneficiaries WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Bénéficiaire introuvable' });
    res.json({ message: 'Bénéficiaire retiré' });
  } catch (error) {
    next(error);
  }
};
