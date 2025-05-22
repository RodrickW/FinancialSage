import crypto from 'crypto';
import { storage } from './storage';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';

interface PasswordResetToken {
  userId: number;
  token: string;
  expiresAt: Date;
}

// In a production app, these would be stored in a database
// For this demo, we'll keep them in memory
const resetTokens: Record<string, PasswordResetToken> = {};

/**
 * Generate a password reset token for a user
 * @param email User's email
 * @returns Token string or null if user not found
 */
export async function generatePasswordResetToken(email: string): Promise<string | null> {
  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  
  if (!user) {
    return null;
  }
  
  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Set expiration (1 hour from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);
  
  // Store the token
  resetTokens[hashedToken] = {
    userId: user.id,
    token: hashedToken,
    expiresAt
  };
  
  // In a production app, you would send an email with the reset link
  console.log(`[DEV] Reset link: http://localhost:5000/reset-password?token=${resetToken}`);
  
  return resetToken;
}

/**
 * Verify a password reset token
 * @param token Reset token
 * @returns User ID if valid, null otherwise
 */
export function verifyResetToken(token: string): number | null {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const resetToken = resetTokens[hashedToken];
  
  if (!resetToken) {
    return null;
  }
  
  // Check if token is expired
  if (new Date() > resetToken.expiresAt) {
    delete resetTokens[hashedToken]; // Clean up expired token
    return null;
  }
  
  return resetToken.userId;
}

/**
 * Reset user password
 * @param token Reset token
 * @param newPassword New password
 * @returns Success status
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const userId = verifyResetToken(token);
  
  if (!userId) {
    return false;
  }
  
  try {
    // In a real app, we would hash the password
    await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, userId));
    
    // Clean up used token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    delete resetTokens[hashedToken];
    
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    return false;
  }
}