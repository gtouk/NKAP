import db from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export async function findCorridor(origin, destination) {
  const [rows] = await db.query(
    'SELECT * FROM corridors WHERE active = 1'
  );
  return rows.find((row) =>
    normalize(row.origin_country) === normalize(origin)
    && normalize(row.destination_country) === normalize(destination)
  ) || null;
}

export async function buildQuote({
  origin = 'Canada',
  destination,
  amount,
  promoCode,
}) {
  const numericAmount = Number(amount);
  if (!destination) throw new HttpError(400, 'Le pays du bénéficiaire est requis');
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new HttpError(400, 'Le montant est invalide');
  }

  const corridor = await findCorridor(origin, destination);
  if (!corridor) throw new HttpError(400, 'Ce corridor n\'est pas ouvert');
  if (numericAmount < Number(corridor.min_amount)) {
    throw new HttpError(400, `Le montant minimum est de ${corridor.min_amount} CAD`);
  }
  if (numericAmount > Number(corridor.max_amount)) {
    throw new HttpError(400, `Le montant maximum est de ${corridor.max_amount} CAD`);
  }

  let discountPercent = 0;
  if (promoCode) {
    const [promos] = await db.query(
      'SELECT * FROM promotions WHERE code = ? AND active = 1',
      [promoCode]
    );
    if (promos[0]) discountPercent = Number(promos[0].discount_percent);
  }

  const feePercent = Number(corridor.fee_percent);
  const feeFixed = Number(corridor.fee_fixed);
  const rawFee = feeFixed + (numericAmount * feePercent) / 100;
  const fee = Math.max(0, rawFee * (1 - discountPercent / 100));
  const otherFees = 0;
  const rate = Number(corridor.fx_rate);
  const margin = Number(corridor.fx_margin);
  const appliedRate = rate * (1 - margin / 100);
  const net = Math.max(0, numericAmount - fee - otherFees);
  const amountToReceive = Math.round(net * appliedRate * 100) / 100;

  return {
    origin,
    destination,
    amount: numericAmount,
    currencySent: 'CAD',
    currencyReceived: corridor.destination_currency,
    fee: Math.round(fee * 100) / 100,
    otherFees,
    feePercent,
    feeFixed,
    fxRate: appliedRate,
    fxMargin: margin,
    amountToReceive,
    eta: corridor.eta,
    conditions: corridor.conditions_text,
    totalToPay: numericAmount,
    corridorId: corridor.id,
  };
}
