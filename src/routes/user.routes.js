/**
 * @openapi
 * tags:
 *   name: Users
 *   description: Admin-only user management
 */

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

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns list of users
 *       403:
 *         description: Access denied (not admin)
 */
router.get('/', getAllUsers);

/**
 * @openapi
 * /users/{id}/block:
 *   patch:
 *     summary: Block a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 3
 *     responses:
 *       200:
 *         description: User blocked successfully
 *       404:
 *         description: User not found
 */
router.patch('/:id/block', blockUser);


/**
 * @openapi
 * /users/{id}/unblock:
 *   patch:
 *     summary: Unblock a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 3
 *     responses:
 *       200:
 *         description: User unblocked successfully
 *       404:
 *         description: User not found
 */
router.patch('/:id/unblock', unblockUser);

export default router;