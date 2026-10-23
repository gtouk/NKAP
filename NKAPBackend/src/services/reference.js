import db from '../config/db.js';

const CODES = {
  cameroun: 'CM',
  cameroon: 'CM',
  "côte d'ivoire": 'CI',
  "cote d'ivoire": 'CI',
  senegal: 'SN',
  sénégal: 'SN',
  gabon: 'GA',
  congo: 'CG',
  canada: 'CA',
};

export function countryCode(name) {
  const key = String(name || '').trim().toLowerCase();
  return CODES[key] || 'XX';
}

export async function nextReference(connection, destinationCountry) {
  const year = new Date().getFullYear();
  const key = `BEX-${countryCode(destinationCountry)}-${year}`;
  await connection.query(
    'INSERT INTO transfer_counters (counter_key, last_number) VALUES (?, 0) ON DUPLICATE KEY UPDATE last_number = last_number',
    [key]
  );
  const [rows] = await connection.query(
    'SELECT last_number FROM transfer_counters WHERE counter_key = ? FOR UPDATE',
    [key]
  );
  const next = Number(rows[0].last_number) + 1;
  await connection.query(
    'UPDATE transfer_counters SET last_number = ? WHERE counter_key = ?',
    [next, key]
  );
  return `${key}-${String(next).padStart(6, '0')}`;
}
