// routes/authRoutes.ts
import express from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/verify', authController.verify);
router.get('/profile', authenticate, authController.getProfile);
router.get('/:token', authController.getUserSession);

export default router;