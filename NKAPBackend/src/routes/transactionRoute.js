const express = require('express');
const transactionController = require('../controllers/transactionController');
const router = express.Router();
const authenticateJWT = require('../middleware/auth');
const {body, validationResult} = require('express-validator');
const db = require('../config/db');


router.post('/transactions',  transactionController.transactions);
router.get('/get-transactions', authenticateJWT, transactionController.getTransactions);

router.post('/send-email', authenticateJWT, transactionController.sendEmail);

module.exports = router;