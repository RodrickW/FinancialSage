import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertAccountSchema, insertTransactionSchema } from "@shared/schema";
import { User } from "@shared/schema";
import { generateFinancialInsights, getFinancialCoaching, generateBudgetRecommendations, analyzeCreditScore, createPersonalizedBudget, generateFinancialHealthReport, parseGoalCreation, parseGoalDeletion, parseProgressUpdate } from "./openai";
import OpenAI from "openai";
import { createLinkToken, exchangePublicToken, getAccounts, getTransactions, formatPlaidAccountData, formatPlaidTransactionData } from "./plaid";
import { servePlaidSDK } from "./plaid-proxy";
import { fetchCreditScore, fetchCreditHistory, storeCreditScore, generateMockCreditScore, generateMockCreditHistory } from "./credit";
import { registerSubscriptionRoutes } from "./routes-subscription";
import { pool } from "./db";
import { generatePasswordResetToken, verifyResetToken, resetPassword, sendUsernameReminder } from "./passwordReset";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import MemoryStore from "memorystore";
import * as ConnectRedis from "connect-redis";
import { redisClient } from "./redis";
import { validateInput, validateSession, logSecurityEvent, csrfProtection, sanitizeInput } from "./security";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mock transaction data for the dashboard
const mockFinancialData = {
  totalBalance: 24563.98,
  previousMonthBalance: 23963.98,
  monthlySpending: 3261.50,
  previousMonthSpending: 3018.92,
  creditScore: 752,
  savingsProgress: {
    current: 5420,
    target: 10000,
    name: 'Vacation Fund'
  }
};

// Helper function to check if date is within last month
function isWithinLastMonth(date: Date): boolean {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  return date >= lastMonth;
}

