import db from '../config/db.js';
import { screenParty } from '../providers/screeningProvider.js';
import { createPaymentInstruction, verifyPayment } from '../providers/paymentProvider.js';
import { sendPayout } from '../providers/payoutProvider.js';
import { writeAudit } from './audit.js';
import { notifyUser } from './notify.js';
import { buildQuote, findCorridor } from './quote.js';
import { nextReference } from './reference.js';
import { HttpError } from '../utils/httpError.js';

const KYC_THRESHOLD = 1000;

function splitName(body) {
  if (body.beneficiaryFirstName || body.firstName) {
    return {
      first: body.beneficiaryFirstName || body.firstName,
      last: body.beneficiaryLastName || body.lastName || '',
    };
  }
  const parts = String(body.recipientName || '').trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] || '', last: parts.slice(1).join(' ') };
}

function publicTransfer(row, extra = {}) {
  return {
    id: row.id,
    transaction_id: row.id,
    reference: row.reference,
    amount: Number(row.amount),
    fee: row.fee == null ? null : Number(row.fee),
    otherFees: row.other_fees == null ? 0 : Number(row.other_fees),
    fxRate: row.fx_rate == null ? null : Number(row.fx_rate),
    amountToReceive: row.amount_received == null ? null : Number(row.amount_received),
    currencySent: row.currency_sent,
    currencyReceived: row.currency_received,
    eta: row.eta,
    conditions: row.conditions_text,
    recipient_name: row.recipient_name,
    method: row.method,
    receptionMode: row.reception_mode || row.method,
    accountNumber: row.accountNumber,
    paymentStatus: row.payment_status,
    payoutStatus: row.payout_status,
    complianceStatus: row.compliance_status,
    transactionState: row.transactionState || row.status,
    holdReason: row.hold_reason,
    payoutReference: row.payout_reference,
    partnerCode: row.partner_code,
    ...extra,
  };
}

async function assertLimits(userId, quote) {
  const corridor = await findCorridor(quote.origin, quote.destination);
  const [dayRows] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE user_id = ? AND type = 'transfer' AND status <> 'failed'
       AND DATE(COALESCE(transaction_date, created_at)) = CURDATE()`,
    [userId]
  );
  const [monthRows] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE user_id = ? AND type = 'transfer' AND status <> 'failed'
       AND YEAR(COALESCE(transaction_date, created_at)) = YEAR(CURDATE())
       AND MONTH(COALESCE(transaction_date, created_at)) = MONTH(CURDATE())`,
    [userId]
  );
  if (Number(dayRows[0].total) + quote.amount > Number(corridor.daily_limit)) {
    throw new HttpError(400, 'Limite quotidienne atteinte');
  }
  if (Number(monthRows[0].total) + quote.amount > Number(corridor.monthly_limit)) {
    throw new HttpError(400, 'Limite mensuelle atteinte');
  }
}

async function addEvent(connection, transactionId, state, note, actorId = null) {
  const runner = connection || db;
  await runner.query('INSERT INTO transfer_events SET ?', {
    transaction_id: transactionId,
    state,
    note,
    actor_id: actorId,
  });
}

