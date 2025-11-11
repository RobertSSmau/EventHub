/**
 * @openapi
 * tags:
 *   name: Reports
 *   description: Report management endpoints
 */

import { Router } from 'express';
import { celebrate, Joi } from 'celebrate';
import {
  createReport,
  getAllReports,
  getMyReports,
  updateReportStatus,
  deleteReport,
} from '../controllers/report.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/role.middleware.js';
import { reportLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

/**
 * @openapi
 * /reports:
 *   post:
 *     summary: Create a new report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reported_user_id:
 *                 type: integer
 *                 description: ID of reported user (mutually exclusive with reported_event_id)
 *               reported_event_id:
 *                 type: integer
 *                 description: ID of reported event (mutually exclusive with reported_user_id)
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 example: This user is posting spam content
 *     responses:
 *       201:
 *         description: Report created successfully
 *       400:
 *         description: Invalid request (both or neither targets specified)
 *       404:
 *         description: Reported user/event not found
 */
router.post(
  '/',
  verifyToken,
  reportLimiter,
  celebrate({
    body: Joi.object({
      reported_user_id: Joi.number().integer().positive(),
      reported_event_id: Joi.number().integer().positive(),
      reason: Joi.string().min(10).max(1000).required(),
    })
      .xor('reported_user_id', 'reported_event_id')
      .messages({
        'object.xor': 'Must specify either reported_user_id or reported_event_id, not both',
      }),
  }),
  createReport
);

/**
 * @openapi
 * /reports:
 *   get:
 *     summary: Get all reports (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, REVIEWED, RESOLVED, DISMISSED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [user, event]
 *     responses:
 *       200:
 *         description: List of reports
 *       403:
 *         description: Forbidden (admin only)
 */
router.get('/', verifyToken, isAdmin, getAllReports);

/**
 * @openapi
 * /reports/my:
 *   get:
 *     summary: Get current user's reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's reports
 */
router.get('/my', verifyToken, getMyReports);

/**
 * @openapi
 * /reports/{id}:
 *   patch:
 *     summary: Update report status (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, REVIEWED, RESOLVED, DISMISSED]
 *     responses:
 *       200:
 *         description: Report status updated
 *       404:
 *         description: Report not found
 */
router.patch(
  '/:id',
  verifyToken,
  isAdmin,
  celebrate({
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
    body: Joi.object({
      status: Joi.string().valid('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED').required(),
    }),
  }),
  updateReportStatus
);

/**
 * @openapi
 * /reports/{id}:
 *   delete:
 *     summary: Delete a report (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *       404:
 *         description: Report not found
 */
router.delete(
  '/:id',
  verifyToken,
  isAdmin,
  celebrate({
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
  }),
  deleteReport
);

export default router;
