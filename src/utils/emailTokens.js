import crypto from 'crypto';
import { redis } from '../config/redis.js';

// Genera token random sicuro
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Salva token verifica email (TTL 24h)
export async function createVerificationToken(email) {
  const token = generateToken();
  
  if (redis) {
    await redis.set(`verify:${token}`, email, 'EX', 86400); // 24 ore
  }
  
  return token;
}

// Verifica token email e ritorna email
export async function verifyEmailToken(token) {
  if (!redis) return null;
  
  const email = await redis.get(`verify:${token}`);
  
  if (email) {
    await redis.del(`verify:${token}`); // Token usa-e-getta
  }
  
  return email;
}

// Salva token reset password (TTL 1h)
export async function createPasswordResetToken(email) {
  const token = generateToken();
  
  if (redis) {
    await redis.set(`reset:${token}`, email, 'EX', 3600); // 1 ora
  }
  
  return token;
}

// Verifica token reset password e ritorna email
export async function verifyResetToken(token) {
  if (!redis) return null;
  
  const email = await redis.get(`reset:${token}`);
  
  if (email) {
    await redis.del(`reset:${token}`); // Token usa-e-getta
  }
  
  return email;
}
