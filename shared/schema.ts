import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Subscription tier types: 'free' | 'plus' | 'pro'
export type SubscriptionTier = 'free' | 'plus' | 'pro';

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Tiered subscription fields
  subscriptionTier: text("subscription_tier").default("free").notNull(), // 'free', 'plus', 'pro'
  isPremium: boolean("is_premium").default(false), // Legacy - kept for backwards compatibility
  premiumTier: text("premium_tier"), // Legacy - use subscriptionTier instead
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"), // Track which price they're on
  subscriptionStatus: text("subscription_status").default("inactive"),
  subscriptionPeriod: text("subscription_period"), // 'monthly' or 'annual'
  
  // AI usage tracking for Plus tier limits
  aiMessagesUsedThisMonth: integer("ai_messages_used_this_month").default(0),
  aiMessagesResetAt: timestamp("ai_messages_reset_at"),
  
  // Legacy trial fields (deprecated - kept for backwards compatibility)
  trialEndsAt: timestamp("trial_ends_at"),
  hasStartedTrial: boolean("has_started_trial").default(false),
  
  // RevenueCat (Apple IAP) fields
  revenuecatUserId: text("revenuecat_user_id"),
  revenuecatSubscriptionId: text("revenuecat_subscription_id"),
  revenuecatProductId: text("revenuecat_product_id"),
  revenuecatExpiresAt: timestamp("revenuecat_expires_at"),
  revenuecatPlatform: text("revenuecat_platform"), // ios, android
  revenuecatTier: text("revenuecat_tier"), // 'plus' or 'pro' from RevenueCat
  
  // Onboarding tracking
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  hasSeenTour: boolean("has_seen_tour").default(false),
  tourViewCount: integer("tour_view_count").default(0),
  loginCount: integer("login_count").default(0),
  
  // Admin access
  isAdmin: boolean("is_admin").default(false),
  
  // Faith Mode - Biblical money mindset
  faithModeEnabled: boolean("faith_mode_enabled").default(false),
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

