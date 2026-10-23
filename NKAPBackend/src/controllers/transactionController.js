import db from '../config/db.js';
import { sendMailMessage } from '../utils/mailer.js';
import { openTransfer } from '../services/transferService.js';
import { sendError } from '../utils/httpError.js';

function toNumber(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : NaN;
}

export const createTransaction = async (req, res, next) => {
  try {
    const transfer = await openTransfer({
      user: req.user,
      body: req.body,
      idempotencyKey: req.get('Idempotency-Key') || req.body.idempotencyKey,
    });
    res.status(201).json({
      message: 'Transaction enregistrée',
      ...transfer,
    });
  } catch (error) {
    sendError(res, error, next);
  }
};

export const payBill = async (req, res, next) => {
  const { name, phone, email, country, amountToSend, currency, details } = req.body;
  const amount = toNumber(amountToSend);
  if (!name || !amount || amount <= 0) {
    return res.status(400).json({ message: 'Le nom et un montant valide sont requis' });
  }

  try {
    const [result] = await db.query('INSERT INTO transactions SET ?', {
      user_id: req.user.id,
      amount,
      type: 'bill',
      status: 'pending',
      transactionState: 'pending',
      recipient_name: name,
      method: 'facture',
      accountNumber: phone || null,
      reasonOfSending: details || email || null,
      receiving_country: country || null,
      currency_sent: currency || null,
      transaction_date: new Date(),
    });
    res.status(201).json({
      success: true,
      message: 'Demande de paiement enregistrée',
      id: result.insertId,
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const [results] = await db.query(
      `SELECT t.id AS transaction_id, t.reference, t.amount, t.amount_received, t.fee, t.fx_rate,
              t.method, t.payment_status, t.payout_status, t.compliance_status, t.eta,
              COALESCE(t.transactionState, t.status) AS transactionState,
              COALESCE(t.transaction_date, t.created_at) AS transaction_date,
              t.accountNumber, t.recipientTown, t.recipientAddress, t.recipient_name,
              t.sending_country, t.receiving_country, t.currency_sent, t.currency_received,
              t.reasonOfSending, t.type,
              CONCAT(u.firstName, ' ', u.lastName) AS user_name
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.user_id = ?
       ORDER BY COALESCE(t.transaction_date, t.created_at) DESC`,
      [req.user.id]
    );
    res.json(results);
  } catch (error) {
    next(error);
  }
};

export const getRecipients = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT recipient_name, recipientTown, recipientAddress, accountNumber, method,
              COALESCE(transaction_date, created_at) AS last_used
       FROM transactions
       WHERE user_id = ? AND recipient_name IS NOT NULL AND type = 'transfer'
       ORDER BY COALESCE(transaction_date, created_at) DESC`,
      [req.user.id]
    );

    const seen = new Set();
    const recipients = [];
    for (const row of rows) {
      const key = `${row.recipient_name}|${row.accountNumber || ''}|${row.method || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      recipients.push(row);
    }
    res.json(recipients);
  } catch (error) {
    next(error);
  }
};

export const sendEmail = async (req, res, next) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ message: 'Sujet et message requis' });
  }
  if (!req.user.email) {
    return res.status(400).json({ message: 'Email du compte introuvable' });
  }

  try {
    const sent = await sendMailMessage({
      to: req.user.email,
      subject,
      text: message,
    });
    res.status(200).json({
      message: sent
        ? 'Email envoyé'
        : 'Transaction enregistrée. Email non envoyé : messagerie non configurée.',
      sent,
    });
  } catch (error) {
    console.error('Erreur email:', error.message);
    res.status(200).json({
      message: 'Transaction enregistrée. L\'email de confirmation n\'a pas pu être envoyé.',
      sent: false,
    });
  }
};

export const sendMail = async (req, res, next) => {
  const name = req.body.name || `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim();
  const { email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
  }

  try {
    await db.query('INSERT INTO messages SET ?', { name, email, subject, message });
    const inbox = process.env.EMAIL_USER;
    if (inbox) {
      await sendMailMessage({
        to: inbox,
        subject: `Contact NKAP — ${subject}`,
        text: `Nom: ${name}\nEmail: ${email}\n\n${message}`,
        from: process.env.EMAIL_USER,
      });
    }
    res.status(200).json({ success: true, message: 'Message envoyé' });
  } catch (error) {
    next(error);
  }
};
