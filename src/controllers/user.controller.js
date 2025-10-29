import { User } from '../models/index.js';

/**
 * GET /api/users
 * Shows all users as admin
 */
export async function getAllUsers(req, res) {
  const users = await User.findAll({
    attributes: ['id', 'username', 'email', 'role', 'is_blocked', 'created_at'],
    order: [['created_at', 'DESC']],
  });
  res.json(users);
}

/**
 * PATCH /api/users/:id/block
 * Blocks user
 */
export async function blockUser(req, res) {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.role === 'ADMIN')
    return res.status(403).json({ message: 'Cannot block another admin' });

  user.is_blocked = true;
  await user.save();

  res.json({ message: `User ${user.username} blocked successfully.` });
}

/**
 * PATCH /api/users/:id/unblock
 * Unblocks User
 */
export async function unblockUser(req, res) {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.is_blocked = false;
  await user.save();

  res.json({ message: `User ${user.username} unblocked successfully.` });
}