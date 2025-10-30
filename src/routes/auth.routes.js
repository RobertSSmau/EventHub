/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication and user registration
 */

import { Router } from 'express';
import { celebrate, Joi, errors } from 'celebrate';
import { register, login } from '../controllers/auth.controller.js';

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
 *                 example: rob
 *               email:
 *                 type: string
 *                 example: rob@mail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Email already in use
 */

router.post(
  '/register',
  celebrate({
    body: Joi.object({
      username: Joi.string().min(3).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
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

router.use(errors());

export default router;