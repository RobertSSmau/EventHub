/**
 * @file event.routes.js
 * @description Routes for event management (create, update, approve, etc.)
 * @module routes/events
 */

import { Router } from 'express';
import { celebrate, Joi, errors } from 'celebrate';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { checkRole } from '../middlewares/role.middleware.js';
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  approveEvent,
  rejectEvent,
  getMyEvents,
} from '../controllers/event.controller.js';
import { getEventParticipants } from '../controllers/event.controller.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Events
 *   description: Manage and view events
 */

/**
 * @openapi
 * /events:
 *   get:
 *     summary: Get all approved events (public)
 *     tags: [Events]
 *     parameters:
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by event category
 *       - name: location
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by event location
 *       - name: date
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by event date
 *     responses:
 *       200:
 *         description: Returns list of approved events
 */
router.get('/', getAllEvents);

/**
 * @openapi
 * /events:
 *   post:
 *     summary: Create a new event (authenticated users only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - location
 *               - date
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               location:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               capacity:
 *                 type: integer
 *                 example: 100
 *               image_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event created successfully
 *       401:
 *         description: Unauthorized (no token provided)
 */
router.post(
  '/',
  verifyToken,
  celebrate({
    body: Joi.object({
      title: Joi.string().min(3).required(),
      description: Joi.string().min(10).required(),
      category: Joi.string().required(),
      location: Joi.string().required(),
      date: Joi.date().iso().required(),
      capacity: Joi.number().integer().min(1),
      image_url: Joi.string().uri().optional(),
    }),
  }),
  createEvent
);

/**
 * @openapi
 * /events/mine:
 *   get:
 *     summary: Get events created by the logged-in user
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns user’s own events
 */
router.get('/mine', verifyToken, getMyEvents);

/**
 * @openapi
 * /events/{id}:
 *   get:
 *     summary: Get single event by ID
 *     tags: [Events]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event found
 *       404:
 *         description: Event not found
 */
router.get('/:id', getEventById);

/**
 * @openapi
 * /events/{id}:
 *   put:
 *     summary: Update an existing event (creator or admin)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               location:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               capacity:
 *                 type: integer
 *               image_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Event not found
 */
router.put('/:id', verifyToken, updateEvent);

/**
 * @openapi
 * /events/{id}:
 *   delete:
 *     summary: Delete an event (creator or admin)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Event not found
 */
router.delete('/:id', verifyToken, deleteEvent);

/**
 * @openapi
 * /events/{id}/approve:
 *   patch:
 *     summary: Approve an event (Admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event approved
 *       403:
 *         description: Access denied
 *       404:
 *         description: Event not found
 */
router.patch('/:id/approve', verifyToken, checkRole('ADMIN'), approveEvent);

/**
 * @openapi
 * /events/{id}/reject:
 *   patch:
 *     summary: Reject an event (Admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event rejected
 *       403:
 *         description: Access denied
 *       404:
 *         description: Event not found
 */
router.patch('/:id/reject', verifyToken, checkRole('ADMIN'), rejectEvent);

/**
 * @openapi
 * /events/{id}/participants:
 *   get:
 *     summary: Get all participants of a specific event
 *     description: Returns the list of users registered to an event. Only the event creator, an admin, or participants of the event can view this list.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the event
 *     responses:
 *       200:
 *         description: Returns list of participants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 3
 *                   username:
 *                     type: string
 *                     example: "mario"
 *                   email:
 *                     type: string
 *                     example: "mario@mail.com"
 *                   registered_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-10-30T10:21:05.321Z"
 *       403:
 *         description: Not authorized to view participants
 *       404:
 *         description: Event not found
 */
router.get('/:id/participants', verifyToken, getEventParticipants);

router.use(errors());
export default router;