export async function openTransfer({ user, body, idempotencyKey }) {
  if (idempotencyKey) {
    const [existing] = await db.query(
      'SELECT * FROM transactions WHERE user_id = ? AND idempotency_key = ? LIMIT 1',
      [user.id, idempotencyKey]
    );
    if (existing[0]) return publicTransfer(existing[0], { duplicate: true });
  }

  const names = splitName(body);
  const recipientName = `${names.first} ${names.last}`.trim() || body.recipientName;
  if (!recipientName || !body.method || !body.accountNumber) {
    throw new HttpError(400, 'Montant, destinataire, mode et compte sont requis');
  }

  const quote = await buildQuote({
    origin: body.sendingCountry || 'Canada',
    destination: body.receivingCountry || body.destination,
    amount: body.amount,
    promoCode: body.promoCode,
  });
  await assertLimits(user.id, quote);

  const [accounts] = await db.query('SELECT * FROM users WHERE id = ?', [user.id]);
  const account = accounts[0];
  const screening = await screenParty({ fullName: recipientName, amount: quote.amount });
  const kycHold = account?.kyc_status !== 'approved' && quote.amount > KYC_THRESHOLD;

  let transactionState = 'created';
  let complianceStatus = 'clear';
  let holdReason = null;
  let status = 'pending';
  if (screening.decision === 'block') {
    transactionState = 'failed';
    complianceStatus = 'blocked';
    holdReason = screening.reason;
    status = 'failed';
  } else if (screening.decision === 'hold' || kycHold) {
    transactionState = 'hold';
    complianceStatus = 'hold';
    holdReason = screening.reason || 'KYC incomplet pour ce montant';
  }

  const connection = await db.getConnection();
  let transferId;
  let reference;
  try {
    await connection.beginTransaction();
    reference = await nextReference(connection, quote.destination);
    const [result] = await connection.query('INSERT INTO transactions SET ?', {
      user_id: user.id,
      amount: quote.amount,
      type: 'transfer',
      status,
      transactionState,
      recipient_name: recipientName,
      method: body.method,
      reception_mode: body.method,
      accountNumber: body.accountNumber,
      beneficiary_phone: body.phone || body.accountNumber,
      recipientTown: body.recipientTown || null,
      recipientAddress: body.recipientAddress || null,
      reasonOfSending: body.reasonOfSending || null,
      amount_received: quote.amountToReceive,
      sending_country: quote.origin,
      receiving_country: quote.destination,
      currency_sent: quote.currencySent,
      currency_received: quote.currencyReceived,
      fee: quote.fee,
      other_fees: quote.otherFees,
      fx_rate: quote.fxRate,
      fx_margin: quote.fxMargin,
      eta: quote.eta,
      conditions_text: quote.conditions,
      quote_snapshot: JSON.stringify(quote),
      payment_status: 'expected',
      compliance_status: complianceStatus,
      hold_reason: holdReason,
      beneficiary_id: body.beneficiaryId || null,
      idempotency_key: idempotencyKey || null,
      reference,
      transaction_date: new Date(),
    });
    transferId = result.insertId;
    await addEvent(connection, transferId, 'created', reference);
    if (account?.kyc_status !== 'approved') {
      await addEvent(connection, transferId, 'kyc_review', account?.kyc_status || 'pending');
    }
    await addEvent(connection, transferId, 'payment_expected', 'Paiement attendu');
    if (transactionState === 'hold') await addEvent(connection, transferId, 'hold', holdReason);
    if (transactionState === 'failed') await addEvent(connection, transferId, 'failed', holdReason);
    await connection.query('INSERT INTO compliance_checks SET ?', {
      transaction_id: transferId,
      check_type: 'screening',
      decision: screening.decision,
      reason: screening.reason,
      provider: screening.provider,
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  if (account) {
    await notifyUser(account, transactionState === 'failed' ? 'transfer_failed' : 'transfer_created', reference);
  }
  await writeAudit({
    actorId: user.id,
    action: 'transfer.create',
    entityType: 'transaction',
    entityId: reference,
    newValue: { amount: quote.amount, state: transactionState },
    result: transactionState === 'failed' ? 'blocked' : 'ok',
    reason: holdReason,
  });

  const [rows] = await db.query('SELECT * FROM transactions WHERE id = ?', [transferId]);
  return publicTransfer(rows[0], { quote });
}

export async function startPayment({ user, transferId, method }) {
  const transfer = await ownedTransfer(user.id, transferId);
  if (!['interac', 'bank', 'other'].includes(method)) {
    throw new HttpError(400, 'Moyen de paiement invalide');
  }
  const instruction = await createPaymentInstruction({
    method,
    reference: transfer.reference,
    amount: transfer.amount,
    currency: transfer.currency_sent || 'CAD',
  });
  await db.query(
    'UPDATE transactions SET payment_method = ?, partner_code = ?, payment_status = ? WHERE id = ?',
    [method, instruction.provider, 'expected', transfer.id]
  );
  await addEvent(null, transfer.id, 'payment_expected', instruction.instructions, user.id);
  return { ...instruction, reference: transfer.reference };
}

export async function receivePayment({ actor, transferId, amount, simulate = false }) {
  const transfer = await loadTransfer(transferId);
  if (!simulate && actor?.id !== transfer.user_id && !isStaff(actor)) {
    throw new HttpError(403, 'Accès refusé');
  }
  const declared = amount == null ? Number(transfer.amount) : Number(amount);
  await db.query(
    'UPDATE transactions SET payment_status = ?, transactionState = ? WHERE id = ?',
    ['received', 'payment_received', transfer.id]
  );
  await addEvent(null, transfer.id, 'payment_received', null, actor?.id || null);
  const check = await verifyPayment({ amount: declared, declaredAmount: transfer.amount });
  if (check.status !== 'verified') {
    await db.query(
      'UPDATE transactions SET payment_status = ?, transactionState = ?, hold_reason = ? WHERE id = ?',
      ['mismatch', 'hold', 'Montant du paiement différent', transfer.id]
    );
    await addEvent(null, transfer.id, 'hold', 'Écart de paiement', actor?.id || null);
    throw new HttpError(409, 'Le montant reçu ne correspond pas');
  }
  await db.query(
    'UPDATE transactions SET payment_status = ?, transactionState = ? WHERE id = ? AND transactionState <> ?',
    ['verified', transfer.compliance_status === 'hold' ? 'hold' : 'validated', transfer.id, 'hold']
  );
  await addEvent(null, transfer.id, 'payment_verified', null, actor?.id || null);
  const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [transfer.user_id]);
  if (userRows[0]) await notifyUser(userRows[0], 'payment_received', transfer.reference);

  const [fresh] = await db.query('SELECT * FROM transactions WHERE id = ?', [transfer.id]);
  if (fresh[0].compliance_status === 'clear' && fresh[0].transactionState !== 'hold') {
    return dispatchPayout(fresh[0], actor);
  }
  return publicTransfer(fresh[0]);
}

export async function dispatchPayout(transfer, actor) {
  if (transfer.compliance_status === 'blocked' || transfer.transactionState === 'hold') {
    throw new HttpError(409, 'La transaction est en revue');
  }
  const result = await sendPayout(transfer);
  await db.query(
    `UPDATE transactions
     SET payout_reference = ?, partner_code = ?, payout_status = 'sent', transactionState = 'sent', status = 'pending'
     WHERE id = ?`,
    [result.payoutReference, result.partner, transfer.id]
  );
  if (!result.duplicate) {
    await addEvent(null, transfer.id, 'sent', result.payoutReference, actor?.id || null);
    const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [transfer.user_id]);
    if (userRows[0]) await notifyUser(userRows[0], 'transfer_sent', transfer.reference);
  }
  const [rows] = await db.query('SELECT * FROM transactions WHERE id = ?', [transfer.id]);
  return publicTransfer(rows[0]);
}

export async function completePayout(transferId, actor) {
  const transfer = await loadTransfer(transferId);
  await db.query(
    `UPDATE transactions SET payout_status = 'paid', transactionState = 'paid', status = 'completed' WHERE id = ?`,
    [transfer.id]
  );
  await addEvent(null, transfer.id, 'paid', null, actor?.id || null);
  const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [transfer.user_id]);
  if (userRows[0]) await notifyUser(userRows[0], 'beneficiary_paid', transfer.reference);
  const [rows] = await db.query('SELECT * FROM transactions WHERE id = ?', [transfer.id]);
  return publicTransfer(rows[0]);
}

