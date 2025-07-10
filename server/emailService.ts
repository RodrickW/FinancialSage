import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not found - email notifications will not work");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(params: EmailParams & { headers?: any }): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('Email would be sent:', params.subject);
    return false;
  }

  try {
    const emailData: any = {
      to: params.to,
      from: {
        email: params.from,
        name: 'Mind My Money'
      },
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
      // Anti-spam improvements
      trackingSettings: {
        clickTracking: {
          enable: false
        },
        openTracking: {
          enable: false
        }
      },
      // Add authentication headers
      mailSettings: {
        bypassListManagement: {
          enable: false
        },
        footer: {
          enable: false
        },
        sandboxMode: {
          enable: false
        }
      }
    };

    // Add custom headers if provided
    if (params.headers) {
      emailData.headers = params.headers;
    }

    await mailService.send(emailData);
    console.log(`Email sent successfully: ${params.subject}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Send new user signup notification to admin
 */
export async function sendNewUserNotification(user: any): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL!; 
  const fromEmail = process.env.FROM_EMAIL!;
  
  const subject = `🎉 New User Signup: ${user.username}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New User Signup - Mind My Money</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px 0;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Mind My Money</h1>
                  <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">New User Alert</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 30px;">
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">🎉 New User Signup</h2>
                  
                  <!-- User Details Card -->
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
                    <h3 style="margin-top: 0; color: #333; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">User Details</h3>
                    <table style="width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                      <tr><td style="padding: 4px 0; color: #666;"><strong>Username:</strong></td><td style="padding: 4px 0; color: #333;">${user.username}</td></tr>
                      <tr><td style="padding: 4px 0; color: #666;"><strong>Email:</strong></td><td style="padding: 4px 0; color: #333;">${user.email || 'Not provided'}</td></tr>
                      <tr><td style="padding: 4px 0; color: #666;"><strong>Name:</strong></td><td style="padding: 4px 0; color: #333;">${user.firstName} ${user.lastName}</td></tr>
                      <tr><td style="padding: 4px 0; color: #666;"><strong>Signup Time:</strong></td><td style="padding: 4px 0; color: #333;">${new Date().toLocaleString()}</td></tr>
                      <tr><td style="padding: 4px 0; color: #666;"><strong>User ID:</strong></td><td style="padding: 4px 0; color: #333;">${user.id}</td></tr>
                    </table>
                  </div>
                  
                  <!-- Account Status Card -->
                  <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0277bd;">
                    <h4 style="margin-top: 0; color: #0277bd; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Account Status</h4>
                    <table style="width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                      <tr><td style="padding: 4px 0; color: #666;"><strong>Premium:</strong></td><td style="padding: 4px 0; color: #333;">${user.isPremium ? 'Yes' : 'No'}</td></tr>
                      <tr><td style="padding: 4px 0; color: #666;"><strong>Trial Started:</strong></td><td style="padding: 4px 0; color: #333;">${user.hasStartedTrial ? 'Yes' : 'No'}</td></tr>
                      <tr><td style="padding: 4px 0; color: #666;"><strong>Subscription:</strong></td><td style="padding: 4px 0; color: #333;">${user.subscriptionStatus || 'Inactive'}</td></tr>
                    </table>
                  </div>
                  
                  <!-- CTA Button -->
                  <table role="presentation" style="margin: 20px auto; text-align: center;">
                    <tr>
                      <td style="text-align: center;">
                        <a href="https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'your-app.replit.dev'}/admin" 
                           style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                                  color: white; 
                                  padding: 12px 24px; 
                                  text-decoration: none; 
                                  border-radius: 6px; 
                                  font-weight: 600;
                                  font-size: 14px;
                                  display: inline-block;
                                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                                  text-align: center;">
                          View Admin Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                    Mind My Money - Automated Admin Notification<br>
                    This email was sent automatically when a new user registered.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  const text = `
    🎉 NEW USER SIGNUP - Mind My Money
    
    User Details:
    - Username: ${user.username}
    - Email: ${user.email || 'Not provided'}
    - Name: ${user.firstName} ${user.lastName}
    - Signup Time: ${new Date().toLocaleString()}
    - User ID: ${user.id}
    
    Account Status:
    - Premium: ${user.isPremium ? 'Yes' : 'No'}
    - Trial Started: ${user.hasStartedTrial ? 'Yes' : 'No'}
    - Subscription Status: ${user.subscriptionStatus || 'Inactive'}
    
    View Admin Dashboard: https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'your-app.replit.dev'}/admin
    
    ---
    Mind My Money - Automated Admin Notification
    This email was sent automatically when a new user registered.
  `;
  
  return await sendEmail({
    to: adminEmail,
    from: fromEmail,
    subject,
    text,
    html,
    headers: {
      'Message-ID': `<new-user-${user.id}-${Date.now()}@mindmymoney.com>`,
      'List-Unsubscribe': '<mailto:unsubscribe@mindmymoney.com>',
      'X-Entity-Ref-ID': `new-user-${user.id}`,
    }
  });
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(user: any): Promise<boolean> {
  const fromEmail = process.env.FROM_EMAIL || 'noreply@yourdomain.com';
  
  const subject = `Welcome to Mind My Money, ${user.firstName}!`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #059669; margin-bottom: 10px;">Welcome to Mind My Money!</h1>
        <p style="color: #666; font-size: 18px;">Your journey to better financial management starts here</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${user.firstName},</h2>
        <p>Thank you for joining Mind My Money! We're excited to help you take control of your finances with our AI-powered platform.</p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h3 style="color: #059669;">Get Started in 3 Easy Steps:</h3>
        <ol style="color: #333; line-height: 1.6;">
          <li><strong>Connect Your Accounts:</strong> Link your bank accounts securely to get real-time insights</li>
          <li><strong>Explore AI Coaching:</strong> Chat with Money Mind for personalized financial advice</li>
          <li><strong>Start Your Free Trial:</strong> Unlock all premium features for 30 days</li>
        </ol>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'your-app.replit.dev'}" 
           style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px;">
          Go to Dashboard
        </a>
      </div>
      
      <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="margin-top: 0; color: #0277bd;">Need Help?</h4>
        <p style="margin-bottom: 0;">Visit our <a href="https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'your-app.replit.dev'}/feedback" style="color: #0277bd;">feedback page</a> or reply to this email if you have any questions.</p>
      </div>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px; text-align: center;">
        Welcome aboard!<br>
        The Mind My Money Team
      </p>
    </div>
  `;
  
  const text = `
    Welcome to Mind My Money, ${user.firstName}!
    
    Thank you for joining Mind My Money! We're excited to help you take control of your finances with our AI-powered platform.
    
    Get Started in 3 Easy Steps:
    1. Connect Your Accounts: Link your bank accounts securely to get real-time insights
    2. Explore AI Coaching: Chat with Money Mind for personalized financial advice
    3. Start Your Free Trial: Unlock all premium features for 30 days
    
    Visit your dashboard: https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'your-app.replit.dev'}
    
    Need help? Visit our feedback page or reply to this email.
    
    Welcome aboard!
    The Mind My Money Team
  `;
  
  if (!user.email) {
    console.log('User has no email address, skipping welcome email');
    return false;
  }
  
  return await sendEmail({
    to: user.email,
    from: fromEmail,
    subject,
    text,
    html
  });
}