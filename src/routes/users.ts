// routes/userRoutes.ts (extension)
import express from 'express';
import { userController } from '../controllers/user.controller';
import { notificationController } from '../controllers/notification.controller';
// import { authenticate } from '../middleware/auth';

const router = express.Router();

// Routes existantes pour les utilisateurs...
router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Routes pour les notifications d'un utilisateur spécifique
router.get('/:userId/notifications', notificationController.getUserNotifications);
router.patch('/:userId/notifications/read-all', notificationController.markAllAsRead);
router.get('/:userId/notifications/unread-count', notificationController.getUnreadCount);

export default router;