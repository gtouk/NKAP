import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { ensureSchema } from '../config/schema.js';

const [email, password, name = 'Admin NKAP'] = process.argv.slice(2);

if (!email || !password) {
  console.log('Usage : node src/admin/addAdmin.js <email> <mot_de_passe> [nom]');
  process.exit(1);
}

const parts = name.trim().split(/\s+/);
const firstName = parts[0];
const lastName = parts.slice(1).join(' ') || 'Admin';

await ensureSchema(pool);
const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
if (existing.length) {
  console.error('Cet email existe déjà');
  process.exit(1);
}

const hashedPassword = await bcrypt.hash(password, 10);
await pool.query('INSERT INTO users SET ?', {
  username: email.slice(0, 191),
  firstName,
  lastName,
  email,
  password: hashedPassword,
  role: 'admin',
  status: 'active',
});
console.log('Administrateur ajouté');
await pool.end();
