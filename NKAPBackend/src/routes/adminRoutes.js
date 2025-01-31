const express = require('express');
const adminController = require('../controllers/adminController');
const router = express.Router();
const authenticateJWT = require('../middleware/auth');
const {body, validationResult} = require('express-validator');

router.post('/register', 
      adminController.register);

      module.exports = router;