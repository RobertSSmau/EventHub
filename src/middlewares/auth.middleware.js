/**
 * @file auth.middleware.js
 * @description Middleware to verify JWT tokens and ensure the user is active.
 * @module middlewares/auth
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv-safe';
import { User } from '../models/index.js';
import { isBlacklisted } from '../utils/tokenBlacklist.js';

dotenv.config();

/**
 * Middleware that verifies a JWT token and ensures the user exists and is not blocked.
 * 
 * @async
 * @function verifyToken
 * @param {import('express').Request} req
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 * @returns {Promise<void>}
 */
export async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Ensure Authorization header exists and has Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Extract and verify JWT
    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted
    if (await isBlacklisted(token)) {
      return res.status(401).json({ message: 'Token has been revoked' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB to check if still active
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'role', 'is_blocked'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.is_blocked) {
      return res.status(403).json({ message: 'User account is blocked' });
    }

    // Attach user data and token to request
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    req.token = token; // Store token for logout

    next();
  } catch (err) {
    console.error('JWT verification error:', err.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication middleware - verifies token if present, but allows request to continue without it
 * Useful for routes that have different behavior for authenticated vs non-authenticated users
 * 
 * @async
 * @function optionalAuth
 * @param {import('express').Request} req
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 * @returns {Promise<void>}
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // If no token provided, continue without user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    // Extract and verify JWT
    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted
    if (await isBlacklisted(token)) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB to check if still active
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'role', 'is_blocked'],
    });

    if (!user || user.is_blocked) {
      req.user = null;
      return next();
    }

    // Attach user data to request
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (err) {
    // On any error, just continue without authentication
    req.user = null;
    next();
  }
}
