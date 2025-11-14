import { User } from '../models/index.js';
import argon2 from 'argon2';
import { generateToken } from '../utils/token.js';
import { createVerificationToken, verifyEmailToken } from '../utils/emailTokens.js';
import { createPasswordResetToken, verifyResetToken } from '../utils/emailTokens.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../config/email.js';
import { addToBlacklist } from '../utils/tokenBlacklist.js';
import { getRedisClient } from '../config/redis.js';

export async function register(req, res) {
  const { username, email, password } = req.body;

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
  await sendVerificationEmail(email, verificationToken);

  const token = generateToken(newUser);
  res.status(201).json({ 
    message: 'User registered successfully. Please check your email to verify your account.',
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    }
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.is_blocked)
    return res.status(403).json({ message: 'User account is blocked' });

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
  const { token } = req.params;
  console.log(`Verifica email con token: ${token}`);
  
  const email = await verifyEmailToken(token);
  if (!email) {
    console.error(`Token non valido o scaduto: ${token}`);
    return res.status(400).json({ message: 'Invalid or expired verification token' });
  }
  
  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.error(`Utente non trovato: ${email}`);
    return res.status(404).json({ message: 'User not found' });
  }
  
  if (user.email_verified) {
    console.warn(`Email già verificata: ${email}`);
    return res.status(400).json({ message: 'Email already verified' });
  }
  
  await user.update({ email_verified: true });
  console.log(`Email verificata: ${email}`);
  
  // Generate token for auto-login
  const token_jwt = generateToken(user);
  res.json({ 
    message: 'Email verified successfully. You can now log in.',
    token: token_jwt,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
}

// Reset password with token
export async function requestPasswordReset(req, res) {
}

// Reinvia email di verifica
export async function resendVerification(req, res) {
  const { email } = req.body;
  
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  if (user.email_verified) {
    return res.status(400).json({ message: 'Email already verified' });
  }
  
  const verificationToken = await createVerificationToken(email);
  await sendVerificationEmail(email, verificationToken);
  
  res.json({ message: 'Verification email sent. Check your inbox.' });
}

// Richiedi reset password
export async function forgotPassword(req, res) {
  const { email } = req.body;
  
  const user = await User.findOne({ where: { email } });
  if (!user) {
    // Non rivelare se l'email esiste (sicurezza)
    return res.json({ message: 'If the email exists, a reset link has been sent.' });
  }
  
  const resetToken = await createPasswordResetToken(email);
  await sendPasswordResetEmail(email, resetToken);
  
  res.json({ message: 'If the email exists, a reset link has been sent.' });
}

// Reset password con token
export async function resetPassword(req, res) {
  const { token, newPassword } = req.body;
  
  const email = await verifyResetToken(token);
  if (!email) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }
  
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  const password_hash = await argon2.hash(newPassword);
  await user.update({ password_hash });
  
  res.json({ message: 'Password reset successful. You can now log in.' });
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
  if (!req.user) {
    console.error('No user found in req.user after OAuth callback');
    return res.status(401).json({ message: 'Authentication failed' });
  }

  try {
    const token = generateToken(req.user);
    const redis = getRedisClient();
    
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
    
    console.log('Storing OAuth data in Redis with sessionId:', sessionId);
    await redis.setex(sessionId, 300, JSON.stringify(authData)); // 5 minutes expiry
    console.log('OAuth data stored successfully in Redis');
    
    // Redirect to frontend with session ID
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const redirectUrl = `${frontendUrl}/auth/callback?session=${sessionId}`;
    
    console.log('OAuth success - redirecting to:', redirectUrl);
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth success handler error:', error);
    return res.status(500).json({ message: 'Authentication process failed', error: error.message });
  }
}

/**
 * @desc Handle failed Google OAuth authentication
 * @route GET /api/auth/google/failure
 */
export async function getOAuthData(req, res) {
  const { session } = req.params;
  console.log('getOAuthData called with session:', session);
  
  const redis = getRedisClient();
  
  try {
    const authDataStr = await redis.get(session);
    console.log('Redis data retrieved:', authDataStr ? 'found' : 'not found');
    
    if (!authDataStr) {
      console.log('Session not found or expired');
      return res.status(404).json({ message: 'Session expired or invalid' });
    }
    
    // Delete the session data after use (one-time use)
    await redis.del(session);
    console.log('Session data deleted from Redis');
    
    const authData = JSON.parse(authDataStr);
    console.log('Auth data parsed successfully');
    res.json(authData);
  } catch (error) {
    console.error('Redis error in getOAuthData:', error);
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
