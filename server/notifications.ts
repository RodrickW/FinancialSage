import { storage } from './storage';
import { db } from './db';
import { users } from '@shared/schema';
import { eq, and, lt, gte } from 'drizzle-orm';

interface TrialNotification {
  userId: number;
  daysRemaining: number;
  type: 'trial_reminder' | 'trial_ending_soon' | 'trial_last_day';
  sent: boolean;
}

/**
 * Check for users who need trial expiration notifications
 * This should be called daily via a cron job or scheduled task
 */
export async function checkTrialNotifications() {
  console.log('Checking for trial notifications...');
  
  try {
    const now = new Date();
    const notifications: TrialNotification[] = [];
    
    // Get all users with active trials
    const usersWithTrials = await db.select()
      .from(users)
      .where(
        and(
          eq(users.hasStartedTrial, true),
          eq(users.isPremium, false)
        )
      );
    
    for (const user of usersWithTrials) {
      if (!user.trialEndsAt) continue;
      
      const trialEnd = new Date(user.trialEndsAt);
      const timeDiff = trialEnd.getTime() - now.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Check if user needs notifications at specific intervals
      if (daysRemaining === 14 || daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1) {
        notifications.push({
          userId: user.id,
          daysRemaining,
          type: daysRemaining === 1 ? 'trial_last_day' : 
                daysRemaining <= 3 ? 'trial_ending_soon' : 'trial_reminder',
          sent: false
        });
      }
    }
    
    // Send notifications
    for (const notification of notifications) {
      await sendTrialNotification(notification);
    }
    
    console.log(`Processed ${notifications.length} trial notifications`);
    
  } catch (error) {
    console.error('Error checking trial notifications:', error);
  }
}

/**
 * Send trial notification to user
 */
async function sendTrialNotification(notification: TrialNotification) {
  try {
    const user = await storage.getUser(notification.userId);
    if (!user) return;
    
    const message = getNotificationMessage(notification.daysRemaining);
    
    // Create in-app notification
    await storage.createInsight({
      userId: user.id,
      type: 'trial_notification',
      title: message.title,
      description: message.description,
      severity: notification.type === 'trial_last_day' ? 'alert' : 'warning'
    });
    
    // Send email notification (if email service is configured)
    if (user.email && process.env.SENDGRID_API_KEY) {
      await sendTrialEmail(user, notification.daysRemaining);
    }
    
    console.log(`Sent trial notification to user ${user.id}: ${notification.daysRemaining} days remaining`);
    
  } catch (error) {
    console.error(`Error sending trial notification to user ${notification.userId}:`, error);
  }
}

/**
 * Generate notification message based on days remaining
 */
function getNotificationMessage(daysRemaining: number) {
  switch (daysRemaining) {
    case 14:
      return {
        title: 'Trial Update: 14 Days Remaining',
        description: 'You have 2 weeks left in your free trial. Continue exploring all premium features!'
      };
    case 7:
      return {
        title: 'Trial Update: 1 Week Remaining',
        description: 'Your free trial expires in 7 days. Consider upgrading to keep access to all features.'
      };
    case 3:
      return {
        title: 'Trial Ending Soon: 3 Days Left',
        description: 'Your free trial ends in 3 days. Upgrade now to maintain uninterrupted access to premium features.'
      };
    case 1:
      return {
        title: 'Trial Expires Tomorrow!',
        description: 'Your free trial ends tomorrow. Upgrade today to continue using all premium features.'
      };
    default:
      return {
        title: `Trial Update: ${daysRemaining} Days Remaining`,
        description: `Your free trial expires in ${daysRemaining} days. Don't miss out on premium features!`
      };
  }
}

/**
 * Send trial expiration email
 */
async function sendTrialEmail(user: any, daysRemaining: number) {
  try {
    // This would integrate with SendGrid or another email service
    // For now, we'll log the email that would be sent
    console.log(`Would send trial email to ${user.email}: ${daysRemaining} days remaining`);
    
    // TODO: Implement actual email sending with SendGrid
    // const emailContent = generateTrialEmailContent(user, daysRemaining);
    // await sendEmail(emailContent);
    
  } catch (error) {
    console.error('Error sending trial email:', error);
  }
}

/**
 * Generate trial reminder email content
 */
function generateTrialEmailContent(user: any, daysRemaining: number) {
  const urgencyLevel = daysRemaining <= 3 ? 'high' : 'medium';
  const subject = daysRemaining === 1 
    ? 'Your Mind My Money trial expires tomorrow!'
    : `${daysRemaining} days left in your Mind My Money trial`;
  
  const content = `
    <h2>Hi ${user.firstName},</h2>
    
    <p>Your free trial of Mind My Money ${daysRemaining === 1 ? 'expires tomorrow' : `expires in ${daysRemaining} days`}.</p>
    
    ${daysRemaining <= 3 ? `
      <div style="background: #fee2e2; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="color: #dc2626; margin: 0;">Don't lose access!</h3>
        <p style="margin: 8px 0 0 0;">Upgrade now to keep all your financial insights and premium features.</p>
      </div>
    ` : `
      <p>You still have time to explore all the premium features including:</p>
      <ul>
        <li>Advanced financial insights</li>
        <li>Credit score monitoring</li>
        <li>AI-powered coaching</li>
        <li>Detailed spending analytics</li>
      </ul>
    `}
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="${process.env.APP_URL}/subscribe" 
         style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Upgrade Now
      </a>
    </div>
    
    <p><small>Or <a href="${process.env.APP_URL}/cancel-trial">cancel your trial</a> if you're not ready to continue.</small></p>
    
    <p>Best regards,<br>The Waddle Innovations Team</p>
  `;
  
  return {
    to: user.email,
    subject,
    html: content
  };
}

/**
 * Manual function to send immediate trial notifications for testing
 */
export async function sendTestTrialNotification(userId: number, daysRemaining: number) {
  await sendTrialNotification({
    userId,
    daysRemaining,
    type: daysRemaining === 1 ? 'trial_last_day' : 
          daysRemaining <= 3 ? 'trial_ending_soon' : 'trial_reminder',
    sent: false
  });
}