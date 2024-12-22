const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();
const authenticateJWT = require('../middleware/auth');
const {body, validationResult} = require('express-validator');


router.post('/register',[ 
    // cheking the mandatory fields
    body('name').notEmpty().withMessage('Le nom est obligatoire'),
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({min: 6}).withMessage('Le mot de passe doit contenir au moins 6 caractères')
], userController.register);

router.post('/login', userController.login);
router.get('/:id', authenticateJWT, userController.getUserById);
router.get('/', authenticateJWT, userController.getAllUsers);
router.put('/profile', authenticateJWT, userController.updateUserProfile);
router.delete('/profile', authenticateJWT, userController.deleteUserProfile);
router.post('/refresh-token', userController.refreshToken);

module.exports = router;