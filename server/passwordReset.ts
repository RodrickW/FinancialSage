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
    // Improved email deliverability headers
    headers: {
      'Message-ID': `<${Date.now()}-${Math.random()}@mindmymoney.com>`,
      'List-Unsubscribe': '<mailto:unsubscribe@mindmymoney.com>',
      'Precedence': 'bulk',
      'X-Entity-Ref-ID': `password-reset-${Date.now()}`,
    },
    text: `Hi ${firstName},

You requested to reset your password for your Mind My Money account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Best regards,
The Mind My Money Team

---
Mind My Money - Personal Finance Management
This is an automated security email.`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - Mind My Money</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px 0;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Mind My Money</h1>
                  <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Password Reset Request</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Hi ${firstName},</h2>
                  
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                    You requested to reset your password for your Mind My Money account. Click the button below to set a new password.
                  </p>
                  
                  <!-- CTA Button -->
                  <table role="presentation" style="margin: 30px auto; text-align: center;">
                    <tr>
                      <td style="text-align: center;">
                        <a href="${resetUrl}" 
                           style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                                  color: white; 
                                  padding: 16px 32px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: 600;
                                  font-size: 16px;
                                  display: inline-block;
                                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                                  text-align: center;
                                  box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
                          Reset Your Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                    This link will expire in 1 hour for your security.
                  </p>
                  
                  <!-- Alternative Link -->
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                    If the button above doesn't work, copy and paste this link into your browser:<br>
                    <a href="${resetUrl}" style="color: #10b981; word-break: break-all;">${resetUrl}</a>
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                  
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                    If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                    Best regards,<br>
                    <strong>The Mind My Money Team</strong>
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                    Mind My Money - Personal Finance Management<br>
                    This is an automated security email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `
  };

  const success = await sendEmail(emailContent);
  if (!success) {
    throw new Error('Failed to send password reset email');
  }
}