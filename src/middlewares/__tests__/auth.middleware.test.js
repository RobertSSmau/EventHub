/**
 * Auth Middleware Tests
 * Test per verifica JWT e autenticazione
 */

import { describe, test, expect, beforeEach, afterAll, jest } from '@jest/globals';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { User } from '../../models/index.js';
import { generateToken } from '../../utils/token.js';
import { addToBlacklist } from '../../utils/tokenBlacklist.js';
import { cleanDatabase, createTestUser } from '../../__tests__/setup.js';

describe('Auth Middleware', () => {
  let user, token;

  beforeEach(async () => {
    await cleanDatabase();
    user = await createTestUser();
    token = generateToken(user);
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  test('should verify valid token', async () => {
    const req = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res = {};
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(user.id);
    expect(req.user.username).toBe(user.username);
    expect(req.token).toBe(token);
  });

  test('should reject missing token', async () => {
    const req = { headers: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'No token provided',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject invalid token format', async () => {
    const req = {
      headers: { authorization: 'InvalidFormat' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'No token provided',
    });
  });

  test('should reject invalid token', async () => {
    const req = {
      headers: { authorization: 'Bearer invalid.jwt.token' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid or expired token',
    });
  });

  test('should reject blacklisted token', async () => {
    await addToBlacklist(token);

    const req = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Token has been revoked',
    });
  });

  test('should reject blocked user', async () => {
    await user.update({ is_blocked: true });

    const req = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User account is blocked',
    });
  });

  test('should reject token for deleted user', async () => {
    await User.destroy({ where: { id: user.id } });

    const req = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User not found',
    });
  });
});
