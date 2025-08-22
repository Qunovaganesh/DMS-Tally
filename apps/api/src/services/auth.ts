import crypto from 'crypto';
import bcrypt from 'bcrypt';
import redis from '../config/redis';

export async function generateResetToken(userId: string): Promise<string> {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = await bcrypt.hash(resetToken, 10);
  
  // Store token in Redis with 1 hour expiry
  await redis.setex(`reset:${userId}`, 3600, resetTokenHash);
  
  return resetToken;
}

export async function verifyResetToken(userId: string, token: string): Promise<boolean> {
  const storedTokenHash = await redis.get(`reset:${userId}`);
  
  if (!storedTokenHash) {
    return false;
  }
  
  return bcrypt.compare(token, storedTokenHash);
}

export async function deleteResetToken(userId: string): Promise<void> {
  await redis.del(`reset:${userId}`);
}

export function generateRandomPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}