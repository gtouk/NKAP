-- Schéma cible de NKAP.
-- Au démarrage, le serveur ajoute les colonnes manquantes sur une base déjà créée.
-- Pour une installation vide, créez la base puis laissez le serveur appliquer ce schéma,
-- ou exécutez les CREATE TABLE ci-dessous.

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(191) NULL UNIQUE,
    firstName VARCHAR(100) NULL,
    lastName VARCHAR(100) NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NULL,
    country VARCHAR(100) NULL,
    gender VARCHAR(20) NULL,
    birthDate DATE NULL,
    street VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    postalCode VARCHAR(20) NULL,
    wallet DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    blockedUntil DATETIME NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    refresh_token TEXT NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expires DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type ENUM('deposit', 'withdrawal', 'transfer', 'bill') NOT NULL DEFAULT 'transfer',
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    recipient_name VARCHAR(150) NULL,
    method VARCHAR(50) NULL,
    accountNumber VARCHAR(80) NULL,
    recipientTown VARCHAR(100) NULL,
    recipientAddress VARCHAR(255) NULL,
    reasonOfSending VARCHAR(255) NULL,
    amount_received DECIMAL(14, 2) NULL,
    sending_country VARCHAR(100) NULL,
    receiving_country VARCHAR(100) NULL,
    currency_sent VARCHAR(10) NULL,
    currency_received VARCHAR(10) NULL,
    transactionState VARCHAR(20) NULL,
    transaction_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
