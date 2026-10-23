import bcrypt from 'bcrypt';
import { ensurePlatformSchema } from './platformSchema.js';

async function columnExists(pool, table, column) {
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

async function addColumn(pool, table, column, definition) {
  if (await columnExists(pool, table, column)) return;
  await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}

export async function ensureSchema(pool) {
  await addColumn(pool, 'users', 'firstName', 'VARCHAR(100) NULL');
  await addColumn(pool, 'users', 'lastName', 'VARCHAR(100) NULL');
  await addColumn(pool, 'users', 'phone', 'VARCHAR(30) NULL');
  await addColumn(pool, 'users', 'country', 'VARCHAR(100) NULL');
  await addColumn(pool, 'users', 'gender', 'VARCHAR(20) NULL');
  await addColumn(pool, 'users', 'birthDate', 'DATE NULL');
  await addColumn(pool, 'users', 'street', 'VARCHAR(255) NULL');
  await addColumn(pool, 'users', 'city', 'VARCHAR(100) NULL');
  await addColumn(pool, 'users', 'postalCode', 'VARCHAR(20) NULL');
  await addColumn(pool, 'users', 'wallet', 'DECIMAL(12,2) NOT NULL DEFAULT 0');
  await addColumn(pool, 'users', 'status', "VARCHAR(20) NOT NULL DEFAULT 'active'");
  await addColumn(pool, 'users', 'blockedUntil', 'DATETIME NULL');
  await addColumn(pool, 'users', 'role', "VARCHAR(20) NOT NULL DEFAULT 'user'");
  await addColumn(pool, 'users', 'refresh_token', 'TEXT NULL');
  await addColumn(pool, 'users', 'reset_token', 'VARCHAR(255) NULL');
  await addColumn(pool, 'users', 'reset_token_expires', 'DATETIME NULL');

  await pool.query('ALTER TABLE users MODIFY username VARCHAR(191) NULL');

  await addColumn(pool, 'transactions', 'recipient_name', 'VARCHAR(150) NULL');
  await addColumn(pool, 'transactions', 'method', 'VARCHAR(50) NULL');
  await addColumn(pool, 'transactions', 'accountNumber', 'VARCHAR(80) NULL');
  await addColumn(pool, 'transactions', 'recipientTown', 'VARCHAR(100) NULL');
  await addColumn(pool, 'transactions', 'recipientAddress', 'VARCHAR(255) NULL');
  await addColumn(pool, 'transactions', 'reasonOfSending', 'VARCHAR(255) NULL');
  await addColumn(pool, 'transactions', 'amount_received', 'DECIMAL(14,2) NULL');
  await addColumn(pool, 'transactions', 'sending_country', 'VARCHAR(100) NULL');
  await addColumn(pool, 'transactions', 'receiving_country', 'VARCHAR(100) NULL');
  await addColumn(pool, 'transactions', 'currency_sent', 'VARCHAR(10) NULL');
  await addColumn(pool, 'transactions', 'currency_received', 'VARCHAR(10) NULL');
  await addColumn(pool, 'transactions', 'transactionState', 'VARCHAR(20) NULL');
  await addColumn(pool, 'transactions', 'transaction_date', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP');

  await pool.query(
    "ALTER TABLE transactions MODIFY type ENUM('deposit','withdrawal','transfer','bill') NOT NULL DEFAULT 'transfer'"
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL,
      subject VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensurePlatformSchema(pool);
  await seedSuperAdmin(pool);
}

async function seedSuperAdmin(pool) {
  const email = process.env.ADMIN_EMAIL || 'admin@nkap.local';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';

  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = ? OR role = ? LIMIT 1',
    [email, 'superAdmin']
  );
  if (existing.length > 0) return;

  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO users SET ?', {
    username: email,
    firstName: 'Super',
    lastName: 'Admin',
    email,
    password: hashedPassword,
    phone: '1000000000',
    country: 'Canada',
    role: 'superAdmin',
    status: 'active',
  });
  console.log(`Super admin créé : ${email}`);
}
