import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Subscription fields
  isPremium: boolean("is_premium").default(false),
  premiumTier: text("premium_tier"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"),
  trialEndsAt: timestamp("trial_ends_at"),
  hasStartedTrial: boolean("has_started_trial").default(false),
  
  // Onboarding tracking
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  hasSeenTour: boolean("has_seen_tour").default(false),
  loginCount: integer("login_count").default(0),
  
  // Admin access
  isAdmin: boolean("is_admin").default(false),
});

// Connected account schema (bank accounts via Plaid)
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountName: text("account_name").notNull(),
  accountType: text("account_type").notNull(), // checking, savings, credit
  accountNumber: text("account_number").notNull(), // masked account number
  balance: doublePrecision("balance").notNull(),
  institutionName: text("institution_name").notNull(),
  institutionLogo: text("institution_logo"),
  isConnected: boolean("is_connected").notNull().default(true),
  plaidAccessToken: text("plaid_access_token"), // Store access token for transaction syncing
  plaidAccountId: text("plaid_account_id"), // Store Plaid account ID for reference
  lastBalanceUpdate: timestamp("last_balance_update").defaultNow().notNull(), // Track when balance was last refreshed
});

// Transaction schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  amount: doublePrecision("amount").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  merchantName: text("merchant_name").notNull(),
  merchantIcon: text("merchant_icon"),
  plaidTransactionId: text("plaid_transaction_id").unique(), // For duplicate prevention
});

// Budget schema
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  amount: doublePrecision("amount").notNull(),
  period: text("period").notNull(), // monthly, weekly, etc.
  spent: doublePrecision("spent").notNull().default(0),
  remaining: doublePrecision("remaining"),
  icon: text("icon"),
});

// Financial insights schema for AI recommendations
export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // spending, saving, investing, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // info, warning, alert
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isRead: boolean("is_read").notNull().default(false),
});

// Credit score schema
export const creditScores = pgTable("credit_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  rating: text("rating").notNull(), // poor, fair, good, excellent
  reportDate: timestamp("report_date").defaultNow().notNull(),
  factors: jsonb("factors"), // Payment history, utilization, etc.
});

// Savings goal schema
export const savingsGoals = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetAmount: doublePrecision("target_amount").notNull(),
  currentAmount: doublePrecision("current_amount").notNull().default(0),
  deadline: timestamp("deadline"),
  color: text("color").notNull().default("blue"),
  icon: text("icon"),
});

export const debtGoals = pgTable("debt_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  originalAmount: doublePrecision("original_amount").notNull(),
  currentAmount: doublePrecision("current_amount").notNull(),
  targetDate: timestamp("target_date"),
  interestRate: doublePrecision("interest_rate"),
  minimumPayment: doublePrecision("minimum_payment"),
  color: text("color").notNull().default("red"),
  icon: text("icon"),
});

// Feedback schema for user feedback collection
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'bug', 'feature', 'general'
  title: text("title").notNull(),
  message: text("message").notNull(),
  rating: integer("rating"), // 1-5 star rating
  status: text("status").notNull().default("open"), // 'open', 'reviewed', 'implemented'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Credit assessment schema for credit score simulation and improvement
export const creditAssessments = pgTable("credit_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentScore: integer("current_score").notNull(),
  goalScore: integer("goal_score").notNull(),
  paymentHistory: text("payment_history").notNull(), // excellent, good, fair, poor
  creditUtilization: doublePrecision("credit_utilization").notNull(), // percentage
  creditHistoryLength: integer("credit_history_length").notNull(), // months
  creditMix: text("credit_mix").notNull(), // excellent, good, limited, poor
  newCreditInquiries: integer("new_credit_inquiries").notNull(), // in last 12 months
  totalCreditLimit: doublePrecision("total_credit_limit").notNull(),
  totalCreditBalance: doublePrecision("total_credit_balance").notNull(),
  monthlyIncome: doublePrecision("monthly_income").notNull(),
  hasCollections: boolean("has_collections").default(false),
  hasBankruptcy: boolean("has_bankruptcy").default(false),
  hasForeclosure: boolean("has_foreclosure").default(false),
  improvementPlan: jsonb("improvement_plan"), // AI-generated plan
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Savings tracker schema for monthly and yearly progress
export const savingsTracker = pgTable("savings_tracker", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  totalSaved: doublePrecision("total_saved").notNull().default(0),
  goalsSaved: doublePrecision("goals_saved").notNull().default(0), // Amount saved towards goals
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Interview responses schema for Money Mind financial coaching
export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  responses: jsonb("responses").notNull(), // Store all interview responses as JSON
  completedAt: timestamp("completed_at").notNull(),
  personalizedPlan: jsonb("personalized_plan"), // AI-generated personalized plan
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true });
export const insertBudgetSchema = createInsertSchema(budgets).omit({ id: true });
export const insertInsightSchema = createInsertSchema(insights).omit({ id: true, createdAt: true, isRead: true });
export const insertCreditScoreSchema = createInsertSchema(creditScores).omit({ id: true, reportDate: true });
export const insertSavingsGoalSchema = createInsertSchema(savingsGoals).omit({ id: true, currentAmount: true });
export const insertDebtGoalSchema = createInsertSchema(debtGoals).omit({ id: true });
export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true, createdAt: true, updatedAt: true, status: true });
export const insertSavingsTrackerSchema = createInsertSchema(savingsTracker).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreditAssessmentSchema = createInsertSchema(creditAssessments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInterviewSchema = createInsertSchema(interviews).omit({ id: true, createdAt: true });

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type Insight = typeof insights.$inferSelect;
export type InsertInsight = z.infer<typeof insertInsightSchema>;

export type CreditScore = typeof creditScores.$inferSelect;
export type InsertCreditScore = z.infer<typeof insertCreditScoreSchema>;

export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;

export type DebtGoal = typeof debtGoals.$inferSelect;
export type InsertDebtGoal = z.infer<typeof insertDebtGoalSchema>;

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type SavingsTracker = typeof savingsTracker.$inferSelect;
export type InsertSavingsTracker = z.infer<typeof insertSavingsTrackerSchema>;

export type CreditAssessment = typeof creditAssessments.$inferSelect;
export type InsertCreditAssessment = z.infer<typeof insertCreditAssessmentSchema>;

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
