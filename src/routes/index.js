import { Router } from 'express';
import authRoutes from './auth.routes.js';

const router = Router();

router.get('/', async (req, res) => {
  res.json({ message: 'Welcome to EventHub API!' });
});


router.use('/auth', authRoutes);

router.get('/boom', async (req, res) => {
  throw new Error('crash');
});

export default router;