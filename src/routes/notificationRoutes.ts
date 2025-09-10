// routes/notificationRoutes.ts
import express from 'express';
import { notificationController } from '../controllers/notification.controller';
// import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', notificationController.getNotifications);
router.post('/', notificationController.createNotification);
router.get('/:id', notificationController.getNotificationById);
router.put('/:id', notificationController.updateNotification);
router.delete('/:id', notificationController.deleteNotification);

// Routes spécifiques
router.get('/user/:userId', notificationController.getUserNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/:id/unread', notificationController.markAsUnread);
router.patch('/read-all', notificationController.markAllAsRead);
router.get('/unread/count/:userId', notificationController.getUnreadCount);
router.get('/stats/notifications', notificationController.getNotificationStats);

export default router;