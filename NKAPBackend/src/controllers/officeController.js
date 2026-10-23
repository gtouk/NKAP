import { Parser } from 'json2csv';
import db from '../config/db.js';
import { writeAudit } from '../services/audit.js';
import { notifyUser } from '../services/notify.js';
import { setReviewState, timeline, completePayout } from '../services/transferService.js';
import { sendError } from '../utils/httpError.js';

export const searchTransactions = async (req, res, next) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const params = [q, q, q, q];
    let sql = `
      SELECT t.id, t.reference, t.amount, t.amount_received, t.currency_received, t.fee, t.fx_rate,
             t.transactionState, t.payment_status, t.payout_status, t.compliance_status,
             t.recipient_name, t.hold_reason, COALESCE(t.transaction_date, t.created_at) AS created_at,
             u.email, u.firstName, u.lastName
      FROM transactions t
      JOIN users u ON u.id = t.user_id
      WHERE t.type = 'transfer'
        AND (t.reference LIKE ? OR t.recipient_name LIKE ? OR u.email LIKE ?
             OR CONCAT(u.firstName, ' ', u.lastName) LIKE ?)`;
    if (req.query.state) {
      sql += ' AND t.transactionState = ?';
      params.push(req.query.state);
    }
    sql += ' ORDER BY t.id DESC LIMIT 200';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const searchClients = async (req, res, next) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const [rows] = await db.query(
      `SELECT id, firstName, lastName, email, phone, country, kyc_status, status, role
       FROM users
       WHERE email LIKE ? OR phone LIKE ? OR CONCAT(firstName, ' ', lastName) LIKE ?
       ORDER BY id DESC LIMIT 100`,
      [q, q, q]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const searchBeneficiaries = async (req, res, next) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const [rows] = await db.query(
      `SELECT b.*, u.email AS owner_email
       FROM beneficiaries b JOIN users u ON u.id = b.user_id
       WHERE b.first_name LIKE ? OR b.last_name LIKE ? OR b.phone LIKE ? OR b.account_number LIKE ?
       ORDER BY b.id DESC LIMIT 100`,
      [q, q, q, q]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const transactionDetail = async (req, res, next) => {
  try {
    const detail = await timeline(req.params.id, req.user);
    const [checks] = await db.query(
      'SELECT check_type, decision, reason, provider, created_at FROM compliance_checks WHERE transaction_id = ?',
      [detail.transfer.id]
    );
    const [audits] = await db.query(
      `SELECT action, old_value, new_value, reason, result, created_at, actor_id
       FROM audit_logs WHERE entity_id = ? ORDER BY id`,
      [detail.transfer.reference]
    );
    res.json({ ...detail, checks, audits });
  } catch (error) {
    sendError(res, error, next);
  }
};

export const reviewTransfer = async (req, res, next) => {
  try {
    const transfer = await setReviewState(req.params.id, req.user, {
      state: req.body.decision,
      reason: req.body.reason,
    });
    res.json(transfer);
  } catch (error) {
    sendError(res, error, next);
  }
};

export const markPaid = async (req, res, next) => {
  try {
    res.json(await completePayout(req.params.id, req.user));
  } catch (error) {
    sendError(res, error, next);
  }
};

export const requestInfo = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT u.* FROM users u JOIN transactions t ON t.user_id = u.id
       WHERE t.id = ? OR t.reference = ? LIMIT 1`,
      [req.params.id, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Transfert introuvable' });
    await notifyUser(rows[0], 'info_request', req.body.note || '');
    await writeAudit({
      actorId: req.user.id,
      action: 'transfer.request_info',
      entityType: 'transaction',
      entityId: req.params.id,
      reason: req.body.note,
    });
    res.json({ message: 'Demande envoyée' });
  } catch (error) {
    next(error);
  }
};

export const reconciliation = async (req, res, next) => {
  try {
    const report = await buildReconciliation(req.query.from, req.query.to);
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const exportReconciliation = async (req, res, next) => {
  try {
    const report = await buildReconciliation(req.query.from, req.query.to);
    const parser = new Parser({
      fields: ['reference', 'amount', 'amount_received', 'transactionState', 'payment_status', 'payout_status', 'gap'],
    });
    await db.query('INSERT INTO reconciliation_runs SET ?', {
      period_start: req.query.from || '2000-01-01',
      period_end: req.query.to || new Date().toISOString().slice(0, 10),
      actor_id: req.user.id,
      summary_json: JSON.stringify({ gaps: report.gaps, count: report.rows.length }),
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="rapprochement.csv"');
    res.send(parser.parse(report.rows));
  } catch (error) {
    next(error);
  }
};

async function buildReconciliation(from, to) {
  const params = [];
  let sql = `
    SELECT reference, amount, amount_received, currency_received, transactionState,
           payment_status, payout_status, status
    FROM transactions WHERE type = 'transfer'`;
  if (from) {
    sql += ' AND DATE(COALESCE(transaction_date, created_at)) >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND DATE(COALESCE(transaction_date, created_at)) <= ?';
    params.push(to);
  }
  sql += ' ORDER BY id DESC';
  const [rows] = await db.query(sql, params);
  const decorated = rows.map((row) => {
    let gap = '';
    if (row.payment_status === 'verified' && !row.payout_status) gap = 'Paiement sans instruction';
    if (row.payout_status === 'sent' && row.transactionState !== 'paid') gap = 'Instruction sans paiement bénéficiaire';
    if (row.payment_status === 'mismatch') gap = 'Écart de montant';
    return { ...row, gap };
  });
  return {
    rows: decorated,
    gaps: decorated.filter((row) => row.gap).length,
  };
}

export const listAudit = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, u.email AS actor_email
       FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id
       ORDER BY a.id DESC LIMIT 200`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const listPartners = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, code, name, side, kind, country, status, api_base_url, credentials_ref,
              min_amount, max_amount, created_at FROM partners ORDER BY id`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const savePartner = async (req, res, next) => {
  const { code, name, side, kind, country, status, apiBaseUrl, credentialsRef, minAmount, maxAmount } = req.body;
  if (!code || !name || !side || !kind || !country) {
    return res.status(400).json({ message: 'Code, nom, côté, type et pays sont requis' });
  }
  try {
    await db.query(
      `INSERT INTO partners (code, name, side, kind, country, status, api_base_url, credentials_ref, min_amount, max_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status), api_base_url = VALUES(api_base_url),
         credentials_ref = VALUES(credentials_ref), min_amount = VALUES(min_amount), max_amount = VALUES(max_amount)`,
      [code, name, side, kind, country, status || 'active', apiBaseUrl || null, credentialsRef || null, minAmount || null, maxAmount || null]
    );
    await writeAudit({
      actorId: req.user.id,
      action: 'partner.save',
      entityType: 'partner',
      entityId: code,
      newValue: { status, country },
    });
    res.status(201).json({ message: 'Partenaire enregistré' });
  } catch (error) {
    next(error);
  }
};

export const listCorridors = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM corridors ORDER BY id');
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const saveCorridor = async (req, res, next) => {
  const {
    originCountry, destinationCountry, destinationCurrency, fxRate, fxMargin,
    feeFixed, feePercent, minAmount, maxAmount, dailyLimit, monthlyLimit, eta, conditions, active,
  } = req.body;
  if (!originCountry || !destinationCountry || !destinationCurrency || fxRate == null) {
    return res.status(400).json({ message: 'Corridor incomplet' });
  }
  try {
    const [before] = await db.query(
      'SELECT * FROM corridors WHERE origin_country = ? AND destination_country = ?',
      [originCountry, destinationCountry]
    );
    await db.query(
      `INSERT INTO corridors
        (origin_country, destination_country, destination_currency, fx_rate, fx_margin, fee_fixed, fee_percent,
         min_amount, max_amount, daily_limit, monthly_limit, eta, conditions_text, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE fx_rate = VALUES(fx_rate), fx_margin = VALUES(fx_margin), fee_fixed = VALUES(fee_fixed),
         fee_percent = VALUES(fee_percent), min_amount = VALUES(min_amount), max_amount = VALUES(max_amount),
         daily_limit = VALUES(daily_limit), monthly_limit = VALUES(monthly_limit), eta = VALUES(eta),
         conditions_text = VALUES(conditions_text), active = VALUES(active), destination_currency = VALUES(destination_currency)`,
      [originCountry, destinationCountry, destinationCurrency, fxRate, fxMargin || 0, feeFixed || 0, feePercent || 0,
        minAmount || 15, maxAmount || 5000, dailyLimit || 10000, monthlyLimit || 25000, eta || '1 à 24 heures',
        conditions || null, active === false ? 0 : 1]
    );
    await writeAudit({
      actorId: req.user.id,
      action: 'corridor.save',
      entityType: 'corridor',
      entityId: `${originCountry}->${destinationCountry}`,
      oldValue: before[0] || null,
      newValue: { fxRate, feePercent, feeFixed, active },
    });
    res.status(201).json({ message: 'Corridor enregistré' });
  } catch (error) {
    next(error);
  }
};

export const kycQueue = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT d.id, d.doc_type, d.original_name, d.status, d.created_at, u.id AS user_id,
              u.firstName, u.lastName, u.email, u.kyc_status
       FROM kyc_documents d JOIN users u ON u.id = d.user_id
       ORDER BY d.id DESC LIMIT 200`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};
