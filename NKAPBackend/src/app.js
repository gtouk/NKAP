import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/userRoutes.js';
import transactionRoutes from './routes/transactionRoute.js';
import adminRoutes from './routes/adminRoutes.js';
import { transfers, beneficiaries, kyc, office } from './routes/platformRoutes.js';
import errorMiddleware from './middleware/errorMiddleware.js';

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '0');
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

if (process.env.NODE_ENV !== 'test') {
  app.use('/api/users/login', authLimiter);
  app.use('/api/users/forgot-password', authLimiter);
}

app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/transfers', transfers);
app.use('/api/beneficiaries', beneficiaries);
app.use('/api/kyc', kyc);
app.use('/api/office', office);

app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable' });
});

app.use(errorMiddleware);

export default app;
