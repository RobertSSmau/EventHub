/**
 * @openapi
 * tags:
 *   name: System
 *   description: API health and root endpoints
 */

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/users', userRoutes);

router.get('/', async (req, res) => {
  res.json({ message: 'Welcome to EventHub API!' });
});

router.use('/auth', authRoutes);

router.get('/boom', async (req, res) => {
  throw new Error('crash');
});

export default router;