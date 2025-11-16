/**
 * @openapi
 * tags:
 *   name: Chat
 *   description: Chat and messaging functionality
 */

import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import {
  getMyConversations,
  createDirectConversation,
  createEventConversation,
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  deleteMessage,
  editMessage,
  getOnlineUsers,
} from '../controllers/chat.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @openapi
 * /chat/conversations:
 *   get:
 *     summary: Get all conversations for current user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/conversations', getMyConversations);

/**
 * @openapi
 * /chat/conversations/direct:
 *   post:
 *     summary: Create or get direct conversation with another user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otherUserId
 *             properties:
 *               otherUserId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Existing conversation
 *       201:
 *         description: New conversation created
 */
router.post(
  '/conversations/direct',
  celebrate({
    [Segments.BODY]: Joi.object({
      otherUserId: Joi.number().integer().required(),
    }),
  }),
  createDirectConversation
);

/**
 * @openapi
 * /chat/conversations/event/{eventId}:
 *   post:
 *     summary: Join or create event group conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conversation joined/created
 */
router.post(
  '/conversations/event/:eventId',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      eventId: Joi.number().integer().required(),
    }),
  }),
  createEventConversation
);

/**
 * @openapi
 * /chat/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get messages for a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get(
  '/conversations/:conversationId/messages',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      conversationId: Joi.string().required(),
    }),
    [Segments.QUERY]: Joi.object({
      limit: Joi.number().integer().min(1).max(100).default(50),
      before: Joi.date().iso().optional(),
    }),
  }),
  getConversationMessages
);

/**
 * @openapi
 * /chat/conversations/{conversationId}/messages:
 *   post:
 *     summary: Send a message (alternative to Socket.IO)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, image, file, system]
 *                 default: text
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post(
  '/conversations/:conversationId/messages',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      conversationId: Joi.string().required(),
    }),
    [Segments.BODY]: Joi.object({
      content: Joi.string().required().max(5000),
      type: Joi.string().valid('text', 'image', 'file', 'system').default('text'),
    }),
  }),
  sendMessage
);

/**
 * @openapi
 * /chat/conversations/{conversationId}/read:
 *   post:
 *     summary: Mark conversation as read
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation marked as read
 */
router.post(
  '/conversations/:conversationId/read',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      conversationId: Joi.string().required(),
    }),
  }),
  markConversationAsRead
);

/**
 * @openapi
 * /chat/messages/{messageId}:
 *   patch:
 *     summary: Edit a message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message edited
 */
router.patch(
  '/messages/:messageId',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      messageId: Joi.string().required(),
    }),
    [Segments.BODY]: Joi.object({
      content: Joi.string().required().max(5000),
    }),
  }),
  editMessage
);

/**
 * @openapi
 * /chat/messages/{messageId}:
 *   delete:
 *     summary: Delete a message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted
 */
router.delete(
  '/messages/:messageId',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      messageId: Joi.string().required(),
    }),
  }),
  deleteMessage
);

/**
 * @openapi
 * /chat/online:
 *   get:
 *     summary: Check online status of users
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userIds
 *         required: true
 *         schema:
 *           type: string
 *           description: Comma-separated user IDs
 *     responses:
 *       200:
 *         description: Online status of users
 */
router.get(
  '/online',
  celebrate({
    [Segments.QUERY]: Joi.object({
      userIds: Joi.string().required(),
    }),
  }),
  getOnlineUsers
);

export default router;
