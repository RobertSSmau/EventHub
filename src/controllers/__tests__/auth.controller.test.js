/**
 * Auth Controller Tests
 * Test per registrazione, login, logout
 */

import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { User } from '../../models/index.js';
import { cleanDatabase, createTestUser } from '../../__tests__/setup.js';
import argon2 from 'argon2';

describe('Auth Controller', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'Password123!',  // Must meet security requirements
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body.user.username).toBe(userData.username);
      expect(res.body.user.role).toBe('USER');
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    test('should fail with duplicate email', async () => {
      await createTestUser({ email: 'duplicate@test.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'another',
          email: 'duplicate@test.com',
          password: 'pass123',
        })
        .expect(400);

      // Celebrate returns "Validation failed" message with details in validation array
      expect(res.body.message).toBe('Validation failed');
    });

    test('should fail with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test',
          email: 'not-an-email',
          password: 'pass123',
        })
        .expect(400);

      expect(res.body).toHaveProperty('validation');
    });

    test('should fail with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test',
          email: 'test@test.com',
          password: '123',
        })
        .expect(400);

      expect(res.body).toHaveProperty('validation');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with correct credentials', async () => {
      const password = 'mypassword123';
      const user = await createTestUser({
        email: 'login@test.com',
        password_hash: await argon2.hash(password),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: password,
        })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.id).toBe(user.id);
      expect(res.body.message).toBe('Login successful');
    });

    test('should fail with wrong password', async () => {
      await createTestUser({
        email: 'user@test.com',
        password_hash: await argon2.hash('correctpassword'),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(res.body.message).toBe('Invalid password');
    });

    test('should fail with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'somepassword',
        })
        .expect(404);

      expect(res.body.message).toBe('User not found');
    });

    test('should fail with blocked user', async () => {
      const password = 'password123';
      await createTestUser({
        email: 'blocked@test.com',
        password_hash: await argon2.hash(password),
        is_blocked: true,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'blocked@test.com',
          password: password,
        })
        .expect(403);

      expect(res.body.message).toBe('User account is blocked');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully', async () => {
      const password = 'password123';
      const user = await createTestUser({
        password_hash: await argon2.hash(password),
      });
      
      const token = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: password,
        })
        .then((res) => res.body.token);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Logout successful');
    });

    test('should fail without token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(res.body.message).toBe('No token provided');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    test('should send reset link for existing user', async () => {
      await createTestUser({ email: 'reset@test.com' });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'reset@test.com' })
        .expect(200);

      expect(res.body.message).toContain('reset link');
    });

    test('should not reveal if email does not exist', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(200);

      expect(res.body.message).toContain('reset link');
    });
  });
});
