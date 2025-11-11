/**
 * @openapi
 * tags:
 *   name: Registrations
 *   description: Manage event registrations (subscribe/unsubscribe)
 */

import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  registerToEvent,
  unregisterFromEvent,
  getMyRegistrations,
} from '../controllers/registration.controller.js';
import { registrationLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @openapi
 * /registrations/mine:
 *   get:
 *     summary: Get all events the user is registered to
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns list of registered events
 */
router.get('/mine', getMyRegistrations);

/**
 * @openapi
 * /registrations/{eventId}:
 *   post:
 *     summary: Register to an event
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: eventId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Registration successful
 */
router.post('/:eventId', registrationLimiter, registerToEvent);

/**
 * @openapi
 * /registrations/{eventId}:
 *   delete:
 *     summary: Unregister from an event
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: eventId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Unregistered successfully
 */
router.delete('/:eventId', unregisterFromEvent);

export default router;
