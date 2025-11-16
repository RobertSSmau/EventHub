import { User } from '../models/index.js';
import argon2 from 'argon2';
import { generateToken } from '../utils/token.js';
import { createVerificationToken, verifyEmailToken } from '../utils/emailTokens.js';
import { createPasswordResetToken, verifyResetToken, consumeResetToken } from '../utils/emailTokens.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../config/email.js';
import { addToBlacklist } from '../utils/tokenBlacklist.js';
import { getRedisClient } from '../config/redis.js';

export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    // Business logic validation 
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: 'Email already in use' });

    const password_hash = await argon2.hash(password);
    const newUser = await User.create({
      username,
      email,
      password_hash,
      email_verified: false  // Require email verification
    });

    // Generate verification token and send email
    const verificationToken = await createVerificationToken(email);
    const emailSent = await sendVerificationEmail(email, verificationToken);

    if (!emailSent && process.env.NODE_ENV !== 'production') {
      console.warn(`Email service not configured. Auto-verifying user in ${process.env.NODE_ENV} mode.`);
      newUser.email_verified = true;
      await newUser.save();
    }

    if (newUser.email_verified) {
      const token = generateToken(newUser);
      res.status(201).json({
        message: 'User registered successfully.',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      });
    } else {
      res.status(201).json({
        message: 'User registered successfully. Please check your email to verify your account.',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Business logic validation 
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.is_blocked)
      return res.status(403).json({ message: 'User account is blocked' });

    // Check if user registered with OAuth
    if (!user.password_hash) {
      return res.status(400).json({
        message: 'This account uses OAuth authentication. Please login with Google.'
      });
    }

    if (!user.email_verified)
      return res.status(403).json({ message: 'Please verify your email before logging in' });

    const valid = await argon2.verify(user.password_hash, password);
    if (!valid) return res.status(401).json({ message: 'Invalid password' });

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * @desc Logout user by blacklisting current token
 * @route POST /api/auth/logout
 */
export async function logout(req, res) {
  const token = req.token;
  if (!token) return res.status(400).json({ message: 'No token found' });

  await addToBlacklist(token);
  res.json({ message: 'Logout successful' });
}

// Verify email with token
export async function verifyEmail(req, res) {
  try {
    const { token } = req.params;

    // Business logic validation (Joi handles token format if needed)
    const email = await verifyEmailToken(token);
    if (!email) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.email_verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    await user.update({ email_verified: true });

    res.json({
      message: 'Email verified successfully. You can now log in.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}



// Resend verification email
export async function resendVerification(req, res) {
  try {
    const { email } = req.body;

    // Business logic validation (Joi already handles email format)
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.email_verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const verificationToken = await createVerificationToken(email);
    const emailSent = await sendVerificationEmail(email, verificationToken);

    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.json({ message: 'Verification email sent. Check your inbox.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Request password reset
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    // Business logic validation (Joi already handles email format)
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists (security)
      return res.json({ message: 'If the email exists, a reset link has been sent.' });
    }

    const resetToken = await createPasswordResetToken(email);
    const emailSent = await sendPasswordResetEmail(email, resetToken);

    if (!emailSent) {
      console.warn('Failed to send password reset email');
    }

    res.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Reset password with token
export async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    // Business logic validation (Joi handles basic input validation)
    const email = await verifyResetToken(token);
    if (!email) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify that new password is different from current password
    if (user.password_hash) {
      try {
        const isSamePassword = await argon2.verify(user.password_hash, newPassword);
        if (isSamePassword) {
          return res.status(400).json({ message: 'New password must be different from the current password' });
        }
      } catch (error) {
        console.error('Error verifying current password:', error);
      }
    }

    const password_hash = await argon2.hash(newPassword);
    await user.update({ password_hash });

    // Consume token (one-time use)
    await consumeResetToken(token);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * @desc Initiate Google OAuth login
 * @route GET /api/auth/google
 */
export async function googleAuth(req, res, next) {
  // This will be handled by Passport
}

/**
 * @desc Handle Google OAuth callback and login
 * @route GET /api/auth/google/callback (after Passport authentication)
 * Called directly after Passport verification to preserve req.user
 */
export async function googleAuthCallback(req, res, next) {
  // Deprecated: use googleAuthSuccess instead which is called directly
  next();
}

/**
 * @desc Handle successful Google OAuth authentication
 * @route GET /api/auth/google/success
 */
export async function googleAuthSuccess(req, res) {
  try {
    if (!req.user) {
      console.error('No user found in req.user after OAuth callback');
      return res.status(401).json({ message: 'Authentication failed' });
    }

    const token = generateToken(req.user);
    const redis = getRedisClient();

    if (!redis) {
      console.error('Redis client not available');
      return res.status(500).json({ message: 'Authentication service unavailable' });
    }

    // Generate a temporary session ID
    const sessionId = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store auth data temporarily in Redis (expires in 5 minutes)
    const authData = {
      token,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        provider: req.user.provider
      }
    };

    await redis.setex(sessionId, 300, JSON.stringify(authData)); // 5 minutes expiry

    // Redirect to frontend with session ID
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const redirectUrl = `${frontendUrl}/auth/callback?session=${sessionId}`;

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth success handler error:', error);
    return res.status(500).json({ message: 'Authentication process failed' });
  }
}

/**
 * @desc Handle failed Google OAuth authentication
 * @route GET /api/auth/google/failure
 */
export async function getOAuthData(req, res) {
  try {
    const { session } = req.params;

    // Business logic validation (Joi handles session format if needed)
    const redis = getRedisClient();
    if (!redis) {
      return res.status(500).json({ message: 'Authentication service unavailable' });
    }

    const authDataStr = await redis.get(session);

    if (!authDataStr) {
      return res.status(404).json({ message: 'Session expired or invalid' });
    }

    // Delete the session data after use (one-time use)
    await redis.del(session);

    const authData = JSON.parse(authDataStr);
    res.json(authData);
  } catch (error) {
    console.error('OAuth data retrieval error:', error);
    res.status(500).json({ message: 'Failed to retrieve authentication data' });
  }
}

/**
 * @desc Handle failed Google OAuth authentication
 * @route GET /api/auth/google/failure
 */
export async function googleAuthFailure(req, res) {
  res.status(401).json({ message: 'Google authentication failed' });
}