export async function setReviewState(transferId, actor, { state, reason }) {
  const allowed = {
    hold: 'hold',
    approve: 'validated',
    reject: 'failed',
    cancel: 'cancelled',
    refund: 'refunded',
  };
  const next = allowed[state];
  if (!next) throw new HttpError(400, 'Décision inconnue');
  const transfer = await loadTransfer(transferId);
  const status = next === 'failed' || next === 'cancelled' ? 'failed' : next === 'refunded' ? 'failed' : 'pending';
  const compliance = state === 'approve' ? 'clear' : state === 'reject' ? 'blocked' : transfer.compliance_status;
  await db.query(
    `UPDATE transactions
     SET transactionState = ?, status = ?, compliance_status = ?, hold_reason = ?
     WHERE id = ?`,
    [next, status, compliance, reason || null, transfer.id]
  );
  await addEvent(null, transfer.id, next, reason || null, actor.id);
  await writeAudit({
    actorId: actor.id,
    action: `transfer.${state}`,
    entityType: 'transaction',
    entityId: transfer.reference,
    oldValue: transfer.transactionState,
    newValue: next,
    reason,
  });
  const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [transfer.user_id]);
  if (userRows[0] && state === 'refund') await notifyUser(userRows[0], 'refund', transfer.reference);
  if (userRows[0] && state === 'reject') await notifyUser(userRows[0], 'transfer_failed', transfer.reference);
  if (state === 'approve' && transfer.payment_status === 'verified') {
    const [fresh] = await db.query('SELECT * FROM transactions WHERE id = ?', [transfer.id]);
    return dispatchPayout(fresh[0], actor);
  }
  const [rows] = await db.query('SELECT * FROM transactions WHERE id = ?', [transfer.id]);
  return publicTransfer(rows[0]);
}

export async function timeline(transferId, actor) {
  const transfer = await loadTransfer(transferId);
  if (actor.role === 'user' && transfer.user_id !== actor.id) {
    throw new HttpError(403, 'Accès refusé');
  }
  const [events] = await db.query(
    'SELECT state, note, created_at FROM transfer_events WHERE transaction_id = ? ORDER BY id',
    [transfer.id]
  );
  return { transfer: publicTransfer(transfer), events };
}

async function ownedTransfer(userId, transferId) {
  const transfer = await loadTransfer(transferId);
  if (transfer.user_id !== userId) throw new HttpError(403, 'Accès refusé');
  return transfer;
}

async function loadTransfer(transferId) {
  const [rows] = await db.query(
    'SELECT * FROM transactions WHERE id = ? OR reference = ? LIMIT 1',
    [transferId, transferId]
  );
  if (!rows[0]) throw new HttpError(404, 'Transfert introuvable');
  return rows[0];
}

function isStaff(actor) {
  return ['support', 'compliance', 'finance', 'admin', 'superAdmin'].includes(actor?.role);
}

export { publicTransfer, buildQuote };
