import crypto from 'crypto';
import { storage } from './storage';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';
import { sendEmail } from './emailService';

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
  
  // Send password reset email
  await sendPasswordResetEmail(user.email, resetToken, user.firstName || 'User');
  
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

/**
 * Send password reset email to user
 * @param email User's email
 * @param resetToken Reset token
 * @param firstName User's first name
 */
async function sendPasswordResetEmail(email: string, resetToken: string, firstName: string): Promise<void> {
  // Use Replit domain temporarily until SSL certificate is fixed for custom domain
  const replitDomains = process.env.REPLIT_DOMAINS;
  const domain = replitDomains ? 
    `https://${replitDomains.split(',')[0]}` : 
    'http://localhost:5000';
  const resetUrl = `${domain}/reset-password?token=${resetToken}`;
  
  const emailContent = {
    to: email,
    from: process.env.FROM_EMAIL!,
    subject: 'Reset Your Mind My Money Password',
    text: `Hi ${firstName},

You requested to reset your password for your Mind My Money account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Best regards,
The Mind My Money Team`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Mind My Money</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
      </div>
      
      <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">Hi ${firstName},</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          You requested to reset your password for your Mind My Money account.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold; 
                    display: inline-block;">
            Reset Your Password
          </a>
        </div>
        
        <p style="color: #999; font-size: 14px; text-align: center;">
          This link will expire in 1 hour.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 14px;">
          If you didn't request this password reset, please ignore this email.
        </p>
        
        <p style="color: #999; font-size: 14px;">
          Best regards,<br>
          The Mind My Money Team
        </p>
      </div>
    </div>
    `
  };

  const success = await sendEmail(emailContent);
  if (!success) {
    throw new Error('Failed to send password reset email');
  }
}