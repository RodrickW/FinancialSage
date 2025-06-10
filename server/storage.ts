import { users, accounts, transactions, budgets, insights, creditScores, savingsGoals, feedback } from "@shared/schema";
import type { User, InsertUser, Account, InsertAccount, Transaction, InsertTransaction, Budget, InsertBudget, Insight, InsertInsight, CreditScore, InsertCreditScore, SavingsGoal, InsertSavingsGoal, Feedback, InsertFeedback } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  updateStripeInfo(id: number, stripeId: string, subscriptionId: string): Promise<User | undefined>;
  
  // Account operations
  getAccounts(userId: number): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, data: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  
  // Transaction operations
  getTransactions(userId: number, limit?: number): Promise<Transaction[]>;
  getAccountTransactions(accountId: number, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Budget operations
  getBudgets(userId: number): Promise<Budget[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, data: Partial<InsertBudget>): Promise<Budget | undefined>;
  
  // Insight operations
  getInsights(userId: number): Promise<Insight[]>;
  createInsight(insight: InsertInsight): Promise<Insight>;
  markInsightAsRead(id: number): Promise<boolean>;
  
  // Credit score operations
  getCreditScore(userId: number): Promise<CreditScore | undefined>;
  createCreditScore(creditScore: InsertCreditScore): Promise<CreditScore>;
  updateCreditScore(id: number, data: Partial<InsertCreditScore>): Promise<CreditScore>;
  getCreditHistory(userId: number): Promise<any[]>;
  
  // Savings goal operations
  getSavingsGoals(userId: number): Promise<SavingsGoal[]>;
  createSavingsGoal(savingsGoal: InsertSavingsGoal): Promise<SavingsGoal>;
  updateSavingsGoal(id: number, data: Partial<InsertSavingsGoal>): Promise<SavingsGoal | undefined>;
  
  // Feedback operations
  getFeedback(): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedbackStatus(id: number, status: string): Promise<Feedback | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async updateStripeInfo(id: number, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        isPremium: true,
        subscriptionStatus: 'active',
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  // Account operations
  async getAccounts(userId: number): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.userId, userId));
  }
  
  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }
  
  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db
      .insert(accounts)
      .values(account)
      .returning();
    return newAccount;
  }
  
  async updateAccount(id: number, data: Partial<InsertAccount>): Promise<Account | undefined> {
    const [updatedAccount] = await db
      .update(accounts)
      .set(data)
      .where(eq(accounts.id, id))
      .returning();
    return updatedAccount;
  }
  
  async deleteAccount(id: number): Promise<boolean> {
    const result = await db
      .delete(accounts)
      .where(eq(accounts.id, id))
      .returning({ id: accounts.id });
    return result.length > 0;
  }
  
  // Transaction operations
  async getTransactions(userId: number, limit: number = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(transactions.date)
      .limit(limit);
  }
  
  async getAccountTransactions(accountId: number, limit: number = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.accountId, accountId))
      .orderBy(transactions.date)
      .limit(limit);
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }
  
  // Budget operations
  async getBudgets(userId: number): Promise<Budget[]> {
    return await db.select().from(budgets).where(eq(budgets.userId, userId));
  }
  
  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db
      .insert(budgets)
      .values(budget)
      .returning();
    return newBudget;
  }
  
  async updateBudget(id: number, data: Partial<InsertBudget>): Promise<Budget | undefined> {
    const [updatedBudget] = await db
      .update(budgets)
      .set(data)
      .where(eq(budgets.id, id))
      .returning();
    return updatedBudget;
  }
  
  // Insight operations
  async getInsights(userId: number): Promise<Insight[]> {
    return await db
      .select()
      .from(insights)
      .where(eq(insights.userId, userId))
      .orderBy(insights.createdAt);
  }
  
  async createInsight(insight: InsertInsight): Promise<Insight> {
    const [newInsight] = await db
      .insert(insights)
      .values(insight)
      .returning();
    return newInsight;
  }
  
  async markInsightAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(insights)
      .set({ isRead: true })
      .where(eq(insights.id, id))
      .returning({ id: insights.id });
    return result.length > 0;
  }
  
  // Credit score operations
  async getCreditScore(userId: number): Promise<CreditScore | undefined> {
    const [creditScore] = await db
      .select()
      .from(creditScores)
      .where(eq(creditScores.userId, userId))
      .orderBy(creditScores.reportDate)
      .limit(1);
    return creditScore;
  }
  
  async createCreditScore(creditScore: InsertCreditScore): Promise<CreditScore> {
    const [newCreditScore] = await db
      .insert(creditScores)
      .values(creditScore)
      .returning();
    return newCreditScore;
  }
  
  async updateCreditScore(id: number, data: Partial<InsertCreditScore>): Promise<CreditScore> {
    const [updatedCreditScore] = await db
      .update(creditScores)
      .set({
        ...data,
        reportDate: new Date() // Always update report date when updating score
      })
      .where(eq(creditScores.id, id))
      .returning();
    
    if (!updatedCreditScore) {
      throw new Error(`Credit score with id ${id} not found`);
    }
    
    return updatedCreditScore;
  }
  
  async getCreditHistory(userId: number): Promise<any[]> {
    // Query credit score history for the user
    // For now we'll get the most recent entries and sort by date
    const history = await db
      .select()
      .from(creditScores)
      .where(eq(creditScores.userId, userId))
      .orderBy(desc(creditScores.reportDate))
      .limit(12); // Last 12 reports
      
    return history;
  }
  
  // Savings goal operations
  async getSavingsGoals(userId: number): Promise<SavingsGoal[]> {
    return await db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId));
  }
  
  async createSavingsGoal(savingsGoal: InsertSavingsGoal): Promise<SavingsGoal> {
    const [newSavingsGoal] = await db
      .insert(savingsGoals)
      .values(savingsGoal)
      .returning();
    return newSavingsGoal;
  }
  
  async updateSavingsGoal(id: number, data: Partial<InsertSavingsGoal>): Promise<SavingsGoal | undefined> {
    const [updatedSavingsGoal] = await db
      .update(savingsGoals)
      .set(data)
      .where(eq(savingsGoals.id, id))
      .returning();
    return updatedSavingsGoal;
  }

  // Feedback operations
  async getFeedback(): Promise<Feedback[]> {
    return await db.select().from(feedback).orderBy(desc(feedback.createdAt));
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db
      .insert(feedback)
      .values(feedbackData)
      .returning();
    return newFeedback;
  }

  async updateFeedbackStatus(id: number, status: string): Promise<Feedback | undefined> {
    const [updatedFeedback] = await db
      .update(feedback)
      .set({ status, updatedAt: new Date() })
      .where(eq(feedback.id, id))
      .returning();
    return updatedFeedback;
  }
}

export const storage = new DatabaseStorage();
