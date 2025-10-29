import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  res.json({ message: 'Welcome to EventHub API!' });
});

router.get('/boom', async (req, res) => {
  throw new Error('crash');
});

export default router;