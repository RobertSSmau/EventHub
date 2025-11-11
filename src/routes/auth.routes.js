/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication and user registration
 */

import { Router } from 'express';
import { celebrate, Joi, errors } from 'celebrate';
import { register, login, logout } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { PASSWORD_REGEX, VALIDATION_MESSAGES } from '../utils/validation.js';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: robsmith
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rob@mail.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Must contain at least one uppercase, one lowercase, one number, and one special character (@$!%*?&)
 *                 example: Password123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or email already in use
 */

router.post(
  '/register',
  celebrate({
    body: Joi.object({
      username: Joi.string()
        .min(3)
        .max(50)
        .required()
        .messages({
          'string.min': VALIDATION_MESSAGES.username.min,
          'string.max': VALIDATION_MESSAGES.username.max,
          'any.required': VALIDATION_MESSAGES.username.required,
        }),
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': VALIDATION_MESSAGES.email.invalid,
          'any.required': VALIDATION_MESSAGES.email.required,
        }),
      password: Joi.string()
        .min(8)
        .pattern(PASSWORD_REGEX)
        .required()
        .messages({
          'string.min': VALIDATION_MESSAGES.password.min,
          'string.pattern.base': VALIDATION_MESSAGES.password.pattern,
          'any.required': VALIDATION_MESSAGES.password.required,
        }),
    }),
  }),
  register
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in and receive JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: rob@mail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login successful, returns token
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */

router.post(
  '/login',
  celebrate({
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  }),
  login
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout and invalidate current JWT token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: No token provided or invalid token
 */
router.post('/logout', verifyToken, logout);

/**
 * @openapi
 * /auth/password-requirements:
 *   get:
 *     summary: Get password validation requirements
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Password requirements list
 */
router.get('/password-requirements', (req, res) => {
  res.json({
    requirements: [
      'At least 8 characters long',
      'One uppercase letter (A-Z)',
      'One lowercase letter (a-z)',
      'One number (0-9)',
      'One special character (@$!%*?&)',
    ],
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
  });
});

router.use(errors());

export default router;