import express from 'express';
import { getNotifications, markAsRead, getNotificationCount } from '../controllers/notification.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get user's notifications
router.get('/', getNotifications);

// Get notification count
router.get('/count', getNotificationCount);

// Mark notification as read
router.put('/:id/read', markAsRead);

export default router;