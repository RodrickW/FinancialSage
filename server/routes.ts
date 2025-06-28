import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertAccountSchema, insertTransactionSchema } from "@shared/schema";
import { User } from "@shared/schema";
import { generateFinancialInsights, getFinancialCoaching, generateBudgetRecommendations, analyzeCreditScore } from "./openai";
import { createLinkToken, exchangePublicToken, getAccounts, getTransactions, formatPlaidAccountData, formatPlaidTransactionData } from "./plaid";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session
  const MemoryStoreSession = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'mindmymoneysecret',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // Prune expired entries every 24h
    }),
    cookie: {
      secure: false, // Allow cookies over HTTP for Replit deployment
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    }
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

  // Apply security middleware to all routes
  app.use('/api/', validateInput);
  app.use('/api/', csrfProtection);

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const sanitizedBody = sanitizeInput(req.body);
      const result = insertUserSchema.safeParse(sanitizedBody);
      
      if (!result.success) {
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
      
      const userWithHashedPassword = {
        ...result.data,
        password: hashedPassword
      };
      
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
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
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
      const linkToken = await createLinkToken(user.id, user.id.toString());
      res.json(linkToken);
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
        const accountData = formatPlaidAccountData(plaidAccount, user.id, institutionName);
        const newAccount = await storage.createAccount(accountData);
        accountsCreated.push(newAccount);
        console.log('Created account:', newAccount.accountName, 'Balance:', newAccount.balance);
      }
      
      // Get and save transactions for the last 30 days
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      console.log('Fetching transactions from', startDate, 'to', endDate);
      
      const transactionsResponse = await getTransactions(accessToken, startDate, endDate);
      console.log('Retrieved transactions:', transactionsResponse.transactions.length);
      
      let transactionsCreated = 0;
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

  app.post('/api/ai/coaching', requireAuth, async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: 'Question is required' });
      }
      
      // In a real app, you would fetch user's financial data and pass it to the AI
      const userData = {
        spending: [
          { category: 'Food & Dining', amount: 820.45 },
          { category: 'Housing', amount: 1450.00 },
          { category: 'Transportation', amount: 385.20 },
          { category: 'Shopping', amount: 605.85 }
        ],
        income: 5000,
        savings: 5420,
        savingsGoal: 10000,
        creditScore: 752
      };
      
      const advice = await getFinancialCoaching(question, userData);
      res.json({ advice });
    } catch (error) {
      console.error('Error getting financial coaching:', error);
      res.status(500).json({ message: 'Failed to get financial coaching' });
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
          limit: b.limit,
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
      
      // For now, we'll store the interview in the insights table
      // In a real application, you might want a dedicated interview_responses table
      const interviewInsight = await storage.createInsight({
        userId: user.id,
        type: 'interview',
        title: 'Financial Goals Interview',
        description: `Interview completed on ${new Date().toLocaleDateString()}`,
        content: JSON.stringify({
          responses,
          completedAt,
          summary: {
            goals: responses['financial-goals'] || [],
            situation: responses['current-situation'] || '',
            income: responses['monthly-income'] || 0,
            challenge: responses['biggest-challenge'] || '',
            riskTolerance: responses['risk-tolerance'] || ''
          }
        }),
        severity: 'info'
      });
      
      res.json({ 
        success: true, 
        message: 'Interview responses saved successfully',
        interviewId: interviewInsight.id 
      });
    } catch (error) {
      console.error('Error saving interview responses:', error);
      res.status(500).json({ message: 'Failed to save interview responses' });
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
          institution: account.institutionName
        })),
        totalBalance,
        totalExpenses,
        savingsGoals: savingsGoals.map(g => ({
          name: g.name,
          target: g.targetAmount,
          current: g.currentAmount
        })),
        spendingByCategory: categorySpending,
        creditScore: creditScore ? creditScore.score : null
      };
      
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

  app.get("/api/feedback", requireAuth, async (req, res) => {
    try {
      // For now, allow all authenticated users to view feedback
      // You can add admin checks later if needed
      const allFeedback = await storage.getFeedback();
      res.json(allFeedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
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
  app.post('/api/cancel-subscription', requireAuth, async (req, res) => {
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
