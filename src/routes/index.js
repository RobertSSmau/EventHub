/**
 * @openapi
 * tags:
 *   name: System
 *   description: API health and root endpoints
 */

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import eventRoutes from './event.routes.js';
import registrationRoutes from './registration.routes.js';
import reportRoutes from './report.routes.js';
import chatRoutes from './chat.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

router.use('/users', userRoutes);

router.get('/', async (req, res) => {
  res.json({ message: 'Welcome to EventHub API!' });
});

router.use('/events', eventRoutes);

router.use('/registrations', registrationRoutes);

router.use('/auth', authRoutes);

router.use('/reports', reportRoutes);

router.use('/chat', chatRoutes);

router.use('/notifications', notificationRoutes);

export default router;