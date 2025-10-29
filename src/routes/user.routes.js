import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { checkRole } from '../middlewares/role.middleware.js';
import {
  getAllUsers,
  blockUser,
  unblockUser,
} from '../controllers/user.controller.js';

const router = Router();

// All Admin routes 
router.use(verifyToken, checkRole('ADMIN'));

// GET /api/users user list
router.get('/', getAllUsers);

// PATCH /api/users/:id/block locks user
router.patch('/:id/block', blockUser);

// PATCH /api/users/:id/unblock unlocks user
router.patch('/:id/unblock', unblockUser);

export default router;