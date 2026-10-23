import express from 'express';
import * as transactionController from '../controllers/transactionController.js';
import authenticateJWT from '../middleware/auth.js';
import checkUserStatus from '../middleware/checkUserStatus.js';

const router = express.Router();

router.post('/transactions', authenticateJWT, checkUserStatus, transactionController.createTransaction);
router.post('/facture', authenticateJWT, checkUserStatus, transactionController.payBill);
router.get('/get-transactions', authenticateJWT, transactionController.getTransactions);
router.get('/recipients', authenticateJWT, transactionController.getRecipients);
router.post('/send-email', authenticateJWT, transactionController.sendEmail);
router.post('/send-mail', authenticateJWT, transactionController.sendMail);

export default router;
