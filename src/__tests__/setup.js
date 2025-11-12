/**
 * Test Setup & Helpers
 * Utilities comuni per tutti i test
 */

import { User, Event, Registration, Report } from '../models/index.js';
import { generateToken } from '../utils/token.js';
import argon2 from 'argon2';

/**
 * Pulisce il database prima di ogni test
 */
export async function cleanDatabase() {
  await Report.destroy({ where: {}, force: true });
  await Registration.destroy({ where: {}, force: true });
  await Event.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
}

/**
 * Crea un utente di test
 */
export async function createTestUser(overrides = {}) {
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password_hash: await argon2.hash('password123'),
    role: 'USER',
    email_verified: true,
    is_blocked: false,
  };

  return await User.create({ ...defaultUser, ...overrides });
}

/**
 * Crea un admin di test
 */
export async function createTestAdmin(overrides = {}) {
  return await createTestUser({
    username: 'admin',
    email: 'admin@example.com',
    role: 'ADMIN',
    ...overrides,
  });
}

/**
 * Crea un evento di test
 */
export async function createTestEvent(creatorId, overrides = {}) {
  const defaultEvent = {
    title: 'Test Event',
    description: 'Test event description',
    category: 'music',
    location: 'Test Location',
    date: new Date('2025-12-31'),
    capacity: 100,
    status: 'APPROVED',
    creator_id: creatorId,
  };

  return await Event.create({ ...defaultEvent, ...overrides });
}

/**
 * Genera JWT token per test
 */
export function generateTestToken(user) {
  return generateToken(user);
}

/**
 * Crea header Authorization per test
 */
export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Mock Socket.IO per test
 */
export function mockSocketIO() {
  return {
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    on: jest.fn(),
  };
}
