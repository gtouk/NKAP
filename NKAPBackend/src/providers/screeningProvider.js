import db from '../config/db.js';

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function screenParty({ fullName, amount }) {
  const name = normalize(fullName);
  const [rows] = await db.query('SELECT full_name, list_type, note FROM watchlist');
  const match = rows.find((row) => normalize(row.full_name) === name);
  if (match?.list_type === 'sanctions') {
    return { decision: 'block', reason: 'Correspondance sanctions', provider: 'internal-watchlist' };
  }
  if (match?.list_type === 'pep') {
    return { decision: 'hold', reason: 'Correspondance PEP', provider: 'internal-watchlist' };
  }

  const [settings] = await db.query(
    'SELECT max_amount FROM corridors WHERE active = 1 ORDER BY max_amount DESC LIMIT 1'
  );
  const unusual = Number(settings[0]?.max_amount || 5000) * 0.6;
  if (Number(amount) >= unusual) {
    return { decision: 'hold', reason: 'Montant inhabituel', provider: 'rules' };
  }
  return { decision: 'clear', reason: null, provider: 'rules' };
}