// Daily check-ins for habit formation and engagement
export const dailyCheckins = pgTable("daily_checkins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(), // The check-in date
  moneyMindScore: integer("money_mind_score").notNull(), // 0-100 daily score
  habitCompleted: boolean("habit_completed").default(false),
  habitText: text("habit_text"), // The specific habit for this day
  aiInsight: text("ai_insight"), // Personalized AI insight for the day
  streak: integer("streak").default(1), // Current check-in streak
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 30-Day Money Reset Challenge Enrollment
export const challengeEnrollments = pgTable("challenge_enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"), // active, completed, paused, abandoned
  currentDay: integer("current_day").notNull().default(1), // 1-30
  startDate: timestamp("start_date").notNull(),
  completedAt: timestamp("completed_at"),
  playbookSnapshot: jsonb("playbook_snapshot"), // Money Playbook profile at enrollment
  totalMissionsCompleted: integer("total_missions_completed").default(0),
  totalReflectionsCompleted: integer("total_reflections_completed").default(0),
  graceDaysUsed: integer("grace_days_used").default(0), // Max 3 grace days allowed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Daily Missions for the 30-Day Challenge
export const challengeMissions = pgTable("challenge_missions", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => challengeEnrollments.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  day: integer("day").notNull(), // 1-30
  missionType: text("mission_type").notNull(), // detox, habit, identity, reflection, action
  title: text("title").notNull(),
  description: text("description").notNull(),
  actionPrompt: text("action_prompt").notNull(), // What user needs to do
  detoxCategory: text("detox_category"), // If detox mission: dining, shopping, subscriptions, etc.
  detoxTarget: doublePrecision("detox_target"), // Target spending limit for detox
  identityShift: text("identity_shift"), // Identity reframe message
  aiContextSnapshot: jsonb("ai_context_snapshot"), // Behavioral data used to generate
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  userReflection: text("user_reflection"), // Optional user notes on completion
  missionDate: timestamp("mission_date").notNull(), // The date this mission is for
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Weekly Reflections (Days 7, 14, 21, 28)
export const weeklyReflections = pgTable("weekly_reflections", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => challengeEnrollments.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekNumber: integer("week_number").notNull(), // 1-4
  promptQuestions: jsonb("prompt_questions").notNull(), // AI-generated reflection questions
  userResponses: jsonb("user_responses"), // User's answers
  aiCoachingResponse: text("ai_coaching_response"), // AI feedback on their progress
  weeklyStats: jsonb("weekly_stats"), // Spending delta, detox success rate, etc.
  identityShiftMessage: text("identity_shift_message"), // Week's identity transformation message
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  reflectionDate: timestamp("reflection_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Challenge Streaks and Badges
export const challengeStreaks = pgTable("challenge_streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  enrollmentId: integer("enrollment_id").notNull().references(() => challengeEnrollments.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastCompletedAt: timestamp("last_completed_at"),
  badges: jsonb("badges").default([]), // Array of earned badges
  totalDetoxDaysCompleted: integer("total_detox_days_completed").default(0),
  totalHabitDaysCompleted: integer("total_habit_days_completed").default(0),
  totalSpendingSaved: doublePrecision("total_spending_saved").default(0), // Money saved via detox
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Shareable Transformation Moments
export const transformationMoments = pgTable("transformation_moments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  enrollmentId: integer("enrollment_id").notNull().references(() => challengeEnrollments.id, { onDelete: "cascade" }),
  momentType: text("moment_type").notNull(), // milestone, weekly_win, streak_achievement, completion
  title: text("title").notNull(),
  quote: text("quote").notNull(), // Inspirational quote or user statement
  statLabel: text("stat_label"), // e.g., "Money Saved"
  statValue: text("stat_value"), // e.g., "$247"
  dayNumber: integer("day_number").notNull(),
  cardImageData: text("card_image_data"), // Base64 or URL for shareable card
  isShared: boolean("is_shared").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true });
export const insertBudgetSchema = createInsertSchema(budgets).omit({ id: true });
export const insertInsightSchema = createInsertSchema(insights).omit({ id: true, createdAt: true, isRead: true });
export const insertSavingsGoalSchema = createInsertSchema(savingsGoals).omit({ id: true, currentAmount: true });
export const insertDebtGoalSchema = createInsertSchema(debtGoals).omit({ id: true });
export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true, createdAt: true, updatedAt: true, status: true });
export const insertSavingsTrackerSchema = createInsertSchema(savingsTracker).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInterviewSchema = createInsertSchema(interviews).omit({ id: true, createdAt: true });
export const insertDailyCheckinSchema = createInsertSchema(dailyCheckins).omit({ id: true, createdAt: true });

// 30-Day Money Reset Challenge schemas
export const insertChallengeEnrollmentSchema = createInsertSchema(challengeEnrollments).omit({ id: true, createdAt: true });
export const insertChallengeMissionSchema = createInsertSchema(challengeMissions).omit({ id: true, createdAt: true });
export const insertWeeklyReflectionSchema = createInsertSchema(weeklyReflections).omit({ id: true, createdAt: true });
export const insertChallengeStreakSchema = createInsertSchema(challengeStreaks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTransformationMomentSchema = createInsertSchema(transformationMoments).omit({ id: true, createdAt: true });

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

export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;

export type DebtGoal = typeof debtGoals.$inferSelect;
export type InsertDebtGoal = z.infer<typeof insertDebtGoalSchema>;

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type SavingsTracker = typeof savingsTracker.$inferSelect;
export type InsertSavingsTracker = z.infer<typeof insertSavingsTrackerSchema>;

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;

export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type InsertDailyCheckin = z.infer<typeof insertDailyCheckinSchema>;

// 30-Day Money Reset Challenge types
export type ChallengeEnrollment = typeof challengeEnrollments.$inferSelect;
export type InsertChallengeEnrollment = z.infer<typeof insertChallengeEnrollmentSchema>;

export type ChallengeMission = typeof challengeMissions.$inferSelect;
export type InsertChallengeMission = z.infer<typeof insertChallengeMissionSchema>;

export type WeeklyReflection = typeof weeklyReflections.$inferSelect;
export type InsertWeeklyReflection = z.infer<typeof insertWeeklyReflectionSchema>;

export type ChallengeStreak = typeof challengeStreaks.$inferSelect;
export type InsertChallengeStreak = z.infer<typeof insertChallengeStreakSchema>;

export type TransformationMoment = typeof transformationMoments.$inferSelect;
export type InsertTransformationMoment = z.infer<typeof insertTransformationMomentSchema>;
