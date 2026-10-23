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

export async function ensurePlatformSchema(pool) {
  await addColumn(pool, 'users', 'kyc_status', "VARCHAR(20) NOT NULL DEFAULT 'pending'");
  await addColumn(pool, 'users', 'mfa_enabled', 'TINYINT(1) NOT NULL DEFAULT 0');
  await addColumn(pool, 'users', 'mfa_code_hash', 'VARCHAR(255) NULL');
  await addColumn(pool, 'users', 'mfa_code_expires', 'DATETIME NULL');

  await pool.query("ALTER TABLE transactions MODIFY status VARCHAR(30) NOT NULL DEFAULT 'pending'");
  await addColumn(pool, 'transactions', 'reference', 'VARCHAR(40) NULL');
  await addColumn(pool, 'transactions', 'fee', 'DECIMAL(12,2) NULL');
  await addColumn(pool, 'transactions', 'other_fees', 'DECIMAL(12,2) NOT NULL DEFAULT 0');
  await addColumn(pool, 'transactions', 'fx_rate', 'DECIMAL(14,6) NULL');
  await addColumn(pool, 'transactions', 'fx_margin', 'DECIMAL(8,4) NOT NULL DEFAULT 0');
  await addColumn(pool, 'transactions', 'eta', 'VARCHAR(80) NULL');
  await addColumn(pool, 'transactions', 'conditions_text', 'VARCHAR(500) NULL');
  await addColumn(pool, 'transactions', 'quote_snapshot', 'JSON NULL');
  await addColumn(pool, 'transactions', 'payment_status', "VARCHAR(30) NOT NULL DEFAULT 'expected'");
  await addColumn(pool, 'transactions', 'payout_status', 'VARCHAR(30) NULL');
  await addColumn(pool, 'transactions', 'compliance_status', "VARCHAR(30) NOT NULL DEFAULT 'pending'");
  await addColumn(pool, 'transactions', 'hold_reason', 'VARCHAR(255) NULL');
  await addColumn(pool, 'transactions', 'beneficiary_id', 'INT NULL');
  await addColumn(pool, 'transactions', 'partner_code', 'VARCHAR(50) NULL');
  await addColumn(pool, 'transactions', 'idempotency_key', 'VARCHAR(80) NULL');
  await addColumn(pool, 'transactions', 'payout_reference', 'VARCHAR(80) NULL');
  await addColumn(pool, 'transactions', 'beneficiary_phone', 'VARCHAR(30) NULL');
  await addColumn(pool, 'transactions', 'reception_mode', 'VARCHAR(40) NULL');
  await addColumn(pool, 'transactions', 'payment_method', 'VARCHAR(40) NULL');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transfer_counters (
      counter_key VARCHAR(40) PRIMARY KEY,
      last_number INT NOT NULL DEFAULT 0
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS corridors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      origin_country VARCHAR(80) NOT NULL,
      destination_country VARCHAR(80) NOT NULL,
      destination_currency VARCHAR(10) NOT NULL,
      fx_rate DECIMAL(14,6) NOT NULL,
      fx_margin DECIMAL(8,4) NOT NULL DEFAULT 0,
      fee_fixed DECIMAL(12,2) NOT NULL DEFAULT 0,
      fee_percent DECIMAL(8,4) NOT NULL DEFAULT 1,
      min_amount DECIMAL(12,2) NOT NULL DEFAULT 15,
      max_amount DECIMAL(12,2) NOT NULL DEFAULT 5000,
      daily_limit DECIMAL(12,2) NOT NULL DEFAULT 10000,
      monthly_limit DECIMAL(12,2) NOT NULL DEFAULT 25000,
      eta VARCHAR(80) NOT NULL DEFAULT '1 à 24 heures',
      conditions_text VARCHAR(500) NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      UNIQUE KEY corridor_pair (origin_country, destination_country)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS promotions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(40) NOT NULL UNIQUE,
      label VARCHAR(120) NOT NULL,
      discount_percent DECIMAL(8,4) NOT NULL DEFAULT 0,
      active TINYINT(1) NOT NULL DEFAULT 1
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS partners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(150) NOT NULL,
      side ENUM('canada','destination') NOT NULL,
      kind VARCHAR(40) NOT NULL,
      country VARCHAR(80) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      api_base_url VARCHAR(255) NULL,
      credentials_ref VARCHAR(120) NULL,
      settings_json JSON NULL,
      min_amount DECIMAL(12,2) NULL,
      max_amount DECIMAL(12,2) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS beneficiaries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      phone VARCHAR(30) NULL,
      country VARCHAR(80) NOT NULL,
      reception_mode VARCHAR(40) NOT NULL,
      bank_name VARCHAR(120) NULL,
      account_number VARCHAR(80) NULL,
      city VARCHAR(100) NULL,
      address VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX beneficiaries_user (user_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS kyc_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      doc_type VARCHAR(40) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      stored_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(80) NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      reviewer_id INT NULL,
      note VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME NULL,
      INDEX kyc_user (user_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS kyc_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      document_id INT NULL,
      actor_id INT NULL,
      status VARCHAR(20) NOT NULL,
      note VARCHAR(500) NULL,
      provider VARCHAR(40) NOT NULL DEFAULT 'manual',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(200) NOT NULL,
      list_type VARCHAR(20) NOT NULL,
      note VARCHAR(255) NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS compliance_checks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      transaction_id INT NOT NULL,
      check_type VARCHAR(40) NOT NULL,
      decision VARCHAR(20) NOT NULL,
      reason VARCHAR(255) NULL,
      provider VARCHAR(40) NOT NULL DEFAULT 'internal',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transfer_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      transaction_id INT NOT NULL,
      state VARCHAR(40) NOT NULL,
      note VARCHAR(255) NULL,
      actor_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX transfer_events_tx (transaction_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      channel VARCHAR(20) NOT NULL,
      event_key VARCHAR(60) NOT NULL,
      subject VARCHAR(200) NULL,
      body TEXT NULL,
      status VARCHAR(30) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      actor_id INT NULL,
      action VARCHAR(80) NOT NULL,
      entity_type VARCHAR(40) NULL,
      entity_id VARCHAR(40) NULL,
      old_value TEXT NULL,
      new_value TEXT NULL,
      result VARCHAR(20) NOT NULL DEFAULT 'ok',
      reason VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reconciliation_runs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      actor_id INT NULL,
      summary_json JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await seedCorridors(pool);
  await seedPartners(pool);
  await seedWatchlist(pool);
}

async function seedCorridors(pool) {
  const conditions = 'Les fonds sont envoyés après réception et vérification du paiement.';
  const rows = [
    ['Canada', 'Cameroun', 'XAF', 445, 0, 0, 1, '1 à 24 heures', 1],
    ['Canada', "Côte d'Ivoire", 'XOF', 440, 0, 0, 1, '1 à 48 heures', 1],
    ['Canada', 'Sénégal', 'XOF', 430, 0, 0, 1, '1 à 48 heures', 1],
    ['Canada', 'Gabon', 'XAF', 445, 0, 0, 1, '1 à 48 heures', 1],
    ['Canada', 'Congo', 'XAF', 440, 0, 0, 1, '1 à 48 heures', 1],
    ['Cameroun', 'Canada', 'CAD', 0.0022, 0, 2, 1, '2 à 5 jours', 0],
  ];
  for (const [origin, destination, currency, rate, margin, feeFixed, feePercent, eta, active] of rows) {
    await pool.query(
      `INSERT INTO corridors
        (origin_country, destination_country, destination_currency, fx_rate, fx_margin, fee_fixed, fee_percent, eta, conditions_text, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE destination_country = destination_country`,
      [origin, destination, currency, rate, margin, feeFixed, feePercent, eta, conditions, active]
    );
  }
}

async function seedPartners(pool) {
  const rows = [
    ['interac-ca', 'Interac', 'canada', 'payment', 'Canada'],
    ['bank-ca', 'Virement bancaire', 'canada', 'payment', 'Canada'],
    ['mm-cm', 'Mobile Money Cameroun', 'destination', 'payout', 'Cameroun'],
    ['bank-cm', 'Banque Cameroun', 'destination', 'payout', 'Cameroun'],
  ];
  for (const [code, name, side, kind, country] of rows) {
    await pool.query(
      `INSERT INTO partners (code, name, side, kind, country, status, credentials_ref, settings_json)
       VALUES (?, ?, ?, ?, ?, 'active', ?, JSON_OBJECT('adapter', 'stub'))
       ON DUPLICATE KEY UPDATE name = name`,
      [code, name, side, kind, country, `env:${code.toUpperCase().replace(/-/g, '_')}`]
    );
  }
}

async function seedWatchlist(pool) {
  const [rows] = await pool.query('SELECT id FROM watchlist LIMIT 1');
  if (rows.length) return;
  await pool.query(
    'INSERT INTO watchlist (full_name, list_type, note) VALUES (?, ?, ?), (?, ?, ?)',
    ['Sanctioned Person', 'sanctions', 'Exemple de liste interne', 'Pep Example', 'pep', 'Exemple PEP']
  );
}
