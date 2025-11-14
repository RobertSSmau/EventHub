/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication and user registration
 */

import { Router } from 'express';
import { celebrate, Joi, errors } from 'celebrate';
import { 
  register, 
  login, 
  logout, 
  verifyEmail, 
  resendVerification, 
  forgotPassword, 
  resetPassword,
  googleAuth,
  googleAuthCallback,
  googleAuthSuccess,
  googleAuthFailure,
  getOAuthData
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { PASSWORD_REGEX, VALIDATION_MESSAGES } from '../utils/validation.js';
import { authLimiter, logoutLimiter, emailLimiter } from '../middlewares/rateLimiter.middleware.js';
import passport from '../config/passport.js';

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
  authLimiter,
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
  authLimiter,
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
router.post('/logout', logoutLimiter, verifyToken, logout);

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

/**
 * @openapi
 * /auth/verify-email/{token}:
 *   get:
 *     summary: Verify email with token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify-email/:token', verifyEmail);

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent
 *       404:
 *         description: User not found
 */
router.post(
  '/resend-verification',
  emailLimiter,
  celebrate({
    body: Joi.object({
      email: Joi.string().email().required(),
    }),
  }),
  resendVerification
);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent if user exists
 */
router.post(
  '/forgot-password',
  emailLimiter,
  celebrate({
    body: Joi.object({
      email: Joi.string().email().required(),
    }),
  }),
  forgotPassword
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  '/reset-password',
  celebrate({
    body: Joi.object({
      token: Joi.string().required(),
      newPassword: Joi.string()
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
  resetPassword
);

/**
 * @openapi
 * /auth/reset-rate-limits:
 *   post:
 *     summary: Reset all rate limiter counters (temporary endpoint for testing)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Rate limits reset successfully
 *       500:
 *         description: Failed to reset rate limits
 */
router.post('/reset-rate-limits', async (req, res) => {
  try {
    const { getRedisClient } = await import('../config/redis.js');
    const redis = getRedisClient();

    if (!redis) {
      return res.status(500).json({ error: 'Redis client not available' });
    }

    // Get all keys that start with 'rl:'
    const keys = await redis.keys('rl:*');

    if (keys.length === 0) {
      return res.json({
        message: 'No rate limiter keys found',
        deleted: 0
      });
    }

    // Delete all rate limiter keys
    const deletedCount = await redis.del(...keys);

    res.json({
      message: 'Rate limits reset successfully',
      deleted: deletedCount,
      keys: keys
    });
  } catch (error) {
    console.error('Error resetting rate limits:', error);
    res.status(500).json({
      error: 'Failed to reset rate limits',
      details: error.message
    });
  }
});

/**
 * @openapi
 * /auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to Google for authentication
 */
router.get('/google', (req, res, next) => {
  console.log('Google OAuth route called');
  next();
}, passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @openapi
 * /auth/google/callback:
 *   get:
 *     summary: Handle Google OAuth callback
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to success or failure page
 */
router.get('/google/callback',
  (req, res, next) => {
    console.log('Google OAuth callback route called');
    next();
  },
  passport.authenticate('google', { failureRedirect: '/api/auth/google/failure' }),
  googleAuthSuccess  // Call googleAuthSuccess directly to preserve req.user from Passport
);



/**
 * @openapi
 * /auth/google/failure:
 *   get:
 *     summary: Handle Google OAuth failure
 *     tags: [Auth]
 *     responses:
 *       401:
 *         description: Authentication failed
 */
router.get('/google/failure', googleAuthFailure);

router.get('/oauth-data/:session', getOAuthData);

router.use(errors());

export default router;