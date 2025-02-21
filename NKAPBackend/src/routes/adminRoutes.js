const express = require('express');
const adminController = require('../controllers/adminController');
const router = express.Router();
const authenticateJWT = require('../middleware/auth');
const {body, validationResult} = require('express-validator');
const {isSuperAdmin, isAdmin} = require('../middleware/verifyAdmin');



// Route to create an admin
router.post('/createAdmin', authenticateJWT, isAdmin, [
    // Validate the fields
    body('name').isString().isLength({ min: 3 }),
    body('email').isEmail(),
    body('phone').isMobilePhone(),
    body('password').isLength({ min: 6 }),
    body('passwordConfirm').isLength({ min: 6 }),
    body('role').isString().isIn(['admin', 'superAdmin'])
], adminController.createAdmin);

module.exports = router;

