import 'dotenv/config';
import app from './src/app.js';
import pool from './src/config/db.js';
import { ensureSchema } from './src/config/schema.js';

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET || !process.env.JWT_SECRET_REFRESH) {
  console.error('JWT_SECRET et JWT_SECRET_REFRESH sont requis dans .env');
  process.exit(1);
}

ensureSchema(pool)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Serveur NKAP démarré sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Impossible de préparer la base de données:', err.message);
    process.exit(1);
  });
