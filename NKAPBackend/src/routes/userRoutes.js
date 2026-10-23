import express from 'express';
import * as userController from '../controllers/userController.js';
import * as mfaController from '../controllers/mfaController.js';
import authenticateJWT from '../middleware/auth.js';
import checkUserStatus from '../middleware/checkUserStatus.js';
import { isAdmin } from '../middleware/verifyAdmin.js';

const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', authenticateJWT, userController.logout);
router.post('/refresh-token', userController.refreshToken);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

router.get('/profile', authenticateJWT, checkUserStatus, userController.getUserProfile);
router.put('/profile', authenticateJWT, checkUserStatus, userController.updateUserProfile);
router.post('/update-password', authenticateJWT, checkUserStatus, userController.updatePassword);
router.post('/mfa/setup', authenticateJWT, checkUserStatus, mfaController.setupMfa);
router.post('/mfa/confirm', authenticateJWT, checkUserStatus, mfaController.confirmMfa);
router.post('/mfa/disable', authenticateJWT, checkUserStatus, mfaController.disableMfa);
router.post('/mfa/verify', mfaController.verifyMfa);

router.get('/', authenticateJWT, isAdmin, userController.getAllUsers);
router.get('/export-users', authenticateJWT, isAdmin, userController.exportUsers);
router.put('/block-user/:id', authenticateJWT, isAdmin, userController.blockUser);
router.put('/unblock-user/:id', authenticateJWT, isAdmin, userController.unblockUser);

export default router;
