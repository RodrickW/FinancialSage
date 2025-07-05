import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertAccountSchema, insertTransactionSchema } from "@shared/schema";
import { User } from "@shared/schema";
import { generateFinancialInsights, getFinancialCoaching, generateBudgetRecommendations, analyzeCreditScore, createPersonalizedBudget, generateFinancialHealthReport } from "./openai";
import OpenAI from "openai";
import { createLinkToken, exchangePublicToken, getAccounts, getTransactions, formatPlaidAccountData, formatPlaidTransactionData } from "./plaid";
import { servePlaidSDK } from "./plaid-proxy";
import { fetchCreditScore, fetchCreditHistory, storeCreditScore, generateMockCreditScore, generateMockCreditHistory } from "./credit";
import { registerSubscriptionRoutes } from "./routes-subscription";
import { generatePasswordResetToken, verifyResetToken, resetPassword } from "./passwordReset";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import MemoryStore from "memorystore";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session
  const MemoryStoreSession = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'mindmymoneysecret',
    resave: false,
    saveUninitialized: false, // Set to false to avoid empty sessions
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // Prune expired entries every 24h
    }),
    cookie: {
      secure: false, // False for development
      httpOnly: true, // Secure cookies
      sameSite: 'lax', // Better browser compatibility
      maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    },
    name: 'connect.sid' // Explicit session name
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

  // Enhanced auth middleware with security logging
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return validateSession(req, res, next);
    }
    
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', undefined, {
      endpoint: req.path,
      method: req.method,
      userAgent: req.headers['user-agent']
    });
    
    res.status(401).json({ message: 'Unauthorized' });
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
  
  // Register the subscription routes
  registerSubscriptionRoutes(app, requireAuth);

  // Plaid SDK proxy endpoint (before security middleware)
  app.get('/api/plaid-sdk.js', servePlaidSDK);
  
  // Plaid webhook endpoint (before security middleware)
  app.post('/api/plaid/webhook', (req, res) => {
    console.log('Plaid webhook received:', req.body);
    res.status(200).send('OK');
  });

  // Apply security middleware to all routes
  app.use('/api/', validateInput);
  app.use('/api/', csrfProtection);

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
      
      // Create complete user object with defaults
      const userWithHashedPassword = {
        username: result.data.username,
        password: hashedPassword,
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        email: result.data.email,
        // Set default values for subscription fields
        isPremium: false,
        premiumTier: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: 'inactive',
        trialEndsAt: null,
        hasStartedTrial: false,
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
      
      const token = await generatePasswordResetToken(email);
      
      if (!token) {
        // Don't reveal if the user exists for security reasons
        return res.status(200).json({ 
          message: 'If an account with that email exists, a password reset link has been sent' 
        });
      }
      
      // In a real app, we would send an email with the reset link
      // For this demo, we're just logging it to the console
      
      return res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent',
        // For demo purposes only, we'll return the token
        token: token 
      });
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

  // User profile
  app.get('/api/users/profile', requireAuth, (req, res) => {
    res.json(req.user);
  });

  // Financial overview
  app.get('/api/financial-overview', requireAuth, async (req, res) => {
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
      
      // Calculate monthly spending (current month)
      const monthlySpending = userTransactions
        .filter(t => t.amount < 0 && new Date(t.date).getMonth() === now.getMonth())
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Calculate weekly spending (last 7 days)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklySpending = userTransactions
        .filter(t => t.amount < 0 && new Date(t.date) >= weekAgo)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Calculate daily spending (today)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dailySpending = userTransactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.amount < 0 && 
                 transactionDate.getFullYear() === today.getFullYear() &&
                 transactionDate.getMonth() === today.getMonth() &&
                 transactionDate.getDate() === today.getDate();
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Previous month spending
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthSpending = userTransactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.amount < 0 && 
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
        totalBalance,
        previousMonthBalance,
        monthlySpending,
        previousMonthSpending,
        weeklySpending,
        dailySpending,
        creditScore,
        savingsProgress: {
          current: mainSavingsGoal.currentAmount,
          target: mainSavingsGoal.targetAmount,
          name: mainSavingsGoal.name
        }
      };
      
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
  
  // Plaid routes
  app.post('/api/plaid/create-link-token', requireAuth, async (req, res) => {
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
  
  app.post('/api/plaid/exchange-token', requireAuth, async (req, res) => {
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
  
  // Accounts routes
  app.get('/api/accounts', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const accounts = await storage.getAccounts(user.id);
      res.json(accounts);
    } catch (error) {
      console.error('Error getting accounts:', error);
      res.status(500).json({ error: 'Failed to get accounts' });
    }
  });
  
  app.get('/api/accounts/:id', requireAuth, async (req, res) => {
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

  // Delete/disconnect account
  app.delete('/api/accounts/:id', requireAuth, async (req, res) => {
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
      
      // Note: Related transactions are automatically cleaned up by foreign key constraints
      // Budget data and insights will be recalculated on next access
      
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
  
  // Sync transactions from Plaid for connected accounts
  app.post('/api/plaid/sync-transactions', requireAuth, async (req, res) => {
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
        // Check if transaction already exists to avoid duplicates
        const existingTransactions = await storage.getAccountTransactions(accountId, 1000);
        const exists = existingTransactions.some(existing => 
          existing.description === plaidTransaction.name && 
          existing.amount === plaidTransaction.amount &&
          new Date(existing.date).getTime() === new Date(plaidTransaction.date).getTime()
        );
        
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

  // Refresh account balances from Plaid
  app.post('/api/plaid/refresh-balances', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Get all connected accounts for the user
      const accounts = await storage.getAccounts(user.id);
      const plaidAccounts = accounts.filter(account => account.plaidAccessToken);
      
      if (plaidAccounts.length === 0) {
        return res.json({ message: 'No Plaid-connected accounts to refresh' });
      }
      
      let updatedAccountsCount = 0;
      
      for (const account of plaidAccounts) {
        try {
          // Get fresh account data from Plaid
          const plaidData = await getAccounts(account.plaidAccessToken!);
          
          // Find the matching account in Plaid response
          const plaidAccount = plaidData.accounts.find(
            acc => acc.account_id === account.plaidAccountId
          );
          
          if (plaidAccount && plaidAccount.balances.current !== null) {
            // Update the account balance
            await storage.updateAccount(account.id, {
              balance: plaidAccount.balances.current
            });
            updatedAccountsCount++;
            
            console.log(`Updated balance for ${account.accountName}: $${plaidAccount.balances.current}`);
          }
          
        } catch (accountError) {
          console.error(`Error refreshing account ${account.id}:`, accountError);
          // Continue with other accounts even if one fails
        }
      }
      
      res.json({ 
        message: 'Balance refresh completed',
        updatedAccounts: updatedAccountsCount,
        totalAccounts: plaidAccounts.length
      });
      
    } catch (error) {
      console.error('Error refreshing balances:', error);
      res.status(500).json({ error: 'Failed to refresh account balances' });
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
          // 1. Refresh account balance
          const plaidData = await getAccounts(account.plaidAccessToken!);
          const plaidAccount = plaidData.accounts.find(
            acc => acc.account_id === account.plaidAccountId
          );
          
          if (plaidAccount && plaidAccount.balances.current !== null) {
            await storage.updateAccount(account.id, {
              balance: plaidAccount.balances.current
            });
            updatedBalances++;
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
          
          for (const plaidTransaction of accountTransactions) {
            const exists = existingTransactions.some(existing => 
              existing.description === plaidTransaction.name && 
              Math.abs(existing.amount - plaidTransaction.amount) < 0.01 &&
              new Date(existing.date).getTime() === new Date(plaidTransaction.date).getTime()
            );
            
            if (!exists) {
              const transactionData = formatPlaidTransactionData(plaidTransaction, user.id, account.id);
              await storage.createTransaction(transactionData);
              totalNewTransactions++;
            }
          }
          
        } catch (accountError) {
          console.error(`Error syncing account ${account.accountName}:`, accountError);
        }
      }
      
      console.log(`Full sync completed: ${updatedBalances} balances updated, ${totalNewTransactions} new transactions`);
      
      res.json({
        message: 'Full sync completed successfully',
        updatedBalances,
        newTransactions: totalNewTransactions,
        syncedAccounts: plaidAccounts.length
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

  // AI routes
  app.get('/api/ai/insights', requireAuth, async (req, res) => {
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



  app.get('/api/ai/budget-recommendations', requireAuth, async (req, res) => {
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
  app.get('/api/spending-trends', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const transactions = await storage.getTransactions(user.id);
      
      if (transactions.length === 0) {
        return res.json({
          spendingData: [],
          categories: []
        });
      }
      
      // Group transactions by month for the last 6 months
      const now = new Date();
      const monthlyData: Record<string, { income: number; expenses: number; month: string }> = {};
      const categoryTotals: Record<string, number> = {};
      
      // Generate last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        monthlyData[monthKey] = {
          income: 0,
          expenses: 0,
          month: monthLabel
        };
      }
      
      // Process transactions
      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const monthKey = transactionDate.toISOString().slice(0, 7);
        
        if (monthlyData[monthKey]) {
          if (transaction.amount > 0) {
            // Income
            monthlyData[monthKey].income += transaction.amount;
          } else {
            // Expenses
            monthlyData[monthKey].expenses += Math.abs(transaction.amount);
            
            // Track category spending
            const category = transaction.category || 'Other';
            categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(transaction.amount);
          }
        }
      });
      
      // Convert to array format for chart
      const spendingData = Object.values(monthlyData);
      
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
          amount,
          color: categoryColors[index % categoryColors.length],
          icon: categoryIcons[index % categoryIcons.length]
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8); // Top 8 categories
      
      res.json({
        spendingData,
        categories
      });
      
    } catch (error) {
      console.error('Error generating spending trends:', error);
      res.status(500).json({ error: 'Failed to generate spending trends' });
    }
  });
  
  // Credit score analysis and improvement recommendations
  app.get('/api/ai/credit-score-analysis', requireAuth, async (req, res) => {
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
  app.get('/api/ai/financial-health', requireAuth, async (req, res) => {
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
  
  // Money Mind Interview endpoint - Save user responses
  app.post('/api/ai/interview', requireAuth, async (req, res) => {
    try {
      const { responses, completedAt } = req.body;
      const user = req.user as User;
      
      if (!responses) {
        return res.status(400).json({ message: 'Interview responses are required' });
      }
      
      // Get user's financial data to create personalized plan
      const accounts = await storage.getAccounts(user.id);
      const transactions = await storage.getTransactions(user.id);
      
      // Generate AI-powered personalized budget plan based on interview responses
      const { createPersonalizedBudget } = await import('./openai');
      const personalizedPlan = await createPersonalizedBudget({
        userResponses: responses,
        accounts,
        transactions,
        userId: user.id,
        userName: user.firstName || user.username
      });
      
      // Store the interview completion as an insight
      const interviewInsight = await storage.createInsight({
        userId: user.id,
        type: 'interview',
        title: 'Financial Goals Interview Completed',
        description: `Financial goals interview completed on ${new Date().toLocaleDateString()}. Your personalized financial plan has been generated and is ready to view.`,
        severity: 'info'
      });
      
      res.json({ 
        success: true, 
        message: 'Interview responses saved successfully',
        interviewId: interviewInsight.id,
        personalizedPlan 
      });
    } catch (error) {
      console.error('Error saving interview responses:', error);
      res.status(500).json({ message: 'Failed to save interview responses' });
    }
  });

  // Get latest interview data and personalized plan
  app.get('/api/ai/interview/latest', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Get all insights of type 'interview' for this user, ordered by creation date
      const insights = await storage.getInsights(user.id);
      const interviewInsights = insights.filter(insight => insight.type === 'interview');
      
      if (interviewInsights.length === 0) {
        return res.json({ hasInterview: false });
      }
      
      // Return basic interview completion info
      const latestInterview = interviewInsights.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      res.json({
        hasInterview: true,
        interview: {
          id: latestInterview.id,
          completedAt: latestInterview.createdAt,
          title: latestInterview.title,
          description: latestInterview.description
        }
      });
    } catch (error) {
      console.error('Error fetching interview data:', error);
      res.status(500).json({ message: 'Failed to fetch interview data' });
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

      // Use AI to categorize transactions
      const prompt = `
Analyze these financial transactions and categorize them into the following comprehensive budget categories based on Dave Ramsey's EveryDollar system. 

Available categories:
${Object.keys(budgetCategories).join(', ')}

Transactions to analyze:
${transactions.map(t => `${t.description || t.merchant_name || 'Unknown'}: $${Math.abs(t.amount)}`).slice(0, 20).join('\n')}

For each transaction, determine the most appropriate category based on the description/merchant. Return a JSON object with this structure:
{
  "categorizedSpending": [
    {"categoryId": "groceries", "amount": 150.50},
    {"categoryId": "gas", "amount": 45.20}
  ]
}

Group similar transactions together and sum the amounts for each category. Only include categories that have actual spending.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a financial analyst expert at categorizing transactions into budget categories. Respond only with valid JSON."
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

  // Start free trial endpoint
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
      
      // Create Stripe checkout session for trial
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Mind My Money Standard`,
              },
              unit_amount: 999, // $9.99 for Standard plan
              recurring: {
                interval: 'month',
              },
            },
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

  // Trial cancellation endpoint
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
      const formattedGoals = savingsGoals.map((goal, index) => ({
        id: goal.id,
        name: goal.name,
        currentAmount: goal.currentAmount || 0,
        targetAmount: goal.targetAmount || 0,
        progress: goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0,
        color: ['blue', 'green', 'purple'][index % 3] // Assign colors in rotation
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
      const { name, targetAmount, currentAmount, deadline } = req.body;
      
      // Validate required fields
      if (!name || !targetAmount) {
        return res.status(400).json({ message: "Name and target amount are required" });
      }
      
      const goalData = {
        userId: user.id,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || '0'),
        deadline: deadline ? new Date(deadline) : null
      };
      
      const newGoal = await storage.createSavingsGoal(goalData);
      
      res.status(201).json({
        id: newGoal.id,
        name: newGoal.name,
        currentAmount: newGoal.currentAmount || 0,
        targetAmount: newGoal.targetAmount || 0,
        deadline: newGoal.deadline,
        progress: newGoal.targetAmount > 0 ? Math.round(((newGoal.currentAmount || 0) / newGoal.targetAmount) * 100) : 0,
        color: 'blue' // Default color
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
      const { name, targetAmount, currentAmount, deadline } = req.body;
      
      // Validate required fields
      if (!name || !targetAmount) {
        return res.status(400).json({ message: "Name and target amount are required" });
      }
      
      const updateData = {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || '0'),
        deadline: deadline ? new Date(deadline) : null
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
        deadline: updatedGoal.deadline,
        progress: updatedGoal.targetAmount > 0 ? Math.round(((updatedGoal.currentAmount || 0) / updatedGoal.targetAmount) * 100) : 0,
        color: 'blue' // Default color
      });
    } catch (error) {
      console.error("Error updating savings goal:", error);
      res.status(500).json({ message: "Failed to update savings goal" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
