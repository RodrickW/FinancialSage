import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertAccountSchema, insertTransactionSchema } from "@shared/schema";
import { generateFinancialInsights, getFinancialCoaching, generateBudgetRecommendations } from "./openai";
import { createLinkToken, exchangePublicToken, getAccounts, getTransactions, formatPlaidAccountData, formatPlaidTransactionData } from "./plaid";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import MemoryStore from "memorystore";

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
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    }
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport local strategy
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: 'Incorrect username' });
        }
        
        // In a real app, you would hash and compare passwords
        if (user.password !== password) {
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

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  };

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid input data', errors: result.error });
      }
      
      const existingUser = await storage.getUserByUsername(result.data.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      const user = await storage.createUser(result.data);
      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || 'Authentication failed' });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ message: 'Authentication successful', user: { id: user.id, username: user.username } });
      });
    })(req, res, next);
  });

  app.get('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error during logout' });
      }
      res.json({ message: 'Logged out successfully' });
    });
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
      
      // Get monthly spending
      const userTransactions = await storage.getTransactions(user.id);
      const monthlySpending = userTransactions
        .filter(t => t.amount < 0 && new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Previous month spending (mock for now)
      const previousMonthSpending = monthlySpending * 0.9; // Mock 10% increase
      
      // Get credit score
      const creditScoreData = await storage.getCreditScore(user.id);
      const creditScore = creditScoreData?.score || 750; // Default to 750 if not available
      
      // Get savings goal
      const savingsGoals = await storage.getSavingsGoals(user.id);
      const mainSavingsGoal = savingsGoals[0] || {
        name: 'Vacation Fund',
        targetAmount: 10000,
        currentAmount: 5420
      };
      
      const financialOverview = {
        totalBalance,
        previousMonthBalance,
        monthlySpending,
        previousMonthSpending,
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
      // Fallback to mock data if there's an error
      res.json(mockFinancialData);
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
      
      const exchangeResponse = await exchangePublicToken(publicToken);
      const accessToken = exchangeResponse.access_token;
      const itemId = exchangeResponse.item_id;
      
      // Get accounts from Plaid
      const accountsResponse = await getAccounts(accessToken);
      
      // Save accounts to database
      const institutionName = metadata.institution?.name || 'Financial Institution';
      const accountsCreated = [];
      
      for (const plaidAccount of accountsResponse.accounts) {
        const accountData = formatPlaidAccountData(plaidAccount, user.id, institutionName);
        const newAccount = await storage.createAccount(accountData);
        accountsCreated.push(newAccount);
        
        // Optional: Store access token securely in your database
        // In a real app, you would store the access token and item ID in your database
        // associated with the user's ID and account ID
      }
      
      // Get and save transactions for the last 30 days
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      const transactionsResponse = await getTransactions(accessToken, startDate, endDate);
      
      for (const account of accountsCreated) {
        const accountTransactions = transactionsResponse.transactions.filter(
          t => t.account_id === account.id
        );
        
        for (const plaidTransaction of accountTransactions) {
          const transactionData = formatPlaidTransactionData(plaidTransaction, user.id, account.id);
          await storage.createTransaction(transactionData);
        }
      }
      
      res.json({ success: true, accounts: accountsCreated });
    } catch (error) {
      console.error('Error exchanging token:', error);
      res.status(500).json({ error: 'Failed to exchange token' });
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
      // In a real app, you would fetch user's spending data and pass it to the AI
      const spendingData = {
        income: 5000,
        categories: [
          { name: 'Food & Dining', spending: 820.45 },
          { name: 'Housing', spending: 1450.00 },
          { name: 'Transportation', spending: 385.20 },
          { name: 'Shopping', spending: 605.85 },
          { name: 'Entertainment', spending: 250.00 },
          { name: 'Utilities', spending: 320.00 }
        ]
      };
      
      const recommendations = await generateBudgetRecommendations(spendingData);
      res.json(recommendations);
    } catch (error) {
      console.error('Error generating budget recommendations:', error);
      res.status(500).json({ message: 'Failed to generate budget recommendations' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
