import express from 'express';
import { body } from 'express-validator';
import { createAdmin } from '../controllers/adminController.js';
import authenticateJWT from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { isAdmin } from '../middleware/verifyAdmin.js';

const router = express.Router();

router.post(
  '/createAdmin',
  authenticateJWT,
  isAdmin,
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Le nom est obligatoire'),
    body('email').isEmail().withMessage('Email invalide'),
    body('phone').trim().isLength({ min: 6 }).withMessage('Téléphone invalide'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    body('passwordConfirm')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Les mots de passe ne correspondent pas'),
    body('role').isIn(['admin', 'superAdmin']).withMessage('Rôle invalide'),
  ],
  validate,
  createAdmin
);

export default router;
