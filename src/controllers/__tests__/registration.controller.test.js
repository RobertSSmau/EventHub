/**
 * Registration Controller Tests
 * Test per iscrizioni eventi
 */

import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import {
  cleanDatabase,
  createTestUser,
  createTestEvent,
  generateTestToken,
  authHeader,
} from '../../__tests__/setup.js';
import { Registration } from '../../models/index.js';

describe('Registration Controller', () => {
  let user, creator, event, userToken, creatorToken;

  beforeEach(async () => {
    await cleanDatabase();
    
    user = await createTestUser({ email: 'user@test.com', username: 'user' });
    creator = await createTestUser({ email: 'creator@test.com', username: 'creator' });
    
    event = await createTestEvent(creator.id, {
      title: 'Test Event',
      status: 'APPROVED',
      capacity: 10,
    });

    userToken = generateTestToken(user);
    creatorToken = generateTestToken(creator);
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/registrations/:eventId', () => {
    test('should register to event successfully', async () => {
      const res = await request(app)
        .post(`/api/registrations/${event.id}`)
        .set(authHeader(userToken))
        .expect(201);

      expect(res.body.message).toBe('Registration successful');
      expect(res.body.registration.user_id).toBe(user.id);
      expect(res.body.registration.event_id).toBe(event.id);

      // Verify in database
      const registration = await Registration.findOne({
        where: { user_id: user.id, event_id: event.id },
      });
      expect(registration).not.toBeNull();
    });

    test('should fail if already registered', async () => {
      await Registration.create({ user_id: user.id, event_id: event.id });

      const res = await request(app)
        .post(`/api/registrations/${event.id}`)
        .set(authHeader(userToken))
        .expect(400);

      expect(res.body.message).toBe('Already registered to this event');
    });

    test('should fail if event is full', async () => {
      // Create event with capacity 1
      const smallEvent = await createTestEvent(creator.id, {
        capacity: 1,
        status: 'APPROVED',
      });

      // Fill the event
      const otherUser = await createTestUser({
        email: 'other@test.com',
        username: 'other',
      });
      await Registration.create({ user_id: otherUser.id, event_id: smallEvent.id });

      // Try to register
      const res = await request(app)
        .post(`/api/registrations/${smallEvent.id}`)
        .set(authHeader(userToken))
        .expect(400);

      expect(res.body.message).toBe('Event is full');
    });

    test('should fail if event not approved', async () => {
      const pendingEvent = await createTestEvent(creator.id, {
        status: 'PENDING',
      });

      const res = await request(app)
        .post(`/api/registrations/${pendingEvent.id}`)
        .set(authHeader(userToken))
        .expect(404);

      expect(res.body.message).toBe('Event not found or not approved');
    });

    test('should fail without authentication', async () => {
      const res = await request(app)
        .post(`/api/registrations/${event.id}`)
        .expect(401);

      expect(res.body.message).toBe('No token provided');
    });
  });

  describe('DELETE /api/registrations/:eventId', () => {
    beforeEach(async () => {
      // Pre-register user
      await Registration.create({ user_id: user.id, event_id: event.id });
    });

    test('should unregister successfully', async () => {
      const res = await request(app)
        .delete(`/api/registrations/${event.id}`)
        .set(authHeader(userToken))
        .expect(200);

      expect(res.body.message).toBe('Unregistered successfully');

      // Verify in database
      const registration = await Registration.findOne({
        where: { user_id: user.id, event_id: event.id },
      });
      expect(registration).toBeNull();
    });

    test('should fail if not registered', async () => {
      await Registration.destroy({ where: { user_id: user.id } });

      const res = await request(app)
        .delete(`/api/registrations/${event.id}`)
        .set(authHeader(userToken))
        .expect(404);

      expect(res.body.message).toBe('Not registered to this event');
    });
  });

  describe('GET /api/registrations/mine', () => {
    test('should return user registrations', async () => {
      const event1 = await createTestEvent(creator.id, { title: 'Event 1' });
      const event2 = await createTestEvent(creator.id, { title: 'Event 2' });

      await Registration.create({ user_id: user.id, event_id: event1.id });
      await Registration.create({ user_id: user.id, event_id: event2.id });

      const res = await request(app)
        .get('/api/registrations/mine')
        .set(authHeader(userToken))
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].event).toBeDefined();
      expect(res.body[0].event.title).toBeDefined();
    });

    test('should return empty array if no registrations', async () => {
      const res = await request(app)
        .get('/api/registrations/mine')
        .set(authHeader(userToken))
        .expect(200);

      expect(res.body).toHaveLength(0);
    });
  });
});
