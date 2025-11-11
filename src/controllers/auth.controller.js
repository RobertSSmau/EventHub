import argon2 from 'argon2';
import { User } from '../models/index.js';
import { generateToken } from '../utils/token.js';
import { addToBlacklist } from '../utils/tokenBlacklist.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../config/email.js';
import { createVerificationToken, verifyEmailToken, createPasswordResetToken, verifyResetToken } from '../utils/emailTokens.js';

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
    email_verified: true  // ⬅️ TEMP: Auto-verify for development
  });

  // Generate verification token and send email
  // const verificationToken = await createVerificationToken(email);
  // await sendVerificationEmail(email, verificationToken);

  const token = generateToken(newUser);
  res.status(201).json({ 
    message: 'User registered successfully.', // ⬅️ TEMP: without email verification
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

  // ⬅️ TEMP: Email verification disabled for development
  // if (!user.email_verified)
  //   return res.status(403).json({ message: 'Please verify your email before logging in' });

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
    res.json({ message: 'Email verified successfully. You can now log in.' });
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
