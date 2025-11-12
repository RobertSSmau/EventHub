/**
 * Event Controller Tests
 * Test per creazione, modifica, approvazione eventi
 */

import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import {
  cleanDatabase,
  createTestUser,
  createTestAdmin,
  createTestEvent,
  generateTestToken,
  authHeader,
} from '../../__tests__/setup.js';

describe('Event Controller', () => {
  let user, admin, userToken, adminToken;

  beforeEach(async () => {
    await cleanDatabase();
    user = await createTestUser();
    admin = await createTestAdmin();
    userToken = generateTestToken(user);
    adminToken = generateTestToken(admin);
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/events', () => {
    test('should create event successfully', async () => {
      const eventData = {
        title: 'New Concert',
        description: 'Amazing concert',
        category: 'music',
        location: 'Milano',
        date: '2025-12-31T20:00:00Z',
        capacity: 500,
      };

      const res = await request(app)
        .post('/api/events')
        .set(authHeader(userToken))
        .send(eventData)
        .expect(201);

      expect(res.body.event.title).toBe(eventData.title);
      expect(res.body.event.status).toBe('PENDING');
      expect(res.body.event.creator_id).toBe(user.id);
    });

    test('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/events')
        .send({ title: 'Event' })
        .expect(401);

      expect(res.body.message).toBe('No token provided');
    });

    test('should fail with invalid data', async () => {
      const res = await request(app)
        .post('/api/events')
        .set(authHeader(userToken))
        .send({ title: 'No description' })
        .expect(400);

      expect(res.body).toHaveProperty('validation');
    });
  });

  describe('GET /api/events', () => {
    test('should return only approved events', async () => {
      await createTestEvent(user.id, { status: 'APPROVED', title: 'Approved' });
      await createTestEvent(user.id, { status: 'PENDING', title: 'Pending' });
      await createTestEvent(user.id, { status: 'REJECTED', title: 'Rejected' });

      const res = await request(app).get('/api/events').expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Approved');
    });

    test('should filter by category', async () => {
      await createTestEvent(user.id, { category: 'music', title: 'Concert' });
      await createTestEvent(user.id, { category: 'sport', title: 'Match' });

      const res = await request(app)
        .get('/api/events?category=music')
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].category).toBe('music');
    });

    test('should filter by location', async () => {
      await createTestEvent(user.id, { location: 'Milano' });
      await createTestEvent(user.id, { location: 'Roma' });

      const res = await request(app)
        .get('/api/events?location=Milano')
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].location).toBe('Milano');
    });
  });

  describe('GET /api/events/:id', () => {
    test('should return event by id', async () => {
      const event = await createTestEvent(user.id);

      const res = await request(app)
        .get(`/api/events/${event.id}`)
        .expect(200);

      expect(res.body.id).toBe(event.id);
      expect(res.body.title).toBe(event.title);
    });

    test('should return 404 for non-existent event', async () => {
      const res = await request(app).get('/api/events/99999').expect(404);

      expect(res.body.message).toBe('Event not found');
    });
  });

  describe('PUT /api/events/:id', () => {
    test('should update event as creator', async () => {
      const event = await createTestEvent(user.id);

      const res = await request(app)
        .put(`/api/events/${event.id}`)
        .set(authHeader(userToken))
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(res.body.event.title).toBe('Updated Title');
    });

    test('should fail to update other user event', async () => {
      const otherUser = await createTestUser({
        email: 'other@test.com',
        username: 'other',
      });
      const event = await createTestEvent(otherUser.id);

      const res = await request(app)
        .put(`/api/events/${event.id}`)
        .set(authHeader(userToken))
        .send({ title: 'Hacked' })
        .expect(403);

      expect(res.body.message).toBe('Not authorized to update this event');
    });
  });

  describe('DELETE /api/events/:id', () => {
    test('should delete own event', async () => {
      const event = await createTestEvent(user.id);

      await request(app)
        .delete(`/api/events/${event.id}`)
        .set(authHeader(userToken))
        .expect(200);
    });

    test('admin should delete any event', async () => {
      const event = await createTestEvent(user.id);

      await request(app)
        .delete(`/api/events/${event.id}`)
        .set(authHeader(adminToken))
        .expect(200);
    });

    test('should fail to delete other user event', async () => {
      const otherUser = await createTestUser({
        email: 'other@test.com',
        username: 'other',
      });
      const event = await createTestEvent(otherUser.id);

      const res = await request(app)
        .delete(`/api/events/${event.id}`)
        .set(authHeader(userToken))
        .expect(403);

      expect(res.body.message).toBe('Not authorized to delete this event');
    });
  });

  describe('PATCH /api/events/:id/approve', () => {
    test('admin should approve event', async () => {
      const event = await createTestEvent(user.id, { status: 'PENDING' });

      const res = await request(app)
        .patch(`/api/events/${event.id}/approve`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(res.body.event.status).toBe('APPROVED');
    });

    test('non-admin should fail to approve', async () => {
      const event = await createTestEvent(user.id, { status: 'PENDING' });

      const res = await request(app)
        .patch(`/api/events/${event.id}/approve`)
        .set(authHeader(userToken))
        .expect(403);

      expect(res.body.message).toContain('ADMIN');
    });
  });

  describe('PATCH /api/events/:id/reject', () => {
    test('admin should reject event', async () => {
      const event = await createTestEvent(user.id, { status: 'PENDING' });

      const res = await request(app)
        .patch(`/api/events/${event.id}/reject`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(res.body.event.status).toBe('REJECTED');
    });
  });

  describe('GET /api/events/mine', () => {
    test('should return only current user events', async () => {
      await createTestEvent(user.id, { title: 'My Event 1' });
      await createTestEvent(user.id, { title: 'My Event 2' });

      const otherUser = await createTestUser({
        email: 'other@test.com',
        username: 'other',
      });
      await createTestEvent(otherUser.id, { title: 'Other Event' });

      const res = await request(app)
        .get('/api/events/mine')
        .set(authHeader(userToken))
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body.every((e) => e.creator_id === user.id)).toBe(true);
    });
  });
});