// Login balance refresh function - bypasses manual rate limiting
// PRODUCTION-READY with comprehensive error handling
async function refreshUserBalancesOnLogin(userId: number): Promise<void> {
  const startTime = Date.now();
  console.log(`🔄 [User ${userId}] Starting automatic balance refresh on login`);
  
  try {
    const accounts = await storage.getAccounts(userId);
    const plaidAccounts = accounts.filter(account => account.plaidAccessToken);
    
    if (plaidAccounts.length === 0) {
      console.log(`ℹ️ [User ${userId}] No Plaid accounts found - skipping login refresh`);
      return;
    }
    
    console.log(`📊 [User ${userId}] Found ${plaidAccounts.length} connected account(s) to refresh`);
    
    let updatedAccountsCount = 0;
    let failedAccountsCount = 0;
    let disconnectedAccountsCount = 0;
    
    for (const account of plaidAccounts) {
      const accountIdentifier = `${account.institutionName} - ${account.accountName}`;
      
      try {
        console.log(`🔄 [User ${userId}] Refreshing: ${accountIdentifier}`);
        
        // Get fresh account data from Plaid
        const accountsResponse = await getAccounts(account.plaidAccessToken!);
        const matchingAccount = accountsResponse.accounts.find(
          plaidAcc => plaidAcc.account_id === account.plaidAccountId
        );
        
        if (!matchingAccount) {
          console.warn(`⚠️ [User ${userId}] Account not found in Plaid response: ${accountIdentifier}`);
          failedAccountsCount++;
          continue;
        }
        
        // Use available balance (what user can actually spend) if available, otherwise current balance
        const availableBalance = matchingAccount.balances.available;
        const currentBalance = matchingAccount.balances.current;
        const newBalance = availableBalance !== null && availableBalance !== undefined 
          ? availableBalance 
          : (currentBalance || 0);
        
        const oldBalance = account.balance;
        const balanceChanged = Math.abs(newBalance - oldBalance) > 0.01;
        
        // Update account with new balance, timestamp, and mark as connected
        await storage.updateAccount(account.id, {
          balance: newBalance,
          lastBalanceUpdate: new Date(),
          isConnected: true
        });
        
        updatedAccountsCount++;
        
        if (balanceChanged) {
          console.log(`✅ [User ${userId}] ${accountIdentifier}: $${oldBalance.toFixed(2)} → $${newBalance.toFixed(2)} (${availableBalance !== null && availableBalance !== undefined ? 'available' : 'current'} balance)`);
        } else {
          console.log(`✅ [User ${userId}] ${accountIdentifier}: No change ($${newBalance.toFixed(2)})`);
        }
        
        // Sync recent transactions (last 7 days) during login
        try {
          const { getTransactions } = await import('./plaid');
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          
          const transactionsResponse = await getTransactions(
            account.plaidAccessToken!,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          );
          
          const formatPlaidTransactionData = (plaidTransaction: any, userId: number, accountId: number) => ({
            userId,
            accountId,
            amount: -plaidTransaction.amount,
            category: plaidTransaction.category?.[0] || 'Other',
            description: plaidTransaction.name || 'Unknown transaction',
            date: new Date(plaidTransaction.date),
            merchantName: plaidTransaction.merchant_name || plaidTransaction.name || 'Unknown',
            merchantIcon: 'receipt',
            plaidTransactionId: plaidTransaction.transaction_id
          });
          
          let newTransactionsCount = 0;
          const existingTransactions = await storage.getTransactions(userId);
          
          for (const plaidTransaction of transactionsResponse.transactions) {
            const existingByPlaidId = existingTransactions.find(
              tx => tx.plaidTransactionId === plaidTransaction.transaction_id
            );
            
            if (!existingByPlaidId) {
              const transactionData = formatPlaidTransactionData(plaidTransaction, userId, account.id);
              await storage.createTransaction(transactionData);
              newTransactionsCount++;
            }
          }
          
          if (newTransactionsCount > 0) {
            console.log(`💳 [User ${userId}] ${accountIdentifier}: Synced ${newTransactionsCount} new transaction(s)`);
          }
          
        } catch (transactionError: any) {
          console.warn(`⚠️ [User ${userId}] ${accountIdentifier}: Transaction sync failed - ${transactionError.message}`);
        }
        
      } catch (accountError: any) {
        // Detect specific Plaid errors that require user action
        const errorCode = accountError.error_code || accountError.code;
        const errorType = accountError.error_type;
        const errorMessage = accountError.message || 'Unknown error';
        
        // Common Plaid errors that indicate disconnected accounts
        const REQUIRES_RECONNECTION_ERRORS = [
          'ITEM_LOGIN_REQUIRED',
          'INVALID_ACCESS_TOKEN', 
          'INVALID_CREDENTIALS',
          'ITEM_LOCKED',
          'ITEM_NOT_FOUND'
        ];
        
        if (REQUIRES_RECONNECTION_ERRORS.includes(errorCode)) {
          // Mark account as disconnected
          console.error(`🔴 [User ${userId}] ${accountIdentifier}: DISCONNECTED - ${errorCode}`);
          console.error(`   ↳ User needs to reconnect their bank account`);
          
          try {
            await storage.updateAccount(account.id, {
              isConnected: false
            });
            disconnectedAccountsCount++;
          } catch (updateError) {
            console.error(`❌ [User ${userId}] Failed to mark account as disconnected:`, updateError);
          }
          
        } else {
          // Other errors (rate limiting, network issues, etc.)
          console.error(`❌ [User ${userId}] ${accountIdentifier}: ${errorCode || 'ERROR'} - ${errorMessage}`);
          failedAccountsCount++;
        }
      }
    }
    
    const duration = Date.now() - startTime;
    const summary = `
╔═══════════════════════════════════════════════════════════════════
║ LOGIN BALANCE REFRESH COMPLETE [User ${userId}]
╠═══════════════════════════════════════════════════════════════════
║ ✅ Successfully updated: ${updatedAccountsCount}/${plaidAccounts.length} account(s)
║ 🔴 Disconnected (need reconnection): ${disconnectedAccountsCount}
║ ❌ Failed (temporary errors): ${failedAccountsCount}
║ ⏱️  Duration: ${duration}ms
╚═══════════════════════════════════════════════════════════════════`;
    
    console.log(summary);
    
    // Alert if any accounts need attention
    if (disconnectedAccountsCount > 0) {
      console.warn(`⚠️  [User ${userId}] ACTION REQUIRED: ${disconnectedAccountsCount} account(s) need to be reconnected`);
    }
    
  } catch (error: any) {
    console.error(`💥 [User ${userId}] CRITICAL ERROR in refreshUserBalancesOnLogin:`, error);
    console.error(`   ↳ Error details:`, {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n')[0]
    });
    // Don't throw - let login succeed even if balance refresh fails
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session with Redis fallback to memory
  let sessionStore;
  
  try {
    // Try Redis first for scalability
    const RedisStore = ConnectRedis(session);
    sessionStore = new RedisStore({
      client: redisClient,
      prefix: 'mindmymoney:sess:',
      ttl: 7 * 24 * 60 * 60 // 1 week
    });
    console.log('✓ Using Redis session store');
  } catch (error) {
    // Fallback to memory store
    const MemoryStoreSession = MemoryStore(session);
    sessionStore = new MemoryStoreSession({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
    console.log('⚠ Using memory session store (fallback)');
  }

  app.use(session({
    secret: process.env.SESSION_SECRET || 'mindmymoneysecret',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    },
    name: 'connect.sid'
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport local strategy
  passport.use(new LocalStrategy(
    async (username: string, password: string, done: (error: any, user?: any, options?: { message: string }) => void) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: 'Incorrect username' });
        }
        
        // Compare hashed password
        const bcrypt = await import('bcrypt');
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: 'Incorrect password' });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  // Serialize/deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Helper function to check if user's trial has expired
  const isTrialExpired = (user: User): boolean => {
    if (!user.trialEndsAt || !user.hasStartedTrial) return false;
    return new Date() > new Date(user.trialEndsAt);
  };

  // Helper function to check if request is from mobile app
  const isMobileAppRequest = (req: any): boolean => {
    return req.headers['x-mobile-app'] === 'true' || req.headers['x-platform'] === 'ios';
  };

  // Helper function to check if user has access (either premium or valid trial)
  // Implements Apple App Store Guideline 3.1.3(b) - Multiplatform Services
  // Allows users who purchased on web to access mobile, while also offering Apple IAP
  const hasAccess = (user: User, req?: any): boolean => {
    // If this is a mobile app request, check MULTIPLE subscription sources
    // This allows existing web subscribers to use mobile app (multiplatform service)
    if (req && isMobileAppRequest(req)) {
      // 1. Active RevenueCat subscription (Apple IAP purchase)
      if (user.revenuecatExpiresAt && new Date(user.revenuecatExpiresAt) > new Date()) {
        return true;
      }
      
      // 2. Active Stripe subscription (web purchase - multiplatform access)
      // Only grant access to users with ACTIVE subscriptions, not lapsed/canceled
      
      // 2a. Premium status (explicitly marked as premium)
      if (user.isPremium) {
        return true;
      }
      
      // 2b. Active Stripe subscription with valid status
      if (user.stripeSubscriptionId && (
        user.subscriptionStatus === 'active' || 
        user.subscriptionStatus === 'trialing' ||
        user.subscriptionStatus === 'past_due' // Grace period - still has access
      )) {
        return true;
      }
      
      // 3. Valid free trial (14-day trial for new users)
      if (user.hasStartedTrial && user.subscriptionStatus === 'trialing' && !isTrialExpired(user)) {
        return true;
      }
      
      // No access if none of the above conditions are met
      return false;
    }
    
    // For web requests, check Stripe subscriptions (normal web flow)
    // PRIORITY 1: Anyone with Stripe Customer ID or Subscription ID gets FULL access (existing paid users)
    // This ensures NO trial messages for existing customers
    if (user.stripeCustomerId || user.stripeSubscriptionId) {
      return true;
    }
    
    // PRIORITY 2: Premium users always have access
    if (user.isPremium) {
      return true;
    }
    
    // PRIORITY 3: Active RevenueCat (Apple IAP) subscription (web users who also have mobile subscription)
    if (user.revenuecatExpiresAt && new Date(user.revenuecatExpiresAt) > new Date()) {
      return true;
    }
    
    // PRIORITY 4: Active subscription statuses (legacy paid users)
    if (user.subscriptionStatus === 'active' || 
        user.subscriptionStatus === 'past_due' ||
        user.subscriptionStatus === 'canceled' || // Users who had subscription (legacy access)
        user.subscriptionStatus === 'trial_ended') { // Users who completed 30-day trial (legacy access)
      return true;
    }
    
    // PRIORITY 5: Check if user is in valid 14-day trial period (new trial system only)
    if (user.hasStartedTrial && user.subscriptionStatus === 'trialing' && !isTrialExpired(user)) {
      return true;
    }
    
    return false;
  };

  // Enhanced auth middleware with trial checking
  const requireAuth = async (req: any, res: any, next: any) => {
    // Check session-based authentication first
    if (!req.isAuthenticated()) {
      // Check bearer token authentication for mobile
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // Temporary: Allow mobile access with specific token
        if (token === 'mobile-user-17-token') {
          // Use the same user as the web app for consistency
          req.user = { 
            id: 17, 
            username: 'Mr.Waddle', 
            isPremium: false, 
            hasStartedTrial: true,
            firstName: 'Mr',
            lastName: 'Waddle',
            subscriptionStatus: 'trialing'
          };
          return next();
        }
      }
      
      logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', undefined, {
        endpoint: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        hasBearer: !!authHeader
      });
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const user = req.user as User;
    
    // Update expired trial status
    if (isTrialExpired(user) && user.subscriptionStatus === 'trialing') {
      try {
        await storage.updateUser(user.id, { 
          subscriptionStatus: 'trial_expired' 
        });
        // Update the user object in the request
        req.user = { ...user, subscriptionStatus: 'trial_expired' };
      } catch (error) {
        console.error('Failed to update expired trial status:', error);
      }
    }
    
    return validateSession(req, res, next);
  };

  // Middleware to require active subscription or valid trial
  const requireAccess = async (req: any, res: any, next: any) => {
    // Check session-based authentication first
    if (!req.isAuthenticated()) {
      // Check bearer token authentication for mobile
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // Temporary: Allow mobile access with specific token
        if (token === 'mobile-user-17-token') {
          // Use the same user as the web app for consistency
          req.user = { 
            id: 17, 
            username: 'Mr.Waddle', 
            isPremium: false, 
            hasStartedTrial: true,
            firstName: 'Mr',
            lastName: 'Waddle',
            subscriptionStatus: 'trialing'
          };
        } else {
          return res.status(401).json({ message: 'Unauthorized' });
        }
      } else {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }
    
    const user = req.user as User;
    
    // Pass req to hasAccess so it can check if it's a mobile request
    if (!hasAccess(user, req)) {
      // Special message for mobile users without Apple IAP subscription
      if (isMobileAppRequest(req)) {
        return res.status(403).json({ 
          message: 'Apple subscription required',
          code: 'APPLE_IAP_REQUIRED',
          details: 'To use premium features in the mobile app, please subscribe via the App Store.'
        });
      }
      
      // Check if trial expired
      if (isTrialExpired(user)) {
        return res.status(403).json({ 
          message: 'Trial expired',
          code: 'TRIAL_EXPIRED',
          trialEndsAt: user.trialEndsAt
        });
      }
      
      return res.status(403).json({ 
        message: 'Subscription required',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }
    
    next();
  };

  // Admin middleware
  const requireAdmin = async (req: any, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as User;
    if (!user.isAdmin) {
      logSecurityEvent('ADMIN_ACCESS_DENIED', user.id, { endpoint: req.path });
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  };

  // Create demo user if it doesn't exist
  try {
    const existingUser = await storage.getUserByUsername('demo');
    if (!existingUser) {
      await storage.createUser({
        username: 'demo',
        password: await (await import('bcrypt')).hash('password', 12),
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@example.com'
      });
      console.log('Demo user created successfully');
    }
  } catch (error) {
    console.error('Error creating demo user:', error);
  }
  
  // Plaid SDK proxy endpoint (before security middleware)
  app.get('/api/plaid-sdk.js', servePlaidSDK);
  
  // Plaid webhook endpoint (before security middleware)
  app.post('/api/plaid/webhook', (req, res) => {
    console.log('Plaid webhook received:', req.body);
    res.status(200).send('OK');
  });

  // Stripe webhook endpoint (before security middleware) - needs raw body
  app.post('/api/webhook/stripe', async (req, res) => {
    console.log('Stripe webhook received');
    let event;
    
    try {
      const sig = req.headers['stripe-signature'];
      
      // Verify webhook signature if secret is configured
      if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
        // Get raw body for signature verification
        const body = req.body;
        
        event = stripe.webhooks.constructEvent(
          body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        
        console.log('Webhook signature verified');
      } else {
        // For development or if no secret is configured
        event = req.body;
        console.log('Webhook processed without signature verification');
      }
      
      console.log('Processing webhook event:', event.type);
      
      // Handle the event
      const { handleStripeWebhook } = await import('./stripe');
      await handleStripeWebhook(event);
      
      console.log('Webhook event processed successfully');
      res.status(200).json({ received: true });
      
    } catch (error) {
      console.error('Webhook error:', error);
      
      if (error instanceof Error && error.message.includes('signature')) {
        console.error('Webhook signature verification failed');
        res.status(400).json({ error: 'Invalid signature' });
      } else {
        res.status(500).json({ error: 'Webhook processing failed' });
      }
    }
  });

  // Apply security middleware to all routes
  app.use('/api/', validateInput);
  app.use('/api/', csrfProtection);

  // Register the subscription routes (after security middleware)
  registerSubscriptionRoutes(app, requireAuth);

  // Admin endpoint to sync all users to Stripe
  app.post('/api/admin/sync-users-to-stripe', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { syncAllUsersToStripe } = await import('./stripe');
      const syncedCount = await syncAllUsersToStripe();
      
      res.json({ 
        message: `Successfully synced ${syncedCount} users to Stripe`,
        syncedCount 
      });
    } catch (error) {
      console.error('Error syncing users to Stripe:', error);
      res.status(500).json({ error: 'Failed to sync users to Stripe' });
    }
  });

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const sanitizedBody = sanitizeInput(req.body);
      console.log('Registration attempt with data:', JSON.stringify(sanitizedBody, null, 2));
      
      // Create registration schema with only required fields
      const registrationSchema = insertUserSchema.pick({
        username: true,
        password: true,
        firstName: true,
        lastName: true,
        email: true
      });
      
      const result = registrationSchema.safeParse(sanitizedBody);
      
      if (!result.success) {
        console.error('Registration validation failed:', result.error.issues);
        logSecurityEvent('INVALID_REGISTRATION_ATTEMPT', undefined, {
          errors: result.error.issues,
          submittedData: sanitizedBody
        });
        return res.status(400).json({ message: 'Invalid input data', errors: result.error });
      }
      
      const existingUser = await storage.getUserByUsername(result.data.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      // Hash password before storing
      const bcrypt = await import('bcrypt');
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(result.data.password, saltRounds);
      
      // Calculate 14-day trial end date
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);
      
      // Create complete user object with 14-day trial started immediately
      const userWithHashedPassword = {
        username: result.data.username,
        password: hashedPassword,
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        email: result.data.email,
        // Set 14-day trial - full access without credit card required
        isPremium: false, // Will become true only after payment
        premiumTier: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: 'trialing', // Set to trialing status
        trialEndsAt: trialEndDate, // Set 14-day expiration
        hasStartedTrial: true, // Mark trial as started
        hasCompletedOnboarding: false,
        hasSeenTour: false,
        loginCount: 0,
        isAdmin: false
      };
      
      console.log('Creating user with data:', JSON.stringify(userWithHashedPassword, null, 2));
      const user = await storage.createUser(userWithHashedPassword);
      
      logSecurityEvent('USER_REGISTERED', user.id, {
        username: user.username,
        email: user.email
      });
      
      // Send email notifications for new user signup
      const { sendNewUserNotification, sendWelcomeEmail } = await import('./emailService');
      
      // Send admin notification (don't block registration if it fails)
      sendNewUserNotification(user).catch(error => {
        console.error('Failed to send admin notification:', error);
      });
      
      // Send welcome email to user (don't block registration if it fails)
      sendWelcomeEmail(user).catch(error => {
        console.error('Failed to send welcome email:', error);
      });

      // Create Stripe customer immediately after registration (don't block if it fails)
      const { ensureStripeCustomer } = await import('./stripe');
      ensureStripeCustomer(user.id).catch(error => {
        console.error('Failed to create Stripe customer during registration:', error);
      });
      
      res.status(201).json({ message: 'User created successfully' });
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle duplicate email error
      if (error.code === '23505' && error.constraint === 'users_email_unique') {
        return res.status(400).json({ 
          message: 'An account with this email already exists. Please use a different email or try logging in.' 
        });
      }
      
      // Handle duplicate username error
      if (error.code === '23505' && error.constraint === 'users_username_unique') {
        return res.status(400).json({ 
          message: 'This username is already taken. Please choose a different username.' 
        });
      }
      
      res.status(500).json({ message: 'Registration failed. Please try again.' });
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: User | false, info: { message: string } | undefined) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        logSecurityEvent('USER_LOGIN_FAILED', undefined, {
          reason: info?.message,
          submittedUsername: req.body.username
        });
        return res.status(401).json({ message: info?.message || 'Authentication failed' });
      }
      req.logIn(user, async (err) => {
        if (err) {
          return next(err);
        }
        
        // Extend session if "Keep me signed in" is checked (30 days instead of 1 week)
        if (req.body.rememberMe && req.session.cookie) {
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }
        
        // Increment login count
        try {
          await storage.updateUser(user.id, { 
            loginCount: (user.loginCount || 0) + 1 
          });
        } catch (error) {
          console.error('Failed to update login count:', error);
        }
        
        logSecurityEvent('USER_LOGIN_SUCCESS', user.id, {
          username: user.username
        });
        
        // Trigger automatic balance refresh on login (non-blocking)
        refreshUserBalancesOnLogin(user.id).catch(error => {
          console.error('Failed to refresh balances on login for user', user.id, ':', error.message);
        });
        
        return res.json({ message: 'Authentication successful', user: { id: user.id, username: user.username } });
      });
    })(req, res, next);
  });

  app.get('/api/auth/logout', (req: any, res) => {
    const userId = req.user?.id;
    
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Error during logout' });
      }
      
      if (userId) {
        logSecurityEvent('USER_LOGOUT', userId);
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Complete onboarding
  app.post('/api/users/complete-onboarding', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      await storage.updateUser(user.id, { 
        hasSeenTour: true, 
        hasCompletedOnboarding: true 
      });
      res.json({ message: 'Onboarding completed' });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      res.status(500).json({ message: 'Failed to complete onboarding' });
    }
  });
  
  // Password reset routes
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }
      
      try {
        const token = await generatePasswordResetToken(email);
        
        // Always return the same message for security (don't reveal if user exists)
        return res.status(200).json({ 
          message: 'If an account with that email exists, a password reset link has been sent to your email address.' 
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Still return success message to avoid revealing user existence
        return res.status(200).json({ 
          message: 'If an account with that email exists, a password reset link has been sent to your email address.' 
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/auth/verify-reset-token', (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: 'Token is required' });
      }
      
      const userId = verifyResetToken(token);
      
      if (!userId) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
      
      return res.status(200).json({ message: 'Token is valid' });
    } catch (error) {
      console.error('Verify token error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: 'Token and password are required' });
      }
      
      // Hash new password before reset
      const bcrypt = await import('bcrypt');
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      const success = await resetPassword(token, hashedPassword);
      
      if (!success) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
      
      return res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Forgot username route
  app.post('/api/auth/forgot-username', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }
      
      try {
        const success = await sendUsernameReminder(email);
        
        // Always return the same message for security (don't reveal if user exists)
        return res.status(200).json({ 
          message: 'If an account with that email exists, your username(s) have been sent to your email address.' 
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Still return success message to avoid revealing user existence
        return res.status(200).json({ 
          message: 'If an account with that email exists, your username(s) have been sent to your email address.' 
        });
      }
    } catch (error) {
      console.error('Forgot username error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User profile
  app.get('/api/users/profile', requireAuth, (req, res) => {
    res.json(req.user);
  });

  // Mobile-specific endpoint to check access (used by WebView)
  app.get('/api/mobile/access', requireAuth, (req, res) => {
    const user = req.user as User;
    const hasSubscription = hasAccess(user, req);
    
    res.json({
      userId: user.id,
      hasAccess: hasSubscription,
      isPremium: user.isPremium,
      subscriptionStatus: user.subscriptionStatus,
      stripeSubscriptionId: user.stripeSubscriptionId,
      revenuecatExpiresAt: user.revenuecatExpiresAt
    });
  });

  // Financial overview - requires active trial or subscription
  app.get('/api/financial-overview', requireAccess, async (req, res) => {
    try {
      const user = req.user as User;
      // Get all user accounts
      const userAccounts = await storage.getAccounts(user.id);
      
      // Calculate total balance
      const totalBalance = userAccounts.reduce((sum, account) => sum + account.balance, 0);
      
      // Get previous month balance (mock for now)
      const previousMonthBalance = totalBalance * 0.95; // Mock 5% growth
      
      // Get spending data
      const userTransactions = await storage.getTransactions(user.id);
      const now = new Date();
      
      // Calculate monthly spending (current month) with improved precision
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthlySpending = userTransactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          const amount = parseFloat(t.amount.toString());
          return amount > 0 && 
                 transactionDate.getMonth() === currentMonth &&
                 transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);
      
      // Calculate weekly spending (last 7 days) with proper date handling
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklySpending = userTransactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          const amount = parseFloat(t.amount.toString());
          return amount > 0 && transactionDate >= weekAgo;
        })
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);
      
      // Calculate daily spending (today) with improved date comparison
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      const dailySpending = userTransactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          const amount = parseFloat(t.amount.toString());
          return amount > 0 && 
                 transactionDate >= todayStart && 
                 transactionDate < todayEnd;
        })
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);
      
      // Previous month spending
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthSpending = userTransactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.amount > 0 && 
                 transactionDate.getMonth() === lastMonth.getMonth() &&
                 transactionDate.getFullYear() === lastMonth.getFullYear();
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Get credit score
      const creditScoreData = await storage.getCreditScore(user.id);
      const creditScore = creditScoreData?.score || 0; // Show 0 for new users
      
      // Get savings goal
      const savingsGoals = await storage.getSavingsGoals(user.id);
      const mainSavingsGoal = savingsGoals[0] || {
        name: 'Set a savings goal',
        targetAmount: 0,
        currentAmount: 0
      };
      
      const financialOverview = {
        totalBalance: Math.round(totalBalance * 100) / 100,
        previousMonthBalance: Math.round(previousMonthBalance * 100) / 100,
        monthlySpending: Math.round(monthlySpending * 100) / 100,
        previousMonthSpending: Math.round(previousMonthSpending * 100) / 100,
        weeklySpending: Math.round(weeklySpending * 100) / 100,
        dailySpending: Math.round(dailySpending * 100) / 100,
        creditScore,
        savingsProgress: {
          current: Math.round(mainSavingsGoal.currentAmount * 100) / 100,
          target: Math.round(mainSavingsGoal.targetAmount * 100) / 100,
          name: mainSavingsGoal.name
        }
      };

      console.log(`📊 Financial Overview for user ${user.id}:`, {
        totalBalance: financialOverview.totalBalance,
        monthlySpending: financialOverview.monthlySpending,
        weeklySpending: financialOverview.weeklySpending,
        dailySpending: financialOverview.dailySpending,
        transactionCount: userTransactions.length,
        debugInfo: {
          currentMonth,
          currentYear,
          todayStart: todayStart.toISOString(),
          weekAgo: weekAgo.toISOString(),
          expenseTransactions: userTransactions.filter(t => t.amount > 0).length,
          sampleExpense: userTransactions.filter(t => t.amount > 0)[0]
        }
      });
      
      res.json(financialOverview);
    } catch (error) {
      console.error('Error getting financial overview:', error);
      // Return empty state for new users instead of mock data
      res.json({
        totalBalance: 0,
        previousMonthBalance: 0,
        monthlySpending: 0,
        previousMonthSpending: 0,
        weeklySpending: 0,
        dailySpending: 0,
        creditScore: 0,
        savingsProgress: {
          current: 0,
          target: 0,
          name: 'Set a savings goal'
        }
      });
    }
  });
  
  // Plaid routes - requires active trial or subscription
  app.post('/api/plaid/create-link-token', requireAccess, async (req, res) => {
    try {
      const user = req.user as User;
      console.log('Creating link token for user:', user.id);
      
      const linkToken = await createLinkToken(user.id, user.id.toString());
      console.log('Link token created successfully');
      
      res.json({ link_token: linkToken.link_token });
    } catch (error) {
      console.error('Error creating link token:', error);
      res.status(500).json({ error: 'Failed to create link token' });
    }
  });
  
  app.post('/api/plaid/exchange-token', requireAccess, async (req, res) => {
    try {
      const { publicToken, metadata } = req.body;
      const user = req.user as User;
      
      console.log('Exchanging public token for user:', user.id);
      console.log('Institution:', metadata.institution?.name);
      
      const exchangeResponse = await exchangePublicToken(publicToken);
      const accessToken = exchangeResponse.access_token;
      const itemId = exchangeResponse.item_id;
      
      console.log('Successfully exchanged token, item ID:', itemId);
      
      // Get accounts from Plaid
      const accountsResponse = await getAccounts(accessToken);
      console.log('Retrieved accounts:', accountsResponse.accounts.length);
      
      // Save accounts to database
      const institutionName = metadata.institution?.name || 'Financial Institution';
      const accountsCreated = [];
      
      for (const plaidAccount of accountsResponse.accounts) {
        const accountData = formatPlaidAccountData(plaidAccount, user.id, institutionName, accessToken);
        const newAccount = await storage.createAccount(accountData);
        accountsCreated.push(newAccount);
        console.log('Created account:', newAccount.accountName, 'Balance:', newAccount.balance);
      }
      
      // Try to get and save transactions, but don't fail if transactions aren't ready yet
      let transactionsCreated = 0;
      try {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        
        console.log('Fetching transactions from', startDate, 'to', endDate);
        
        const transactionsResponse = await getTransactions(accessToken, startDate, endDate);
        console.log('Retrieved transactions:', transactionsResponse.transactions.length);
        
        for (const account of accountsCreated) {
          // Get the Plaid account ID from metadata
          const plaidAccountId = accountsResponse.accounts.find(a => 
            a.name === account.accountName && 
            a.type === account.accountType
          )?.account_id;
          
          if (plaidAccountId) {
            const accountTransactions = transactionsResponse.transactions.filter(
              t => t.account_id === plaidAccountId
            );
            
            for (const plaidTransaction of accountTransactions) {
              const transactionData = formatPlaidTransactionData(plaidTransaction, user.id, account.id);
              await storage.createTransaction(transactionData);
              transactionsCreated++;
            }
          }
        }
        
        console.log('Successfully created', transactionsCreated, 'transactions');
      } catch (transactionError: any) {
        console.log('Transaction sync failed (this is normal for new connections):', transactionError.message);
        
        // Check if it's a PRODUCT_NOT_READY error
        if (transactionError.response?.data?.error_code === 'PRODUCT_NOT_READY') {
          console.log('Transactions not ready yet - will be available later via sync endpoint');
        } else {
          console.error('Unexpected transaction error:', transactionError);
        }
      }
      
      res.json({ 
        success: true, 
        accounts: accountsCreated,
        transactionsCount: transactionsCreated
      });
    } catch (error: any) {
      console.error('Error exchanging token:', error);
      
      // Enhanced error logging for Plaid-specific errors
      if (error.response?.data) {
        console.error('Plaid API error details:', error.response.data);
      }
      
      // Return specific error messages based on error type
      let errorMessage = 'Failed to connect your account';
      
      if (error.response?.data?.error_code) {
        const plaidError = error.response.data;
        console.error('Plaid error code:', plaidError.error_code);
        console.error('Plaid error message:', plaidError.error_message);
        
        switch (plaidError.error_code) {
          case 'INVALID_CREDENTIALS':
            errorMessage = 'Invalid bank credentials. Please check your username and password.';
            break;
          case 'ITEM_LOGIN_REQUIRED':
            errorMessage = 'Please log in to your bank account again to reconnect.';
            break;
          case 'INSTITUTION_DOWN':
            errorMessage = 'Your bank is temporarily unavailable. Please try again later.';
            break;
          case 'RATE_LIMIT_EXCEEDED':
            errorMessage = 'Too many connection attempts. Please wait a few minutes and try again.';
            break;
          case 'ITEM_LOCKED':
            errorMessage = 'Your account is temporarily locked. Please contact your bank.';
            break;
          default:
            errorMessage = plaidError.error_message || 'Failed to connect your account';
        }
      }
      
      res.status(500).json({ 
        error: errorMessage,
        plaidError: error.response?.data?.error_code || null
      });
    }
  });
  
  // Accounts routes - requires active trial or subscription
  app.get('/api/accounts', requireAccess, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Trigger balance refresh for this user when they visit accounts page
      // This runs in background without blocking the response
      const { refreshUserBalances } = await import('./balanceSync');
      refreshUserBalances(user.id).catch(error => {
        console.error('Background balance refresh failed:', error);
      });
      
      const accounts = await storage.getAccounts(user.id);
      res.json(accounts);
    } catch (error) {
      console.error('Error getting accounts:', error);
      res.status(500).json({ error: 'Failed to get accounts' });
    }
  });
  
  app.get('/api/accounts/:id', requireAccess, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      const user = req.user as User;
      
      // Check if the account belongs to the user
      if (account.userId !== user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      res.json(account);
    } catch (error) {
      console.error('Error getting account:', error);
      res.status(500).json({ error: 'Failed to get account' });
    }
  });

  // Delete/disconnect account - with content type override
  app.delete('/api/accounts/:id', 
    // Skip JSON parsing for DELETE requests
    (req, res, next) => {
      // Skip body parsing for DELETE
      next();
    },
    requireAuth, 
    async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const user = req.user as User;
      
      // Get the account to verify ownership
      const account = await storage.getAccount(accountId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      // Check if the account belongs to the user
      if (account.userId !== user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      // First, get all transactions for this account to clean up related data
      const accountTransactions = await storage.getAccountTransactions(accountId, 1000);
      
      // Delete the account (we'll manually clean up related data)
      const deleted = await storage.deleteAccount(accountId);
      
      if (!deleted) {
        return res.status(500).json({ error: 'Failed to disconnect account' });
      }
      
      // Reset budget data - set spent and remaining to 0 for all user's budget categories
      const userBudgets = await storage.getBudgets(user.id);
      console.log(`Resetting ${userBudgets.length} budget categories for user ${user.id}`);
      for (const budget of userBudgets) {
        const updated = await storage.updateBudget(budget.id, {
          spent: 0,
          remaining: budget.amount // Reset remaining to the planned amount
        });
        console.log(`Updated budget ${budget.category}: spent=0, remaining=${budget.amount}`);
      }
      
      // Note: Related transactions are automatically cleaned up by foreign key constraints
      // Budget data has been reset and insights will be recalculated on next access
      
      // Log the account disconnection for audit purposes
      console.log(`Account disconnected: ${account.accountName} (ID: ${accountId}) by user ${user.id}`);
      
      res.json({ 
        message: 'Account disconnected successfully',
        accountName: account.accountName
      });
      
    } catch (error) {
      console.error('Error disconnecting account:', error);
      res.status(500).json({ error: 'Failed to disconnect account' });
    }
  });
  
  // Sync transactions from Plaid for connected accounts - requires active trial or subscription
  app.post('/api/plaid/sync-transactions', requireAccess, async (req, res) => {
    try {
      const user = req.user as User;
      const { accountId, days = 30 } = req.body;
      
      // Get the account to sync
      const account = await storage.getAccount(accountId);
      if (!account || account.userId !== user.id) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      if (!account.plaidAccessToken) {
        return res.status(400).json({ error: 'Account not connected to Plaid' });
      }
      
      // Calculate date range
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - days);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];
      
      console.log(`Syncing transactions for account ${accountId} from ${startDateStr} to ${endDateStr}`);
      
      // Fetch new transactions from Plaid
      const transactionsResponse = await getTransactions(account.plaidAccessToken, startDateStr, endDateStr);
      
      // Filter transactions for this specific account
      const accountTransactions = transactionsResponse.transactions.filter(
        t => t.account_id === account.plaidAccountId
      );
      
      let newTransactionsCount = 0;
      for (const plaidTransaction of accountTransactions) {
        // Check if transaction already exists to avoid duplicates using Plaid transaction ID
        const plaidTransactionId = plaidTransaction.transaction_id;
        const existingByPlaidId = await storage.getTransactionByPlaidId(plaidTransactionId);
        
        // Also check by description, amount, and date as fallback
        const existingTransactions = await storage.getAccountTransactions(accountId, 1000);
        const existsByContent = existingTransactions.some(existing => 
          existing.description === plaidTransaction.name && 
          Math.abs(parseFloat(existing.amount.toString()) - (-plaidTransaction.amount)) < 0.01 &&
          new Date(existing.date).toDateString() === new Date(plaidTransaction.date).toDateString()
        );
        
        const exists = existingByPlaidId || existsByContent;
        
        if (!exists) {
          const transactionData = formatPlaidTransactionData(plaidTransaction, user.id, accountId);
          await storage.createTransaction(transactionData);
          newTransactionsCount++;
        }
      }
      
      console.log(`Synced ${newTransactionsCount} new transactions for account ${accountId}`);
      
      res.json({ 
        message: 'Transaction sync completed',
        newTransactions: newTransactionsCount,
        dateRange: { start: startDateStr, end: endDateStr }
      });
      
    } catch (error) {
      console.error('Error syncing transactions:', error);
      res.status(500).json({ error: 'Failed to sync transactions' });
    }
  });



  // Force refresh recent transactions (last 7 days) for all accounts
  app.post('/api/plaid/refresh-transactions', requireAccess, async (req, res) => {
    try {
      const user = req.user as User;
      const { days = 7 } = req.body; // Default to last 7 days for cost efficiency
      
      const accounts = await storage.getAccounts(user.id);
      const plaidAccounts = accounts.filter(account => account.plaidAccessToken);
      
      if (plaidAccounts.length === 0) {
        return res.json({ message: 'No Plaid-connected accounts found' });
      }
      
      let totalNewTransactions = 0;
      let errors = [];
      
      for (const account of plaidAccounts) {
        try {
          console.log(`Refreshing transactions for ${account.institutionName} - ${account.accountName}`);
          
          // Get recent transactions - ensuring we capture current month's data
          const now = new Date();
          const endDate = new Date(now);
          endDate.setDate(endDate.getDate() + 1); // Include tomorrow to catch pending transactions
          
          // Start from beginning of current month or 30 days ago, whichever is more recent
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const daysAgo = new Date(now);
          daysAgo.setDate(daysAgo.getDate() - Math.max(days, 30)); // At least 30 days
          
          const startDate = startOfMonth > daysAgo ? startOfMonth : daysAgo;
          
          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];
          
          console.log(`🔄 Fetching transactions from ${startDateStr} to ${endDateStr} (today is ${now.toISOString().split('T')[0]})`);
          
          const transactionsResponse = await getTransactions(
            account.plaidAccessToken!,
            startDateStr,
            endDateStr
          );
          
          // Filter for this account
          const accountTransactions = transactionsResponse.transactions.filter(
            t => t.account_id === account.plaidAccountId
          );
          
          console.log(`Found ${accountTransactions.length} recent transactions for ${account.institutionName}`);
          
          // Debug: Show the dates of the transactions Plaid returned
          if (accountTransactions.length > 0) {
            const dates = accountTransactions.map(t => t.date).sort().reverse();
            console.log(`📅 Transaction dates from Plaid: ${dates.slice(0, 10).join(', ')}${dates.length > 10 ? '...' : ''}`);
            const today = now.toISOString().split('T')[0];
            const recentCount = accountTransactions.filter(t => t.date >= today).length;
            console.log(`📊 Recent transactions (today or later): ${recentCount}/${accountTransactions.length}`);
          } else {
            console.log(`⚠️  NO transactions returned by Plaid for date range ${startDateStr} to ${endDateStr}!`);
            console.log(`🔍 This could indicate: 1) No transactions in this period, 2) Plaid API issue, 3) Account connection issue`);
          }
          
          // Add each new transaction
          let newTransactionsCount = 0;
          for (const plaidTransaction of accountTransactions) {
            try {
              // Check if already exists by Plaid ID
              const exists = await storage.getTransactionByPlaidId(plaidTransaction.transaction_id);
              
              if (!exists) {
                const transactionData = formatPlaidTransactionData(plaidTransaction, user.id, account.id);
                await storage.createTransaction(transactionData);
                newTransactionsCount++;
                console.log(`Added: ${plaidTransaction.merchant_name || plaidTransaction.name} - $${Math.abs(plaidTransaction.amount)}`);
              }
            } catch (transactionError: any) {
              // Handle duplicate constraint violations gracefully
              if (transactionError.code === '23505') {
                console.log(`Skipped duplicate: ${plaidTransaction.transaction_id}`);
              } else {
                console.error(`Transaction error: ${transactionError.message}`);
              }
            }
          }
          
          totalNewTransactions += newTransactionsCount;
          console.log(`${account.institutionName}: Added ${newTransactionsCount} new transactions`);
          
        } catch (accountError: any) {
          const errorMsg = `${account.institutionName}: ${accountError.message}`;
          errors.push(errorMsg);
          console.error(`Error refreshing ${account.institutionName}:`, accountError.message);
        }
      }
      
      res.json({
        message: totalNewTransactions > 0 ? 
          `Added ${totalNewTransactions} new transactions` : 
          'No new transactions found (bank may not have posted recent transactions yet)',
        newTransactions: totalNewTransactions,
        accountsProcessed: plaidAccounts.length,
        errors: errors.length > 0 ? errors : null,
        dateRange: `${new Date().getDate() - days} days ago to tomorrow`
      });
      
    } catch (error) {
      console.error('Error refreshing transactions:', error);
      res.status(500).json({ error: 'Failed to refresh transactions' });
    }
  });

  // Comprehensive sync: refresh balances and sync recent transactions
  app.post('/api/plaid/full-sync', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { days = 7 } = req.body; // Default to last 7 days for quicker sync
      
      // Get all connected accounts
      const accounts = await storage.getAccounts(user.id);
      const plaidAccounts = accounts.filter(account => account.plaidAccessToken);
      
      if (plaidAccounts.length === 0) {
        return res.json({ message: 'No Plaid-connected accounts to sync' });
      }
      
      let totalNewTransactions = 0;
      let updatedBalances = 0;
      
      for (const account of plaidAccounts) {
        try {
          console.log(`Full sync for ${account.institutionName} account: ${account.accountName} (last ${days} days)`);
          
          // 1. Refresh account balance
          const plaidData = await getAccounts(account.plaidAccessToken!);
          const plaidAccount = plaidData.accounts.find(
            acc => acc.account_id === account.plaidAccountId
          );
          
          if (plaidAccount && plaidAccount.balances.current !== null) {
            const oldBalance = account.balance;
            const newBalance = plaidAccount.balances.current;
            
            await storage.updateAccount(account.id, {
              balance: newBalance
            });
            updatedBalances++;
            console.log(`${account.institutionName} - Balance updated: $${oldBalance} → $${newBalance}`);
          }
          
          // 2. Sync recent transactions
          const today = new Date();
          const startDate = new Date(today);
          startDate.setDate(today.getDate() - days);
          
          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = today.toISOString().split('T')[0];
          
          const transactionsResponse = await getTransactions(
            account.plaidAccessToken!, 
            startDateStr, 
            endDateStr
          );
          
          const accountTransactions = transactionsResponse.transactions.filter(
            t => t.account_id === account.plaidAccountId
          );
          
          // Check for new transactions
          const existingTransactions = await storage.getAccountTransactions(account.id, 1000);
          
          console.log(`${account.institutionName} - Found ${accountTransactions.length} transactions in date range`);
          
          // Create sets for super fast duplicate checking using both Plaid ID and content
          const existingPlaidIds = new Set();
          const existingTransactionMap = new Map();
          
          existingTransactions.forEach(tx => {
            if (tx.plaidTransactionId) {
              existingPlaidIds.add(tx.plaidTransactionId);
            }
            const key = `${tx.description}-${Math.round(parseFloat(tx.amount.toString()) * 100)}-${new Date(tx.date).toDateString()}`;
            existingTransactionMap.set(key, true);
          });

          for (const plaidTransaction of accountTransactions) {
            const plaidTransactionId = plaidTransaction.transaction_id;
            const transactionKey = `${plaidTransaction.name}-${Math.round(plaidTransaction.amount * 100)}-${new Date(plaidTransaction.date).toDateString()}`;
            
            // Check both Plaid ID and content-based duplicates
            const isDuplicate = existingPlaidIds.has(plaidTransactionId) || existingTransactionMap.has(transactionKey);
            
            if (!isDuplicate) {
              const transactionData = formatPlaidTransactionData(plaidTransaction, user.id, account.id);
              
              try {
                await storage.createTransaction(transactionData);
                totalNewTransactions++;
                console.log(`${account.institutionName} - Added new transaction: ${plaidTransaction.name} $${plaidTransaction.amount}`);
                
                // Add to sets to prevent duplicates within this sync batch
                existingPlaidIds.add(plaidTransactionId);
                existingTransactionMap.set(transactionKey, true);
              } catch (error: any) {
                if (error.code === '23505') { // Unique constraint violation
                  console.log(`${account.institutionName} - Skipped duplicate transaction (database constraint): ${plaidTransaction.name}`);
                } else {
                  throw error;
                }
              }
            } else {
              console.log(`${account.institutionName} - Skipped duplicate transaction: ${plaidTransaction.name} $${plaidTransaction.amount}`);
            }
          }
          
        } catch (accountError: any) {
          console.error(`Error syncing ${account.institutionName} account ${account.accountName}:`, accountError.message);
          
          // Navy Federal specific error handling
          if (account.institutionName?.toLowerCase().includes('navy federal')) {
            if (accountError.response?.data?.error_code === 'ITEM_LOGIN_REQUIRED') {
              console.error('Navy Federal requires re-authentication - user needs to reconnect account');
            } else if (accountError.response?.data?.error_code === 'TRANSACTIONS_NOT_READY') {
              console.error('Navy Federal transactions are still processing - this can take 24-48 hours for new connections');
            } else if (accountError.response?.data?.error_code === 'PRODUCTS_NOT_SUPPORTED') {
              console.error('Navy Federal may have limited transaction support - check Plaid institution status');
            }
          }
        }
      }
      
      console.log(`Full sync completed: ${updatedBalances} balances updated, ${totalNewTransactions} new transactions`);
      
      // Add specific messaging for Navy Federal users
      const navyFederalAccounts = plaidAccounts.filter(acc => 
        acc.institutionName?.toLowerCase().includes('navy federal')
      );
      
      if (navyFederalAccounts.length > 0 && totalNewTransactions === 0) {
        console.log('Navy Federal sync note: If no new transactions found, this may be normal. Navy Federal can have delayed transaction posting.');
      }
      
      res.json({
        message: 'Full sync completed successfully',
        updatedBalances,
        newTransactions: totalNewTransactions,
        syncedAccounts: plaidAccounts.length,
        note: navyFederalAccounts.length > 0 && totalNewTransactions === 0 ? 
          'Navy Federal transactions may take 24-48 hours to appear after recent account activity.' : undefined
      });
      
    } catch (error) {
      console.error('Error in full sync:', error);
      res.status(500).json({ error: 'Failed to complete full sync' });
    }
  });
  
  // Transactions routes
  app.get('/api/transactions', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const transactions = await storage.getTransactions(user.id, limit);
      res.json(transactions);
    } catch (error) {
      console.error('Error getting transactions:', error);
      res.status(500).json({ error: 'Failed to get transactions' });
    }
  });
  
  app.get('/api/accounts/:id/transactions', requireAuth, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      const user = req.user as User;
      
      // Check if the account belongs to the user
      if (account.userId !== user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const transactions = await storage.getAccountTransactions(accountId, limit);
      res.json(transactions);
    } catch (error) {
      console.error('Error getting account transactions:', error);
      res.status(500).json({ error: 'Failed to get account transactions' });
    }
  });

  // AI routes - Legacy endpoint with mock data for compatibility
  app.get('/api/ai/insights', requireAccess, async (req, res) => {
    try {
      // In a real app, you would fetch user's financial data and pass it to the AI
      const userData = {
        spending: [
          { category: 'Food & Dining', currentMonth: 820.45, previousMonth: 610.32 },
          { category: 'Housing', currentMonth: 1450.00, previousMonth: 1450.00 },
          { category: 'Transportation', currentMonth: 385.20, previousMonth: 412.75 },
          { category: 'Shopping', currentMonth: 605.85, previousMonth: 545.85 }
        ],
        income: 5000,
        savings: 5420,
        savingsGoal: 10000,
        creditScore: 752
      };
      
      const insights = await generateFinancialInsights(userData);
      res.json(insights);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      res.status(500).json({ message: 'Failed to generate insights' });
    }
  });

  // New proactive AI insights endpoint using real user data
  app.get('/api/ai/proactive-insights', requireAccess, async (req, res) => {
    try {
      const user = req.user as User;
      const { generateProactiveInsights } = await import('./openai');
      
      // Get comprehensive user financial data
      const accounts = await storage.getAccounts(user.id);
      const transactions = await storage.getTransactions(user.id, 100); // Last 100 transactions
      const budgets = await storage.getBudgets(user.id);
      const savingsGoals = await storage.getSavingsGoals(user.id);
      const creditScore = await storage.getCreditScore(user.id);
      
      // Calculate financial metrics
      const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
      const totalExpenses = transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Group spending by category
      const categorySpending: Record<string, number> = {};
      transactions
        .filter(t => t.amount < 0)
        .forEach(t => {
          const category = t.category || 'Other';
          if (!categorySpending[category]) {
            categorySpending[category] = 0;
          }
          categorySpending[category] += Math.abs(t.amount);
        });

      // Calculate recent spending trends (last 30 days vs previous 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentSpending = transactions
        .filter(t => t.amount < 0 && new Date(t.date) >= thirtyDaysAgo)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const previousSpending = transactions
        .filter(t => t.amount < 0 && new Date(t.date) >= sixtyDaysAgo && new Date(t.date) < thirtyDaysAgo)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Prepare comprehensive data for AI analysis
      const userData = {
        firstName: user.firstName,
        lastName: user.lastName,
        accounts: accounts.map(account => ({
          type: account.accountType,
          balance: account.balance,
          institution: account.institutionName,
          accountName: account.accountName
        })),
        totalBalance,
        totalExpenses,
        recentSpending,
        previousSpending,
        spendingTrend: previousSpending > 0 ? ((recentSpending - previousSpending) / previousSpending * 100) : 0,
        transactionCount: transactions.length,
        spendingByCategory: categorySpending,
        budgets: budgets.map(b => ({
          category: b.category,
          budgetAmount: b.budgetAmount,
          spent: b.spent,
          remaining: b.remaining
        })),
        savingsGoals: savingsGoals.map(g => ({
          name: g.name,
          target: g.targetAmount,
          current: g.currentAmount,
          progress: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount * 100) : 0
        })),
        creditScore: creditScore ? creditScore.score : null,
        hasAccounts: accounts.length > 0,
        hasTransactions: transactions.length > 0,
        // Add context for better insights
        accountCount: accounts.length,
        budgetCount: budgets.length,
        goalsCount: savingsGoals.length
      };
      
      const insights = await generateProactiveInsights(userData);
      res.json(insights);
    } catch (error) {
      console.error('Error generating proactive AI insights:', error);
      res.status(500).json({ message: 'Failed to generate proactive insights' });
    }
  });



  app.get('/api/ai/budget-recommendations', requireAccess, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Get user's transactions to calculate spending by category
      const transactions = await storage.getTransactions(user.id);
      const accounts = await storage.getAccounts(user.id);
      
      // Calculate total balance
      const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
      
      // Group transactions by category and calculate spending
      const categorySpending: Record<string, number> = {};
      transactions.forEach(transaction => {
        // Only consider expenses (negative amounts)
        if (transaction.amount < 0) {
          const category = transaction.category || 'Other';
          if (!categorySpending[category]) {
            categorySpending[category] = 0;
          }
          categorySpending[category] += Math.abs(transaction.amount);
        }
      });
      
      // Convert to array format for the AI
      const categories = Object.entries(categorySpending).map(([name, spending]) => ({
        name,
        spending
      }));
      
      // Estimate monthly income (in a real app, this would come from user input or detected income transactions)
      // For now, we'll use a default or calculate based on deposits
      let income = 5000; // Default income
      
      // Try to detect income from positive transactions
      const possibleIncomeTransactions = transactions.filter(t => t.amount > 0 && 
        (t.description?.toLowerCase().includes('deposit') || 
         t.description?.toLowerCase().includes('salary') || 
         t.description?.toLowerCase().includes('payroll')));
      
      if (possibleIncomeTransactions.length > 0) {
        // Use the largest positive transaction as a proxy for monthly income
        income = Math.max(...possibleIncomeTransactions.map(t => t.amount));
      }
      
      const spendingData = {
        income,
        totalBalance,
        categories,
        transactionCount: transactions.length,
        periodDays: 30 // Assuming data covers roughly the last month
      };
      
      const recommendations = await generateBudgetRecommendations(spendingData);
      res.json(recommendations);
    } catch (error) {
      console.error('Error generating budget recommendations:', error);
      res.status(500).json({ message: 'Failed to generate budget recommendations' });
    }
  });

  // Monthly spending trends endpoint - provides data for the trends chart
  app.get('/api/spending-trends', requireAccess, async (req, res) => {
    try {
      const user = req.user as User;
      console.log(`📊 Generating spending trends for user ${user.id}`);
      
      // Get more transactions to ensure we have enough data (limit 500)
      const transactions = await storage.getTransactions(user.id, 500);
      
      console.log(`Found ${transactions.length} transactions for spending trends`);
      
      if (transactions.length === 0) {
        console.log('No transactions found, returning empty data');
        return res.json({
          spendingData: [],
          categories: []
        });
      }
      
      // Group transactions by month for the last 12 months (increased from 6)
      const now = new Date();
      const monthlyData: Record<string, { income: number; expenses: number; month: string }> = {};
      const categoryTotals: Record<string, number> = {};
      
      // Generate last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        monthlyData[monthKey] = {
          income: 0,
          expenses: 0,
          month: monthLabel
        };
      }
      
      // Process transactions with better logging and precision handling
      let processedCount = 0;
      let incomeCount = 0;
      let expenseCount = 0;
      
      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const monthKey = transactionDate.toISOString().slice(0, 7);
        
        if (monthlyData[monthKey]) {
          processedCount++;
          
          if (transaction.amount > 0) {
            // Income - round to 2 decimal places to avoid floating point issues
            const roundedAmount = Math.round(transaction.amount * 100) / 100;
            monthlyData[monthKey].income += roundedAmount;
            incomeCount++;
          } else {
            // Expenses - round to 2 decimal places to avoid floating point issues
            const roundedAmount = Math.round(Math.abs(transaction.amount) * 100) / 100;
            monthlyData[monthKey].expenses += roundedAmount;
            expenseCount++;
            
            // Track category spending
            const category = transaction.category || 'Other';
            categoryTotals[category] = Math.round(((categoryTotals[category] || 0) + roundedAmount) * 100) / 100;
          }
        }
      });
      
      console.log(`Processed ${processedCount} transactions: ${incomeCount} income, ${expenseCount} expenses`);
      
      // Convert to array format for chart with proper rounding
      const spendingData = Object.values(monthlyData).map(data => ({
        ...data,
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100
      }));
      
      // Create spending categories with icons and colors
      const categoryColors = [
        'bg-blue-500',
        'bg-green-500', 
        'bg-purple-500',
        'bg-orange-500',
        'bg-red-500',
        'bg-yellow-500',
        'bg-pink-500',
        'bg-indigo-500'
      ];
      
      const categoryIcons = [
        'shopping_cart',
        'home',
        'restaurant',
        'directions_car',
        'local_gas_station',
        'school',
        'fitness_center',
        'category'
      ];
      
      const categories = Object.entries(categoryTotals)
        .map(([name, amount], index) => ({
          name,
          amount: Math.round(amount * 100) / 100, // Round category amounts
          color: categoryColors[index % categoryColors.length],
          icon: categoryIcons[index % categoryIcons.length]
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8); // Top 8 categories
      
      console.log(`Returning ${spendingData.length} months of data and ${categories.length} categories`);
      
      res.json({
        spendingData,
        categories
      });
      
    } catch (error) {
      console.error('Error generating spending trends:', error);
      res.status(500).json({ error: 'Failed to generate spending trends' });
    }
  });

  // Income vs Spending Report endpoint - uses saved budget analysis data for pie chart
  app.get('/api/reports/income-spending', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const period = (req.query.period as string) || 'month';
      
      // Get transactions and budgets
      const transactions = await storage.getTransactions(user.id, 500);
      const budgets = await storage.getBudgets(user.id);
      
      if (transactions.length === 0) {
        return res.json({
          period,
          income: 0,
          spending: 0,
          previousIncome: 0,
          previousSpending: 0,
          categories: [],
          transactions: [],
          hasAnalysis: false
        });
      }
      
      const now = new Date();
      let currentPeriodStart: Date;
      let previousPeriodStart: Date;
      let previousPeriodEnd: Date;
      
      if (period === 'week') {
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        previousPeriodEnd = new Date(currentPeriodStart);
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
      } else {
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        previousPeriodEnd = new Date(currentPeriodStart);
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      }
      
      // Calculate totals from transactions
      let currentIncome = 0;
      let currentSpending = 0;
      let previousIncome = 0;
      let previousSpending = 0;
      const recentTransactions: any[] = [];
      
      transactions.forEach(t => {
        const tDate = new Date(t.date);
        
        if (tDate >= currentPeriodStart && tDate <= now) {
          if (t.amount > 0) {
            currentIncome += t.amount;
          } else {
            currentSpending += Math.abs(t.amount);
          }
          
          if (recentTransactions.length < 10) {
            recentTransactions.push({
              id: t.id,
              description: t.merchantName || t.description || 'Transaction',
              amount: t.amount,
              type: t.amount > 0 ? 'income' : 'expense',
              date: new Date(t.date).toLocaleDateString(),
              category: t.category || 'Other'
            });
          }
        }
        
        if (tDate >= previousPeriodStart && tDate < previousPeriodEnd) {
          if (t.amount > 0) {
            previousIncome += t.amount;
          } else {
            previousSpending += Math.abs(t.amount);
          }
        }
      });
      
      // Use saved budget analysis data for pie chart categories
      // This data is saved when user clicks "Analyze My Spending" on the Budget page
      let categories: { name: string; amount: number; percentage: number }[] = [];
      const hasAnalysis = budgets.length > 0 && budgets.some(b => b.spent > 0);
      
      if (hasAnalysis) {
        // Use the saved budget spending data from "Analyze My Spending"
        const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0) || 1;
        
        // Category display name mapping
        const categoryNames: Record<string, string> = {
          'tithe': 'Tithe',
          'charitable_giving': 'Charitable Giving',
          'emergency_fund': 'Emergency Fund',
          'retirement': 'Retirement',
          'college_fund': 'College Fund',
          'mortgage_rent': 'Housing',
          'utilities': 'Utilities',
          'phone': 'Phone',
          'internet': 'Internet',
          'cable': 'Subscriptions',
          'car_payment': 'Car Payment',
          'auto_insurance': 'Auto Insurance',
          'gas': 'Gas',
          'maintenance': 'Maintenance',
          'groceries': 'Groceries',
          'restaurants': 'Restaurants',
          'clothing': 'Clothing',
          'personal_care': 'Personal Care',
          'health_fitness': 'Health & Fitness',
          'entertainment': 'Entertainment',
          'miscellaneous': 'Shopping',
          'travel': 'Travel',
          'credit_cards': 'Credit Cards',
          'student_loans': 'Student Loans',
          'other_debt': 'Other Debt'
        };
        
        categories = budgets
          .filter(b => b.spent > 0)
          .map(b => ({
            name: categoryNames[b.category] || b.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            amount: Math.round(b.spent * 100) / 100,
            percentage: Math.round((b.spent / totalSpent) * 100 * 10) / 10
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 8);
      }
      
      res.json({
        period,
        income: Math.round(currentIncome * 100) / 100,
        spending: Math.round(currentSpending * 100) / 100,
        previousIncome: Math.round(previousIncome * 100) / 100 || 1,
        previousSpending: Math.round(previousSpending * 100) / 100 || 1,
        categories,
        transactions: recentTransactions,
        hasAnalysis
      });
      
    } catch (error) {
      console.error('Error generating income-spending report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  });
  
  // Credit score analysis and improvement recommendations
  app.get('/api/ai/credit-score-analysis', requireAccess, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Fetch fresh credit score data from Experian
      const { fetchCreditScore } = await import('./credit');
      const experianData = await fetchCreditScore(user.id);
      
      if (!experianData) {
        return res.status(404).json({ message: 'Credit score data not found' });
      }
      
      // Store the credit score data for future reference
      try {
        await storage.createCreditScore({
          userId: user.id,
          score: experianData.score,
          rating: experianData.rating,
          factors: experianData.factors
        });
      } catch (error) {
        console.log('Could not store credit score, continuing with analysis');
      }
      
      const creditScoreData = experianData;
      
      // Prepare data for the AI
      const creditData = {
        score: creditScoreData.score,
        factors: [
          { 
            name: 'Payment History', 
            impact: 'High',
            status: creditScoreData.score > 700 ? 'Good' : 'Needs Improvement' 
          },
          { 
            name: 'Credit Utilization', 
            impact: 'High',
            status: creditScoreData.score > 680 ? 'Good' : 'Needs Improvement' 
          },
          { 
            name: 'Credit Age', 
            impact: 'Medium',
            status: creditScoreData.score > 650 ? 'Average' : 'Short History' 
          },
          { 
            name: 'Account Mix', 
            impact: 'Low',
            status: creditScoreData.score > 720 ? 'Diverse' : 'Limited' 
          },
          { 
            name: 'Recent Inquiries', 
            impact: 'Low',
            status: creditScoreData.score > 690 ? 'Few' : 'Several Recent' 
          }
        ],
        user: {
          hasLatePaments: creditScoreData.score < 650,
          highUtilization: creditScoreData.score < 680,
          shortHistory: creditScoreData.score < 650
        }
      };
      
      const analysis = await analyzeCreditScore(creditData);
      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing credit score:', error);
      res.status(500).json({ message: 'Failed to analyze credit score' });
    }
  });
  
  // Comprehensive financial health assessment
  app.get('/api/ai/financial-health', requireAccess, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Get all relevant user data
      const accounts = await storage.getAccounts(user.id);
      const transactions = await storage.getTransactions(user.id, 100); // Last 100 transactions
      const budgets = await storage.getBudgets(user.id);
      const savingsGoals = await storage.getSavingsGoals(user.id);
      const creditScore = await storage.getCreditScore(user.id);
      
      // Prepare comprehensive user data
      const userData = {
        accounts: accounts.map(account => ({
          type: account.accountType,
          balance: account.balance,
          institution: account.institutionName
        })),
        
        totalAssets: accounts
          .filter(a => a.balance > 0)
          .reduce((sum, a) => sum + a.balance, 0),
          
        totalDebt: accounts
          .filter(a => a.balance < 0)
          .reduce((sum, a) => sum + Math.abs(a.balance), 0),
        
        recentTransactions: transactions.map(t => ({
          amount: t.amount,
          category: t.category,
          date: t.date,
          description: t.description
        })),
        
        spendingByCategory: transactions
          .filter(t => t.amount < 0)
          .reduce((categories: Record<string, number>, t) => {
            const category = t.category || 'Other';
            if (!categories[category]) categories[category] = 0;
            categories[category] += Math.abs(t.amount);
            return categories;
          }, {}),
        
        budgets: budgets.map(b => ({
          category: b.category,
          limit: b.amount,
          spent: b.spent,
          remaining: b.remaining
        })),
        
        savingsGoals: savingsGoals.map(g => ({
          name: g.name,
          target: g.targetAmount,
          current: g.currentAmount,
          progress: (g.currentAmount / g.targetAmount) * 100
        })),
        
        creditScore: creditScore ? creditScore.score : null
      };
      
      const healthReport = await generateFinancialHealthReport(userData);
      res.json(healthReport);
    } catch (error) {
      console.error('Error generating financial health report:', error);
      res.status(500).json({ message: 'Failed to generate financial health report' });
    }
  });
  
  // Money Mind Interview endpoint - Save user responses and generate Money Playbook
  app.post('/api/ai/interview', requireAccess, async (req, res) => {
    try {
      const { responses, completedAt } = req.body;
      const user = req.user as User;
      
      // Validate request body
      if (!responses || typeof responses !== 'object') {
        return res.status(400).json({ message: 'Interview responses are required' });
      }
      
      // Get user's financial data for context
      const accounts = await storage.getAccounts(user.id);
      const transactions = await storage.getTransactions(user.id);
      
      // Generate AI-powered Money Playbook based on interview responses
      const { generateMoneyPlaybook } = await import('./openai');
      const moneyPlaybook = await generateMoneyPlaybook({
        userName: user.firstName || user.username,
        userResponses: responses,
        financialContext: {
          accounts: accounts.map(a => ({ name: a.accountName, type: a.accountType, balance: a.balance })),
          recentSpending: transactions.slice(0, 20).map(t => ({ 
            name: t.description, 
            amount: t.amount, 
            category: t.category 
          }))
        }
      });
      
      // Save interview responses and Money Playbook to database
      const interview = await storage.createInterview({
        userId: user.id,
        responses,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
        personalizedPlan: moneyPlaybook
      });
      
      // Store the interview completion as an insight
      await storage.createInsight({
        userId: user.id,
        type: 'interview',
        title: 'Money Mind Interview Completed',
        description: `Your Money Playbook has been created! You are "${moneyPlaybook.moneyPersonalityType}". View your personalized 30-day action plan.`,
        severity: 'info'
      });
      
      res.json({ 
        success: true, 
        message: 'Money Playbook generated successfully',
        interviewId: interview.id,
        moneyPlaybook 
      });
    } catch (error) {
      console.error('Error saving interview responses:', error);
      res.status(500).json({ message: 'Failed to generate Money Playbook' });
    }
  });

  // Get latest interview data and Money Playbook
  app.get('/api/ai/interview/latest', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Get the latest interview with Money Playbook from database
      const interview = await storage.getLatestInterview(user.id);
      
      if (!interview) {
        return res.json({ hasInterview: false });
      }
      
      res.json({
        hasInterview: true,
        interview: {
          id: interview.id,
          completedAt: interview.completedAt,
          responses: interview.responses,
          moneyPlaybook: interview.personalizedPlan
        }
      });
    } catch (error) {
      console.error('Error fetching interview data:', error);
      res.status(500).json({ message: 'Failed to fetch interview data' });
    }
  });
  
  // Generate weekly spending analysis based on Money Playbook
  app.get('/api/ai/weekly-analysis', requireAccess, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Get the latest Money Playbook
      const interview = await storage.getLatestInterview(user.id);
      if (!interview || !interview.personalizedPlan) {
        return res.status(400).json({ 
          message: 'Please complete the Money Mind Interview first to get weekly analysis' 
        });
      }
      
      // Get this week's transactions
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const transactions = await storage.getTransactions(user.id);
      const weeklyTransactions = transactions.filter(t => 
        new Date(t.date) >= oneWeekAgo
      );
      
      // Generate weekly analysis
      const { generateWeeklySpendingAnalysis } = await import('./openai');
      const weeklyAnalysis = await generateWeeklySpendingAnalysis({
        userName: user.firstName || user.username,
        moneyPlaybook: interview.personalizedPlan,
        weeklySpending: weeklyTransactions.map(t => ({
          name: t.description,
          amount: t.amount,
          category: t.category,
          date: t.date
        }))
      });
      
      res.json(weeklyAnalysis);
    } catch (error) {
      console.error('Error generating weekly analysis:', error);
      res.status(500).json({ message: 'Failed to generate weekly analysis' });
    }
  });

  // Daily Check-In - Get today's check-in or create a new one
  app.get('/api/daily-checkin', requireAccess, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Check if there's already a check-in for today
      let checkin = await storage.getTodayCheckin(user.id);
      
      if (checkin) {
        const streak = await storage.getCheckinStreak(user.id);
        return res.json({ 
          checkin,
          streak,
          isNew: false
        });
      }
      
      // Get the user's Money Playbook for personalized content
      const interview = await storage.getLatestInterview(user.id);
      
      if (!interview || !interview.personalizedPlan) {
        return res.status(400).json({ 
          message: 'Complete the Money Mind Interview first to access daily check-ins',
          needsInterview: true
        });
      }
      
      const playbook = interview.personalizedPlan as any;
      
      // Generate today's AI insight based on their playbook
      const { generateDailyInsight } = await import('./openai');
      const { insight, score } = await generateDailyInsight({
        userName: user.firstName || user.username,
        personalityType: playbook.moneyPersonalityType,
        dailyHabit: playbook.dailyHabit,
        spendingTriggers: playbook.spendingTriggers,
        behavioralPatterns: playbook.behavioralPatterns,
        weeklyFocus: playbook.weeklyFocus,
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' })
      });
      
      // Create today's check-in
      checkin = await storage.createDailyCheckin({
        userId: user.id,
        date: new Date(),
        moneyMindScore: score,
        habitCompleted: false,
        habitText: playbook.dailyHabit,
        aiInsight: insight,
        streak: 1
      });
      
      // Update streak
      const streak = await storage.getCheckinStreak(user.id);
      if (streak > 1) {
        await storage.updateDailyCheckin(checkin.id, { streak });
        checkin.streak = streak;
      }
      
      res.json({ 
        checkin,
        streak,
        isNew: true
      });
    } catch (error) {
      console.error('Error with daily check-in:', error);
      res.status(500).json({ message: 'Failed to load daily check-in' });
    }
  });

  // Mark habit as completed for today's check-in
  app.post('/api/daily-checkin/complete-habit', requireAccess, async (req, res) => {
    try {
      const user = req.user as User;
      
      const checkin = await storage.getTodayCheckin(user.id);
      
      if (!checkin) {
        return res.status(404).json({ message: 'No check-in found for today' });
      }
      
      const updated = await storage.updateDailyCheckin(checkin.id, {
        habitCompleted: true
      });
      
      res.json({ 
        success: true,
        checkin: updated
      });
    } catch (error) {
      console.error('Error completing habit:', error);
      res.status(500).json({ message: 'Failed to complete habit' });
    }
  });

  // Debug endpoint to see what user data is available
  app.get('/api/debug/user-data', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const accounts = await storage.getAccounts(user.id);
      const transactions = await storage.getTransactions(user.id, 10);
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName
        },
        accounts: accounts,
        transactionCount: transactions.length,
        sampleTransactions: transactions.slice(0, 3)
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get debug data' });
    }
  });

  // AI Budget Creation - Money Mind analyzes spending and creates personalized budget
  app.post('/api/ai/create-budget', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Get comprehensive user financial data
      const accounts = await storage.getAccounts(user.id);
      const transactions = await storage.getTransactions(user.id, 100); // Last 100 transactions for better analysis
      const existingBudgets = await storage.getBudgets(user.id);
      const savingsGoals = await storage.getSavingsGoals(user.id);
      
      // Calculate financial stats for AI analysis
      const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
      const monthlyExpenses = transactions
        .filter(t => t.amount < 0 && isWithinLastMonth(new Date(t.date)))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const monthlyIncome = transactions
        .filter(t => t.amount > 0 && isWithinLastMonth(new Date(t.date)))
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Group spending by category for the last month
      const categorySpending: Record<string, number> = {};
      transactions
        .filter(t => t.amount < 0 && isWithinLastMonth(new Date(t.date)))
        .forEach(t => {
          const category = t.category || 'Other';
          if (!categorySpending[category]) {
            categorySpending[category] = 0;
          }
          categorySpending[category] += Math.abs(t.amount);
        });
      
      // Prepare data for AI analysis
      const userData = {
        firstName: user.firstName,
        accounts: accounts.map(account => ({
          type: account.accountType,
          balance: account.balance,
          institution: account.institutionName
        })),
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        spendingByCategory: categorySpending,
        existingBudgets: existingBudgets.length,
        savingsGoals: savingsGoals.map(g => ({
          name: g.name,
          target: g.targetAmount,
          current: g.currentAmount
        })),
        transactionCount: transactions.length
      };
      
      console.log('AI Budget Creation - Analyzing spending data for:', user.firstName, {
        monthlyIncome,
        monthlyExpenses,
        categoriesFound: Object.keys(categorySpending).length,
        transactionCount: transactions.length
      });
      
      // Get AI budget recommendations
      const budgetPlan = await createPersonalizedBudget(userData);
      
      // Save AI-generated budget categories to database
      const createdBudgets = [];
      if (budgetPlan.budgetPlan && budgetPlan.budgetPlan.budgetCategories) {
        for (const category of budgetPlan.budgetPlan.budgetCategories) {
          try {
            const newBudget = await storage.createBudget({
              userId: user.id,
              category: category.category,
              amount: category.recommendedAmount,
              period: 'monthly',
              spent: category.currentSpending || 0,
              icon: category.icon || '💰'
            });
            createdBudgets.push(newBudget);
          } catch (error) {
            console.error('Error creating budget category:', category.category, error);
          }
        }
      }
      
      res.json({
        success: true,
        budgetPlan,
        createdBudgets: createdBudgets.length,
        message: `Money Mind created ${createdBudgets.length} budget categories based on your spending patterns`
      });
      
    } catch (error) {
      console.error('Error creating AI budget:', error);
      res.status(500).json({ message: 'Failed to create AI budget' });
    }
  });

  // Money Mind AI coaching endpoint
  app.post('/api/ai/coaching', requireAuth, async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: 'Question is required' });
      }
      
      const user = req.user as User;
      
      // Get relevant user financial data to provide context to the model
      const accounts = await storage.getAccounts(user.id);
      const transactions = await storage.getTransactions(user.id, 50); // Last 50 transactions
      const budgets = await storage.getBudgets(user.id);
      const savingsGoals = await storage.getSavingsGoals(user.id);
      const creditScore = await storage.getCreditScore(user.id);
      
      // Calculate financial stats
      const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
      const totalExpenses = transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Group transactions by category
      const categorySpending: Record<string, number> = {};
      transactions
        .filter(t => t.amount < 0)
        .forEach(t => {
          const category = t.category || 'Other';
          if (!categorySpending[category]) {
            categorySpending[category] = 0;
          }
          categorySpending[category] += Math.abs(t.amount);
        });
      
      // Personal information about the user to provide context
      const userData = {
        firstName: user.firstName,
        lastName: user.lastName,
        accounts: accounts.map(account => ({
          type: account.accountType,
          balance: account.balance,
          institution: account.institutionName,
          accountName: account.accountName
        })),
        totalBalance,
        totalExpenses,
        transactionCount: transactions.length,
        savingsGoals: savingsGoals.map(g => ({
          name: g.name,
          target: g.targetAmount,
          current: g.currentAmount
        })),
        spendingByCategory: categorySpending,
        creditScore: creditScore ? creditScore.score : null,
        hasAccounts: accounts.length > 0,
        hasTransactions: transactions.length > 0
      };
      
      // Log the user data being sent to OpenAI for debugging
      console.log('AI Coaching - User Data being sent to OpenAI:', JSON.stringify({
        userInfo: `${user.firstName} ${user.lastName}`,
        accountCount: accounts.length,
        totalBalance: totalBalance,
        transactionCount: transactions.length,
        question: question
      }, null, 2));
      
      // Add a personality to the coach in the prompt
      const answer = await getFinancialCoaching(question, userData);
      
      res.json({ answer });
    } catch (error) {
      console.error('Error getting coaching advice:', error);
      res.status(500).json({ message: 'Failed to get coaching advice' });
    }
  });

  // Removed mock Plaid connection endpoint - only use real Plaid connections

  // Feedback routes
  app.post("/api/feedback", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const feedbackData = {
        userId: user.id,
        type: req.body.type,
        title: req.body.title,
        message: req.body.message,
        rating: req.body.rating || null,
      };
      
      const feedback = await storage.createFeedback(feedbackData);
      res.json(feedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  app.get("/api/feedback", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Only admin users can view all feedback
      const allFeedback = await storage.getFeedback();
      res.json(allFeedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // Get user's saved budget data with spending analysis
  app.get('/api/budgets', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const budgets = await storage.getBudgets(user.id);
      res.json(budgets);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      res.status(500).json({ message: 'Failed to fetch budget data' });
    }
  });

  // Manual budget reset endpoint for testing
  app.post('/api/budgets/reset', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Reset budget data - set spent and remaining to 0 for all user's budget categories
      const userBudgets = await storage.getBudgets(user.id);
      console.log(`Manual reset: ${userBudgets.length} budget categories for user ${user.id}`);
      for (const budget of userBudgets) {
        await storage.updateBudget(budget.id, {
          spent: 0,
          remaining: budget.amount // Reset remaining to the planned amount
        });
        console.log(`Reset budget ${budget.category}: spent=0, remaining=${budget.amount}`);
      }
      
      res.json({ message: 'Budget data reset successfully', categoriesReset: userBudgets.length });
    } catch (error) {
      console.error('Error resetting budgets:', error);
      res.status(500).json({ message: 'Failed to reset budget data' });
    }
  });

  // Save/update budget data
  app.post('/api/budgets', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { budgets } = req.body;
      
      if (!Array.isArray(budgets)) {
        return res.status(400).json({ message: 'Budgets array is required' });
      }

      // Clear existing budgets and save new ones
      const existingBudgets = await storage.getBudgets(user.id);
      
      // Update or create budget entries
      const updatedBudgets = [];
      for (const budget of budgets) {
        const existing = existingBudgets.find(b => b.category === budget.category);
        if (existing) {
          const updated = await storage.updateBudget(existing.id, {
            amount: budget.amount,
            spent: budget.spent,
            remaining: budget.remaining,
            icon: budget.icon
          });
          if (updated) updatedBudgets.push(updated);
        } else {
          const created = await storage.createBudget({
            userId: user.id,
            category: budget.category,
            amount: budget.amount,
            period: 'monthly',
            spent: budget.spent,
            remaining: budget.remaining,
            icon: budget.icon
          });
          updatedBudgets.push(created);
        }
      }
      
      res.json(updatedBudgets);
    } catch (error) {
      console.error('Error saving budgets:', error);
      res.status(500).json({ message: 'Failed to save budget data' });
    }
  });

  // AI spending analysis endpoint for comprehensive budget categorization
  app.post('/api/ai/analyze-spending', requireAuth, async (req, res) => {
    try {
      const { transactions } = req.body;
      const user = req.user as User;
      
      if (!transactions || !Array.isArray(transactions)) {
        return res.status(400).json({ message: 'Transactions array is required' });
      }

      // Define comprehensive budget category mapping for AI analysis
      const budgetCategories = {
        "tithe": ["tithe", "church", "religious", "donation", "offering"],
        "charitable_giving": ["charity", "donation", "goodwill", "salvation army", "united way"],
        "emergency_fund": ["savings", "emergency", "money market"],
        "retirement": ["401k", "roth", "retirement", "pension", "ira"],
        "college_fund": ["college", "tuition", "education", "student"],
        "mortgage_rent": ["mortgage", "rent", "housing", "apartment", "lease"],
        "utilities": ["electric", "electricity", "water", "sewer", "trash", "utility"],
        "phone": ["phone", "cell", "mobile", "verizon", "att", "tmobile"],
        "internet": ["internet", "wifi", "broadband", "cable internet"],
        "cable": ["cable", "streaming", "netflix", "hulu", "spotify", "disney"],
        "car_payment": ["car payment", "auto loan", "vehicle", "honda", "toyota", "ford"],
        "auto_insurance": ["auto insurance", "car insurance", "geico", "progressive", "state farm"],
        "gas": ["gas", "fuel", "gasoline", "shell", "exxon", "chevron", "bp"],
        "maintenance": ["auto repair", "car wash", "oil change", "tire", "mechanic"],
        "groceries": ["grocery", "food", "walmart", "target", "kroger", "safeway", "whole foods"],
        "restaurants": ["restaurant", "dining", "fast food", "starbucks", "mcdonald", "pizza"],
        "clothing": ["clothing", "clothes", "shirt", "shoes", "department store"],
        "personal_care": ["haircut", "salon", "beauty", "cosmetics", "pharmacy"],
        "health_fitness": ["gym", "fitness", "doctor", "medical", "health", "hospital"],
        "entertainment": ["movie", "theater", "concert", "entertainment", "games"],
        "miscellaneous": ["amazon", "online", "purchase", "shopping"],
        "travel": ["hotel", "flight", "vacation", "travel", "airbnb"],
        "credit_cards": ["credit card", "visa", "mastercard", "amex"],
        "student_loans": ["student loan", "education loan", "navient"],
        "other_debt": ["loan", "debt", "payment", "finance"]
      };

      // Use AI to categorize transactions for monthly budget analysis
      const prompt = `
Analyze these MONTHLY financial transactions and categorize them into budget categories for a comprehensive monthly budget plan.

This is for MONTHLY BUDGET TRACKING - calculate the total spending per category for this month.

Available categories:
${Object.keys(budgetCategories).join(', ')}

Current month transactions to analyze:
${transactions.map(t => `${t.description || t.merchant_name || 'Unknown'}: $${Math.abs(t.amount)} on ${new Date(t.date).toLocaleDateString()}`).join('\n')}

For each category where spending occurred, calculate the TOTAL MONTHLY SPENDING amount and return JSON in this exact format:
{
  "categorizedSpending": [
    {
      "categoryId": "category_name", 
      "amount": total_monthly_spent_amount,
      "description": "Monthly spending summary for this category"
    }
  ]
}

IMPORTANT: 
- This is for MONTHLY BUDGET ANALYSIS - calculate total spending per category for the entire month
- Only include categories that have actual spending this month
- Be precise with the math - sum ALL transactions that belong to each category
- Use the exact category IDs from the list provided
- The amounts should represent TOTAL MONTHLY SPENDING per category
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a financial analyst expert at categorizing transactions for MONTHLY BUDGET ANALYSIS. Calculate total monthly spending per category. Respond only with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysisResult = JSON.parse(response.choices[0].message.content || '{"categorizedSpending": []}');
      
      console.log('AI Spending Analysis Result:', analysisResult);
      
      // Save the analyzed spending data to the database
      if (analysisResult.categorizedSpending && Array.isArray(analysisResult.categorizedSpending)) {
        const existingBudgets = await storage.getBudgets(user.id);
        
        for (const categorySpending of analysisResult.categorizedSpending) {
          const existing = existingBudgets.find(b => b.category === categorySpending.categoryId);
          const spentAmount = Math.abs(categorySpending.amount);
          
          if (existing) {
            // Update existing budget with new spending data
            await storage.updateBudget(existing.id, {
              spent: spentAmount,
              remaining: existing.amount - spentAmount
            });
          } else {
            // Create new budget entry with spending data
            await storage.createBudget({
              userId: user.id,
              category: categorySpending.categoryId,
              amount: 0, // No planned amount set yet
              period: 'monthly',
              spent: spentAmount,
              remaining: -spentAmount, // Negative because no planned amount
              icon: null
            });
          }
        }
        
        console.log('Saved spending analysis to database for user:', user.id);
      }
      
      res.json(analysisResult);
      
    } catch (error) {
      console.error('Error analyzing spending:', error);
      res.status(500).json({ message: 'Failed to analyze spending' });
    }
  });

  // Handle successful trial signup return from Stripe
  app.get("/subscription/success", async (req, res) => {
    const sessionId = req.query.session_id as string;
    
    if (sessionId) {
      try {
        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session.customer && session.subscription) {
          // Find user by Stripe customer ID
          const user = await storage.getUserByStripeCustomerId(session.customer as string);
          
          if (user) {
            // Get the subscription details
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            
            // Calculate trial end date
            const trialEndsAt = subscription.trial_end 
              ? new Date(subscription.trial_end * 1000) 
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            
            // Update user immediately to reflect trial status
            await storage.updateUser(user.id, {
              stripeSubscriptionId: session.subscription as string,
              hasStartedTrial: true,
              isPremium: false,
              trialEndsAt,
              subscriptionStatus: 'trialing'
            });
          }
        }
      } catch (error) {
        console.error('Error processing trial success:', error);
      }
    }
    
    // Redirect to dashboard
    res.redirect('/');
  });

  // Mobile-specific free trial activation (no Stripe required)
  app.post("/api/activate-trial", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Skip if user already has an active subscription
      if (user.isPremium || user.revenuecatExpiresAt && new Date(user.revenuecatExpiresAt) > new Date()) {
        return res.json({ 
          success: false,
          message: 'User already has an active subscription',
          hasAccess: true
        });
      }
      
      // If user has already started a trial, don't allow another one
      if (user.hasStartedTrial) {
        return res.json({ 
          success: false,
          message: 'Trial already used',
          hasAccess: !isTrialExpired(user) && user.subscriptionStatus === 'trialing'
        });
      }
      
      // Activate 14-day free trial
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
      
      await storage.updateUser(user.id, {
        hasStartedTrial: true,
        trialEndsAt,
        subscriptionStatus: 'trialing'
      });
      
      console.log(`✅ Trial activated for user ${user.id} (mobile app)`);
      
      return res.json({ 
        success: true,
        message: 'Trial activated successfully',
        trialEndsAt,
        hasAccess: true
      });
    } catch (error) {
      console.error('Error activating trial:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to activate trial' 
      });
    }
  });

  // Start free trial endpoint (web - with Stripe)
  app.post("/api/start-free-trial", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      const { planType = 'standard' } = req.body;
      
      // Skip if user already has an active subscription
      if (user.isPremium) {
        return res.json({ 
          message: 'User already has an active subscription',
          isPremium: user.isPremium,
          hasStartedTrial: user.hasStartedTrial
        });
      }
      
      // If user has already started a trial, redirect them to manage subscription
      if (user.hasStartedTrial) {
        return res.json({ 
          message: 'User already has started a trial',
          redirectToManage: true,
          isPremium: user.isPremium,
          hasStartedTrial: user.hasStartedTrial
        });
      }
      
      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user.id.toString()
          }
        });
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateUser(user.id, {
          stripeCustomerId: customerId
        });
      }
      
      // Determine the price ID based on plan type (using your existing Stripe products)
      let priceId: string;
      
      if (planType === 'annual') {
        priceId = process.env.STRIPE_ANNUAL_PRICE_ID!;
      } else {
        priceId = process.env.STRIPE_PREMIUM_PRICE_ID!; // Monthly plan
      }

      if (!priceId) {
        throw new Error(`Missing Stripe price ID for ${planType} plan`);
      }

      // Create Stripe checkout session for trial using your existing price IDs
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.protocol}://${req.get('host')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/dashboard`,
        subscription_data: {
          trial_period_days: 30,
          metadata: {
            userId: user.id.toString(),
            planType: planType
          }
        },
        allow_promotion_codes: true,
      });

      console.log(`Created Stripe checkout session for user ${user.id}: ${session.url}`);
      res.json({ checkoutUrl: session.url });
    } catch (error) {
      console.error("Error creating trial checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Trial cancellation endpoint (legacy - kept for backwards compatibility)
  app.post('/api/cancel-trial', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      if (!user.hasStartedTrial || !user.stripeSubscriptionId) {
        return res.status(400).json({ message: 'No active trial to cancel' });
      }

      // Cancel the Stripe subscription
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Update user status
      await storage.updateUser(user.id, {
        subscriptionStatus: 'cancelled'
      });

      res.json({ 
        success: true,
        message: 'Trial cancelled successfully. You can continue using the service until your trial expires.'
      });
    } catch (error) {
      console.error('Error cancelling trial:', error);
      res.status(500).json({ message: 'Failed to cancel trial' });
    }
  });

  // Subscription cancellation endpoint - handles both trials and paid subscriptions
  app.post('/api/cancel-subscription', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Check if user has a Stripe subscription to cancel
      if (!user.stripeSubscriptionId) {
        // Check if they have an Apple subscription
        if (user.revenuecatUserId) {
          return res.status(400).json({ 
            message: 'Your subscription was purchased through Apple. Please cancel it through your iPhone Settings > Subscriptions.',
            type: 'apple'
          });
        }
        return res.status(400).json({ message: 'No active subscription to cancel' });
      }

      // Cancel the Stripe subscription at period end
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Update user status
      await storage.updateUser(user.id, {
        subscriptionStatus: 'cancelled'
      });

      const isOnTrial = subscription.status === 'trialing';
      const message = isOnTrial 
        ? 'Your trial has been cancelled. You won\'t be charged when it ends.'
        : 'Your subscription has been cancelled. You\'ll continue to have access until the end of your current billing period.';

      res.json({ 
        success: true,
        message,
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toLocaleDateString() : null
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ message: 'Failed to cancel subscription. Please try again or contact support.' });
    }
  });

  // Manual trial notification endpoint (for testing)
  app.post('/api/admin/send-trial-notification', requireAuth, async (req, res) => {
    try {
      const { userId, daysRemaining } = req.body;
      const { sendTestTrialNotification } = await import('./notifications');
      
      await sendTestTrialNotification(userId, daysRemaining);
      res.json({ message: 'Test notification sent' });
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({ message: 'Failed to send notification' });
    }
  });

  // Trigger notification check manually (for testing)
  app.post('/api/admin/check-trial-notifications', requireAuth, async (req, res) => {
    try {
      const { triggerTrialCheck } = await import('./scheduler');
      await triggerTrialCheck();
      res.json({ message: 'Trial notification check completed' });
    } catch (error) {
      console.error('Error triggering trial check:', error);
      res.status(500).json({ message: 'Failed to trigger trial check' });
    }
  });

  // Test email notifications (for testing)
  app.post('/api/admin/test-email', requireAuth, async (req, res) => {
    try {
      const { sendNewUserNotification, sendWelcomeEmail } = await import('./emailService');
      const user = req.user as User;
      
      const testUser = {
        id: user.id,
        username: user.username,
        email: user.email || 'test@example.com',
        firstName: user.firstName || 'Test',
        lastName: user.lastName || 'User',
        isPremium: user.isPremium,
        hasStartedTrial: user.hasStartedTrial,
        subscriptionStatus: user.subscriptionStatus
      };
      
      const adminResult = await sendNewUserNotification(testUser);
      const welcomeResult = await sendWelcomeEmail(testUser);
      
      res.json({ 
        message: 'Test emails sent',
        adminEmailSent: adminResult,
        welcomeEmailSent: welcomeResult
      });
    } catch (error) {
      console.error('Error sending test emails:', error);
      res.status(500).json({ message: 'Failed to send test emails' });
    }
  });

  // Get savings goals
  app.get("/api/savings-goals", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const savingsGoals = await storage.getSavingsGoals(user.id);
      
      // Transform data to match the expected interface for the component
      const formattedGoals = savingsGoals.map((goal) => ({
        id: goal.id,
        name: goal.name,
        currentAmount: goal.currentAmount || 0,
        targetAmount: goal.targetAmount || 0,
        deadline: goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }) : 'No deadline',
        color: goal.color || 'blue',
        progress: goal.targetAmount > 0 ? Math.round(((goal.currentAmount || 0) / goal.targetAmount) * 100) : 0
      }));
      
      res.json(formattedGoals);
    } catch (error) {
      console.error("Error fetching savings goals:", error);
      res.status(500).json({ message: "Failed to fetch savings goals" });
    }
  });

  // Create savings goal
  app.post("/api/savings-goals", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { name, targetAmount, currentAmount, deadline, color } = req.body;
      
      // Validate required fields
      if (!name || !targetAmount) {
        return res.status(400).json({ message: "Name and target amount are required" });
      }
      
      const goalData = {
        userId: user.id,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || '0'),
        deadline: deadline ? new Date(deadline) : null,
        color: color || 'blue'
      };
      
      const newGoal = await storage.createSavingsGoal(goalData);
      
      res.status(201).json({
        id: newGoal.id,
        name: newGoal.name,
        currentAmount: newGoal.currentAmount || 0,
        targetAmount: newGoal.targetAmount || 0,
        deadline: newGoal.deadline ? new Date(newGoal.deadline).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }) : 'No deadline',
        color: newGoal.color || 'blue',
        progress: newGoal.targetAmount > 0 ? Math.round(((newGoal.currentAmount || 0) / newGoal.targetAmount) * 100) : 0
      });
    } catch (error) {
      console.error("Error creating savings goal:", error);
      res.status(500).json({ message: "Failed to create savings goal" });
    }
  });

  // Update savings goal
  app.put("/api/savings-goals/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const goalId = parseInt(req.params.id);
      const { name, targetAmount, currentAmount, deadline, color } = req.body;
      
      // Validate required fields
      if (!name || !targetAmount) {
        return res.status(400).json({ message: "Name and target amount are required" });
      }
      
      const updateData = {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || '0'),
        deadline: deadline ? new Date(deadline) : null,
        color: color || 'blue'
      };
      
      const updatedGoal = await storage.updateSavingsGoal(goalId, updateData);
      
      if (!updatedGoal) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      
      res.json({
        id: updatedGoal.id,
        name: updatedGoal.name,
        currentAmount: updatedGoal.currentAmount || 0,
        targetAmount: updatedGoal.targetAmount || 0,
        deadline: updatedGoal.deadline ? new Date(updatedGoal.deadline).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }) : 'No deadline',
        color: updatedGoal.color || 'blue',
        progress: updatedGoal.targetAmount > 0 ? Math.round(((updatedGoal.currentAmount || 0) / updatedGoal.targetAmount) * 100) : 0
      });
    } catch (error) {
      console.error("Error updating savings goal:", error);
      res.status(500).json({ message: "Failed to update savings goal" });
    }
  });



  // Add money to savings goal
  app.post("/api/savings-goals/:id/add-money", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const goalId = parseInt(req.params.id);
      const { amount } = req.body;
      
      if (isNaN(goalId)) {
        return res.status(400).json({ message: "Invalid goal ID" });
      }
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }
      
      // Get current goal to add money to existing amount
      const currentGoals = await storage.getSavingsGoals(user.id);
      const currentGoal = currentGoals.find(goal => goal.id === goalId);
      
      if (!currentGoal) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      
      const newAmount = (currentGoal.currentAmount || 0) + parseFloat(amount);
      
      // Update the goal with new amount
      const updatedGoal = await storage.updateSavingsGoal(goalId, {
        currentAmount: newAmount
      });
      
      if (!updatedGoal) {
        return res.status(404).json({ message: "Failed to update savings goal" });
      }
      
      // Track monthly and yearly savings
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      await storage.updateMonthlySavings(
        user.id,
        currentMonth,
        currentYear,
        parseFloat(amount)
      );
      
      res.json({
        id: updatedGoal.id,
        name: updatedGoal.name,
        currentAmount: updatedGoal.currentAmount || 0,
        targetAmount: updatedGoal.targetAmount || 0,
        deadline: updatedGoal.deadline ? new Date(updatedGoal.deadline).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }) : 'No deadline',
        color: updatedGoal.color || 'blue',
        progress: updatedGoal.targetAmount > 0 ? Math.round(((updatedGoal.currentAmount || 0) / updatedGoal.targetAmount) * 100) : 0
      });
    } catch (error) {
      console.error("Error adding money to savings goal:", error);
      res.status(500).json({ message: "Failed to add money to savings goal" });
    }
  });

  // Delete savings goal endpoint
  app.delete('/api/savings-goals/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const goalId = parseInt(req.params.id);
      
      if (!goalId || isNaN(goalId)) {
        return res.status(400).json({ error: 'Invalid goal ID' });
      }
      
      // Delete the goal for this user
      await storage.deleteSavingsGoal(goalId, user.id);
      
      res.json({ message: 'Savings goal deleted successfully' });
      
    } catch (error) {
      console.error('Error deleting savings goal:', error);
      res.status(500).json({ message: "Failed to delete savings goal" });
    }
  });

  // Get savings tracking data
  app.get('/api/savings-tracker', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const currentYear = new Date().getFullYear();
      
      // Get current month and year savings
      const currentMonthSavings = await storage.getCurrentMonthSavings(user.id);
      const currentYearSavings = await storage.getCurrentYearSavings(user.id);
      const yearlyTracker = await storage.getSavingsTracker(user.id, currentYear);
      
      // Calculate milestones
      const monthlyMilestones = [50, 100, 250, 500, 1000];
      const yearlyMilestones = [500, 1000, 2500, 5000, 10000];
      
      const currentMonthAmount = currentMonthSavings?.totalSaved || 0;
      const nextMonthlyMilestone = monthlyMilestones.find(m => m > currentMonthAmount) || null;
      const nextYearlyMilestone = yearlyMilestones.find(m => m > currentYearSavings) || null;
      
      res.json({
        monthlyStats: {
          current: Math.round(currentMonthAmount * 100) / 100,
          monthName: new Date().toLocaleDateString('en-US', { month: 'long' }),
          nextMilestone: nextMonthlyMilestone,
          progress: nextMonthlyMilestone ? Math.round((currentMonthAmount / nextMonthlyMilestone) * 100 * 100) / 100 : 100
        },
        yearlyStats: {
          current: Math.round(currentYearSavings * 100) / 100,
          year: currentYear,
          nextMilestone: nextYearlyMilestone,
          progress: nextYearlyMilestone ? Math.round((currentYearSavings / nextYearlyMilestone) * 100 * 100) / 100 : 100,
          monthlyBreakdown: yearlyTracker
        }
      });
    } catch (error) {
      console.error('Error getting savings tracker:', error);
      res.status(500).json({ message: "Failed to get savings tracker data" });
    }
  });

  // ============== DEBT GOALS ROUTES ==============

  // Get debt goals
  app.get("/api/debt-goals", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const debtGoals = await storage.getDebtGoals(user.id);
      
      // Transform data to match the expected interface for the component
      const formattedGoals = debtGoals.map((goal) => ({
        id: goal.id,
        name: goal.name,
        currentAmount: goal.currentAmount || 0,
        originalAmount: goal.originalAmount || 0,
        targetDate: goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }) : 'No target date',
        interestRate: goal.interestRate || 0,
        minimumPayment: goal.minimumPayment || 0,
        color: goal.color || 'red',
        progress: goal.originalAmount > 0 ? Math.round(((goal.originalAmount - goal.currentAmount) / goal.originalAmount) * 100) : 0
      }));
      
      res.json(formattedGoals);
    } catch (error) {
      console.error("Error fetching debt goals:", error);
      res.status(500).json({ message: "Failed to fetch debt goals" });
    }
  });

  // Create debt goal
  app.post("/api/debt-goals", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { name, originalAmount, currentAmount, targetDate, interestRate, minimumPayment, color } = req.body;
      
      // Validate required fields
      if (!name || !originalAmount) {
        return res.status(400).json({ message: "Name and original amount are required" });
      }
      
      const goalData = {
        userId: user.id,
        name,
        originalAmount: parseFloat(originalAmount),
        currentAmount: parseFloat(currentAmount || originalAmount), // Default to original amount if not provided
        targetDate: targetDate ? new Date(targetDate) : null,
        interestRate: parseFloat(interestRate || '0'),
        minimumPayment: parseFloat(minimumPayment || '0'),
        color: color || 'red'
      };
      
      const newGoal = await storage.createDebtGoal(goalData);
      
      res.status(201).json({
        id: newGoal.id,
        name: newGoal.name,
        currentAmount: newGoal.currentAmount || 0,
        originalAmount: newGoal.originalAmount || 0,
        targetDate: newGoal.targetDate ? new Date(newGoal.targetDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }) : 'No target date',
        interestRate: newGoal.interestRate || 0,
        minimumPayment: newGoal.minimumPayment || 0,
        color: newGoal.color || 'red',
        progress: newGoal.originalAmount > 0 ? Math.round(((newGoal.originalAmount - newGoal.currentAmount) / newGoal.originalAmount) * 100) : 0
      });
    } catch (error) {
      console.error("Error creating debt goal:", error);
      res.status(500).json({ message: "Failed to create debt goal" });
    }
  });

  // Update debt goal (subtract payment)
  app.put("/api/debt-goals/:id/payment", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const goalId = parseInt(req.params.id);
      const { amount } = req.body;
      
      if (!goalId || isNaN(goalId)) {
        return res.status(400).json({ message: "Invalid goal ID" });
      }
      
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
      }
      
      // Get current goal to calculate new amount
      const goals = await storage.getDebtGoals(user.id);
      const currentGoal = goals.find(g => g.id === goalId);
      
      if (!currentGoal) {
        return res.status(404).json({ message: "Debt goal not found" });
      }
      
      const newCurrentAmount = Math.max(0, currentGoal.currentAmount - parseFloat(amount));
      
      const updatedGoal = await storage.updateDebtGoal(goalId, {
        currentAmount: newCurrentAmount
      });
      
      if (!updatedGoal) {
        return res.status(404).json({ message: "Failed to update debt goal" });
      }
      
      res.json({
        id: updatedGoal.id,
        name: updatedGoal.name,
        currentAmount: updatedGoal.currentAmount || 0,
        originalAmount: updatedGoal.originalAmount || 0,
        targetDate: updatedGoal.targetDate ? new Date(updatedGoal.targetDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }) : 'No target date',
        interestRate: updatedGoal.interestRate || 0,
        minimumPayment: updatedGoal.minimumPayment || 0,
        color: updatedGoal.color || 'red',
        progress: updatedGoal.originalAmount > 0 ? Math.round(((updatedGoal.originalAmount - updatedGoal.currentAmount) / updatedGoal.originalAmount) * 100) : 0
      });
    } catch (error) {
      console.error("Error making debt payment:", error);
      res.status(500).json({ message: "Failed to make debt payment" });
    }
  });

  // Delete debt goal endpoint
  app.delete('/api/debt-goals/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const goalId = parseInt(req.params.id);
      
      if (!goalId || isNaN(goalId)) {
        return res.status(400).json({ error: 'Invalid goal ID' });
      }
      
      // Delete the goal for this user
      await storage.deleteDebtGoal(goalId, user.id);
      
      res.json({ message: 'Debt goal deleted successfully' });
      
    } catch (error) {
      console.error('Error deleting debt goal:', error);
      res.status(500).json({ message: "Failed to delete debt goal" });
    }
  });

  // AI Goal Creation endpoint
  app.post('/api/goals/ai-create', requireAccess, async (req, res) => {
    try {
      const user = req.user as User;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Get user's financial data for context
      const userData = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        accounts: await storage.getAccounts(user.id),
        goals: await storage.getSavingsGoals(user.id),
        recentTransactions: await storage.getTransactions(user.id, 50)
      };

      // Parse user message with AI
      const aiResponse = await parseGoalCreation(message, userData);

      if (aiResponse.shouldCreateGoal && aiResponse.goalDetails) {
        // Check if it's a debt goal or savings goal
        if (aiResponse.goalType === 'debt') {
          // Create debt goal
          const goalData = {
            userId: user.id,
            name: aiResponse.goalDetails.name,
            originalAmount: aiResponse.goalDetails.originalAmount || 0,
            currentAmount: aiResponse.goalDetails.currentAmount || aiResponse.goalDetails.originalAmount || 0,
            targetDate: aiResponse.goalDetails.targetDate ? new Date(aiResponse.goalDetails.targetDate) : null,
            interestRate: aiResponse.goalDetails.interestRate || 0,
            minimumPayment: aiResponse.goalDetails.minimumPayment || 0,
            color: aiResponse.goalDetails.color || 'red'
          };

          const newDebtGoal = await storage.createDebtGoal(goalData);

          res.json({
            response: aiResponse.response,
            goalCreated: true,
            goalType: 'debt',
            goal: newDebtGoal
          });
        } else {
          // Create savings goal (default)
          const { currentAmount, ...goalDataWithoutCurrent } = aiResponse.goalDetails;
          const goalData = {
            ...goalDataWithoutCurrent,
            userId: user.id,
            deadline: aiResponse.goalDetails.deadline ? new Date(aiResponse.goalDetails.deadline) : null
          };

          const newGoal = await storage.createSavingsGoal(goalData);
          
          res.json({
            response: aiResponse.response,
            goalCreated: true,
            goalType: 'savings',
            goal: newGoal
          });
        }
      } else if (aiResponse.needsMoreInfo) {
        res.json({
          response: aiResponse.followUpQuestion,
          goalCreated: false,
          needsMoreInfo: true
        });
      } else {
        res.json({
          response: aiResponse.response || "I can help you create savings goals! Tell me what you'd like to save for.",
          goalCreated: false
        });
      }

    } catch (error) {
      console.error('Error with AI goal creation:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        error: 'Failed to process goal creation request',
        response: "I'm having trouble processing that request right now. Please try again or create your goal manually using the 'Add New Goal' button."
      });
    }
  });

  // AI Goal Deletion endpoint
  app.post('/api/goals/ai-delete', requireAccess, async (req, res) => {
    try {
      const user = req.user as User;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Get user's current goals for context
      const [savingsGoals, debtGoals] = await Promise.all([
        storage.getSavingsGoals(user.id),
        storage.getDebtGoals(user.id)
      ]);

      // Parse deletion request with AI
      const aiResponse = await parseGoalDeletion(message, { savingsGoals, debtGoals });

      if (aiResponse.shouldDeleteGoal && aiResponse.goalToDelete) {
        const { goalType, goalId, goalName } = aiResponse.goalToDelete;
        
        try {
          if (goalType === 'debt') {
            await storage.deleteDebtGoal(goalId, user.id);
          } else {
            await storage.deleteSavingsGoal(goalId, user.id);
          }

          res.json({
            response: aiResponse.response || `I've successfully deleted your ${goalType} goal "${goalName}".`,
            goalDeleted: true,
            deletedGoal: {
              id: goalId,
              name: goalName,
              type: goalType
            }
          });
        } catch (deleteError) {
          console.error('Error deleting goal:', deleteError);
          res.json({
            response: "I'm sorry, I couldn't delete that goal. Please try using the delete button on the Goals page.",
            goalDeleted: false
          });
        }
      } else {
        res.json({
          response: aiResponse.response || "I couldn't identify which goal you want to delete. Could you be more specific about the goal name?",
          goalDeleted: false
        });
      }

    } catch (error) {
      console.error('Error with AI goal deletion:', error);
      res.status(500).json({ error: 'Failed to delete goal with AI' });
    }
  });

  // AI Progress Update endpoint
  app.post('/api/goals/ai-progress', requireAccess, async (req, res) => {
    try {
      const user = req.user as User;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Get user's goals and financial data
      const userGoals = await storage.getSavingsGoals(user.id);
      const userData = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        goals: userGoals
      };

      // Parse progress update with AI
      const aiResponse = await parseProgressUpdate(message, userGoals, userData);

      if (aiResponse.shouldUpdateProgress && aiResponse.goalId && aiResponse.amount) {
        // Find the goal to update
        const goal = userGoals.find(g => g.id === aiResponse.goalId);
        
        if (goal) {
          const newCurrentAmount = goal.currentAmount + aiResponse.amount;
          // Update the goal's current amount directly in database
          await storage.updateSavingsGoal(aiResponse.goalId, { 
            name: goal.name,
            targetAmount: goal.targetAmount,
            deadline: goal.deadline,
            color: goal.color
          });
          
          // Update currentAmount separately using direct database update
          const { savingsGoals } = await import('@shared/schema');
          const { eq } = await import('drizzle-orm');
          const { db } = await import('./db');
          
          await db.update(savingsGoals)
            .set({ currentAmount: newCurrentAmount })
            .where(eq(savingsGoals.id, aiResponse.goalId));
          
          res.json({
            response: aiResponse.response,
            progressUpdated: true,
            goalId: aiResponse.goalId,
            amountAdded: aiResponse.amount,
            newTotal: newCurrentAmount
          });
        } else {
          res.json({
            response: "I couldn't find that goal. Please check your goal list and try again.",
            progressUpdated: false
          });
        }
      } else if (aiResponse.needsMoreInfo) {
        res.json({
          response: aiResponse.followUpQuestion,
          progressUpdated: false,
          needsMoreInfo: true
        });
      } else {
        res.json({
          response: aiResponse.response || "I can help you track progress on your savings goals! Tell me how much you've saved recently.",
          progressUpdated: false
        });
      }

    } catch (error) {
      console.error('Error with AI progress update:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        error: 'Failed to process progress update request',
        response: "I couldn't update your progress right now. Please try again or use the manual 'Add Money' option on your goal cards."
      });
    }
  });

  // Clean up duplicate transactions endpoint
  app.post('/api/cleanup-duplicates', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Find and remove duplicate transactions for this user
      const duplicateQuery = `
        DELETE FROM transactions 
        WHERE id NOT IN (
          SELECT DISTINCT ON (user_id, description, amount, date) id
          FROM transactions 
          WHERE user_id = $1
          ORDER BY user_id, description, amount, date, id ASC
        ) AND user_id = $1
      `;
      
      const result = await pool.query(duplicateQuery, [user.id]);
      
      console.log(`Cleaned up duplicate transactions for user ${user.id}`);
      
      res.json({
        message: 'Duplicate transactions cleaned up successfully',
        removedCount: result.rowCount || 0
      });
      
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      res.status(500).json({ error: 'Failed to clean up duplicates' });
    }
  });

  // Diagnostic endpoint for troubleshooting bank sync issues
  app.post('/api/plaid/diagnose-account', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { accountId } = req.body;
      
      if (!accountId) {
        return res.status(400).json({ message: 'Account ID is required' });
      }
      
      const account = await storage.getAccount(accountId);
      if (!account || account.userId !== user.id) {
        return res.status(404).json({ message: 'Account not found' });
      }
      
      const diagnostics: any = {
        accountInfo: {
          name: account.accountName,
          institution: account.institutionName,
          type: account.accountType,
          lastUpdated: account.updatedAt,
          hasAccessToken: !!account.plaidAccessToken
        },
        recommendations: [],
        connectionStatus: 'Testing...',
        transactionAccess: 'Testing...'
      };
      
      // Test Plaid connection
      try {
        if (account.plaidAccessToken) {
          const plaidData = await getAccounts(account.plaidAccessToken);
          const plaidAccount = plaidData.accounts.find(acc => acc.account_id === account.plaidAccountId);
          
          if (plaidAccount) {
            diagnostics.connectionStatus = 'Connected';
            diagnostics.availableBalance = plaidAccount.balances.current;
            diagnostics.lastPlaidUpdate = new Date().toISOString();
            
            // Test transaction access
            try {
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(today.getDate() - 1);
              
              const transactionsResponse = await getTransactions(
                account.plaidAccessToken,
                yesterday.toISOString().split('T')[0],
                today.toISOString().split('T')[0]
              );
              
              diagnostics.transactionAccess = 'Available';
              diagnostics.recentTransactionCount = transactionsResponse.transactions?.length || 0;
              
            } catch (transactionError: any) {
              diagnostics.transactionAccess = 'Limited';
              diagnostics.transactionError = transactionError.response?.data?.error_code || transactionError.message;
              
              if (transactionError.response?.data?.error_code === 'TRANSACTIONS_NOT_READY') {
                diagnostics.recommendations.push(
                  'Transactions are still processing. This is common with Navy Federal and can take 24-48 hours.'
                );
              }
            }
            
            // Navy Federal specific recommendations
            if (account.institutionName?.toLowerCase().includes('navy federal')) {
              diagnostics.recommendations.push(
                'Navy Federal Credit Union has known delays in transaction posting (24-48 hours is normal).',
                'Navy Federal processes most updates in the evening - try syncing after 6 PM EST.',
                'If no updates for 2+ days, your Navy Federal login credentials may need refreshing.',
                'Consider disconnecting and reconnecting your Navy Federal account if issues persist.'
              );
              
              // Check if account hasn't been updated recently
              const lastUpdate = account.updatedAt ? new Date(account.updatedAt) : null;
              const daysSinceUpdate = lastUpdate ? Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)) : null;
              
              if (daysSinceUpdate && daysSinceUpdate > 2) {
                diagnostics.recommendations.unshift(
                  `⚠️ Account hasn't updated in ${daysSinceUpdate} days - this suggests a connection issue with Navy Federal.`
                );
              }
            }
            
          } else {
            diagnostics.connectionStatus = 'Account Not Found';
            diagnostics.recommendations.push('Account may need to be reconnected through Plaid Link');
          }
        } else {
          diagnostics.connectionStatus = 'No Access Token';
          diagnostics.recommendations.push('Account needs to be reconnected');
        }
        
      } catch (connectionError: any) {
        diagnostics.connectionStatus = 'Error';
        diagnostics.connectionError = connectionError.response?.data?.error_code || connectionError.message;
        
        if (connectionError.response?.data?.error_code === 'ITEM_LOGIN_REQUIRED') {
          diagnostics.recommendations.push(
            'Bank requires re-authentication. Please disconnect and reconnect your account.',
            'This often happens when you change your online banking password.'
          );
        }
      }
      
      console.log(`Diagnostics for ${account.institutionName} account:`, diagnostics);
      res.json(diagnostics);
      
    } catch (error) {
      console.error('Error in account diagnostics:', error);
      res.status(500).json({ error: 'Failed to diagnose account' });
    }
  });

  // Admin route to monitor Plaid API usage and rate limiting
  app.get('/api/admin/plaid-usage', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Only allow admin users to access this endpoint
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { plaidRateLimiter } = await import('./rateLimiter');
      const stats = plaidRateLimiter.getStats();
      
      res.json({
        message: 'Plaid API usage statistics',
        ...stats,
        rateLimitInfo: {
          refreshCooldownMinutes: 720,
          automaticRefreshDisabled: true,
          lastDisabled: '2025-08-11 18:03:46 PM'
        }
      });
      
    } catch (error) {
      console.error('Error fetching Plaid usage stats:', error);
      res.status(500).json({ error: 'Failed to fetch usage statistics' });
    }
  });

  // Credit Assessment API Routes
  app.get('/api/credit/assessment', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const assessment = await storage.getCreditAssessment(user.id);
      res.json(assessment);
    } catch (error) {
      console.error('Error fetching credit assessment:', error);
      res.status(500).json({ error: 'Failed to fetch credit assessment' });
    }
  });

  app.post('/api/credit/assessment', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { generateCreditImprovementPlan } = await import('./creditAssessment');
      
      // Validate required fields
      const requiredFields = [
        'currentScore', 'goalScore', 'paymentHistory', 'creditUtilization',
        'creditHistoryLength', 'creditMix', 'newCreditInquiries',
        'totalCreditLimit', 'totalCreditBalance', 'monthlyIncome'
      ];
      
      for (const field of requiredFields) {
        if (req.body[field] === undefined || req.body[field] === null) {
          return res.status(400).json({ error: `${field} is required` });
        }
      }
      
      // Get user's financial data for comprehensive analysis
      const accounts = await storage.getAccounts(user.id);
      const budgets = await storage.getBudgets(user.id);
      const transactions = await storage.getTransactions(user.id, 100);
      
      // Create assessment data
      const assessmentData = {
        userId: user.id,
        currentScore: parseInt(req.body.currentScore),
        goalScore: parseInt(req.body.goalScore),
        paymentHistory: req.body.paymentHistory,
        creditUtilization: parseFloat(req.body.creditUtilization),
        creditHistoryLength: parseInt(req.body.creditHistoryLength),
        creditMix: req.body.creditMix,
        newCreditInquiries: parseInt(req.body.newCreditInquiries),
        totalCreditLimit: parseFloat(req.body.totalCreditLimit),
        totalCreditBalance: parseFloat(req.body.totalCreditBalance),
        monthlyIncome: parseFloat(req.body.monthlyIncome),
        hasCollections: req.body.hasCollections || false,
        hasBankruptcy: req.body.hasBankruptcy || false,
        hasForeclosure: req.body.hasForeclosure || false
      };
      
      // Create the assessment
      const assessment = await storage.createCreditAssessment(assessmentData);
      
      // Generate AI improvement plan
      const improvementPlan = await generateCreditImprovementPlan(
        assessment,
        accounts,
        budgets,
        transactions
      );
      
      // Update assessment with the improvement plan
      const updatedAssessment = await storage.updateCreditAssessment(assessment.id, {
        improvementPlan
      });
      
      res.json({
        assessment: updatedAssessment,
        improvementPlan
      });
      
    } catch (error) {
      console.error('Error creating credit assessment:', error);
      res.status(500).json({ 
        error: 'Failed to create credit assessment',
        message: error.message 
      });
    }
  });

  app.put('/api/credit/assessment/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const assessmentId = parseInt(req.params.id);
      
      // Check if assessment belongs to user
      const existing = await storage.getCreditAssessment(user.id);
      if (!existing || existing.id !== assessmentId) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      
      const updatedAssessment = await storage.updateCreditAssessment(assessmentId, req.body);
      res.json(updatedAssessment);
      
    } catch (error) {
      console.error('Error updating credit assessment:', error);
      res.status(500).json({ error: 'Failed to update credit assessment' });
    }
  });

  // Credit score factors and analysis
  app.get('/api/credit/factors/:assessmentId', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const assessmentId = parseInt(req.params.assessmentId);
      const { calculateCreditScoreFactors } = await import('./creditAssessment');
      
      // Check if assessment belongs to user
      const assessment = await storage.getCreditAssessment(user.id);
      if (!assessment || assessment.id !== assessmentId) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      
      const factors = calculateCreditScoreFactors(assessment);
      res.json(factors);
      
    } catch (error) {
      console.error('Error calculating credit factors:', error);
      res.status(500).json({ error: 'Failed to calculate credit factors' });
    }
  });

  // RevenueCat webhook endpoint for Apple IAP events
  app.post('/api/webhooks/revenuecat', async (req, res) => {
    try {
      const event = req.body;
      console.log('📱 RevenueCat webhook received:', event.type);

      // Verify webhook authenticity (RevenueCat sends Authorization header)
      const authHeader = req.headers.authorization;
      const expectedToken = process.env.REVENUECAT_WEBHOOK_SECRET;
      
      if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
        console.warn('⚠️ Invalid RevenueCat webhook authorization');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Extract event data
      const eventType = event.type;
      const appUserId = event.app_user_id; // This should be our user.id
      const productId = event.product_id;
      const expiresDate = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;
      const platform = event.store || 'ios'; // 'app_store' or 'play_store'

      // Find user by RevenueCat user ID or email
      let user = null;
      try {
        const userId = parseInt(appUserId);
        if (!isNaN(userId)) {
          user = await storage.getUser(userId);
        }
      } catch (error) {
        console.error('Error finding user:', error);
      }

      if (!user) {
        console.warn(`⚠️ User not found for RevenueCat ID: ${appUserId}`);
        return res.status(200).json({ received: true });
      }

      // Handle different event types
      switch (eventType) {
        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
        case 'NON_RENEWING_PURCHASE':
          console.log(`✅ [User ${user.id}] ${eventType}: Activating subscription`);
          await storage.updateUser(user.id, {
            revenuecatUserId: appUserId,
            revenuecatSubscriptionId: event.id,
            revenuecatProductId: productId,
            revenuecatExpiresAt: expiresDate,
            revenuecatPlatform: platform,
            isPremium: true,
            subscriptionStatus: 'active'
          });
          break;

        case 'CANCELLATION':
          console.log(`⚠️ [User ${user.id}] Subscription cancelled - maintaining access until expiration`);
          await storage.updateUser(user.id, {
            revenuecatExpiresAt: expiresDate,
            subscriptionStatus: 'canceled'
          });
          break;

        case 'EXPIRATION':
          console.log(`❌ [User ${user.id}] Subscription expired`);
          await storage.updateUser(user.id, {
            isPremium: false,
            subscriptionStatus: 'expired',
            revenuecatExpiresAt: null
          });
          break;

        case 'BILLING_ISSUE':
          console.log(`⚠️ [User ${user.id}] Billing issue detected`);
          await storage.updateUser(user.id, {
            subscriptionStatus: 'past_due'
          });
          break;

        default:
          console.log(`ℹ️ [User ${user.id}] Unhandled event type: ${eventType}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error processing RevenueCat webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
