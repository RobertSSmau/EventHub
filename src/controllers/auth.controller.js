import argon2 from 'argon2';
import { User } from '../models/index.js';
import { generateToken } from '../utils/token.js';
import { addToBlacklist } from '../utils/tokenBlacklist.js';

export async function register(req, res) {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser)
    return res.status(400).json({ message: 'Email already in use' });

  const password_hash = await argon2.hash(password);
  const newUser = await User.create({ username, email, password_hash });

  const token = generateToken(newUser);
  res.status(201).json({ message: 'User registered', token });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.is_blocked)
    return res.status(403).json({ message: 'User account is blocked' });

  const valid = await argon2.verify(user.password_hash, password);
  if (!valid) return res.status(401).json({ message: 'Invalid password' });

  const token = generateToken(user);
  res.json({ message: 'Login successful', token });
}

/**
 * @desc Logout user by blacklisting current token
 * @route POST /api/auth/logout
 */
export async function logout(req, res) {
  const token = req.token;
  if (!token) return res.status(400).json({ message: 'No token found' });

  await addToBlacklist(token);
  res.json({ message: 'Logout successful' });
}
