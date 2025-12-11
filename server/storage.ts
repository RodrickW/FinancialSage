import { users, accounts, transactions, budgets, insights, creditScores, savingsGoals, debtGoals, feedback, savingsTracker, creditAssessments, interviews, dailyCheckins, challengeEnrollments, challengeMissions, weeklyReflections, challengeStreaks, transformationMoments } from "@shared/schema";
import type { User, InsertUser, Account, InsertAccount, Transaction, InsertTransaction, Budget, InsertBudget, Insight, InsertInsight, CreditScore, InsertCreditScore, SavingsGoal, InsertSavingsGoal, DebtGoal, InsertDebtGoal, Feedback, InsertFeedback, SavingsTracker, InsertSavingsTracker, CreditAssessment, InsertCreditAssessment, Interview, InsertInterview, DailyCheckin, InsertDailyCheckin, ChallengeEnrollment, InsertChallengeEnrollment, ChallengeMission, InsertChallengeMission, WeeklyReflection, InsertWeeklyReflection, ChallengeStreak, InsertChallengeStreak, TransformationMoment, InsertTransformationMoment } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
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
  getTransactionsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionByPlaidId(plaidTransactionId: string): Promise<Transaction | undefined>;
  
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
  deleteSavingsGoal(id: number, userId: number): Promise<void>;

  // Debt goal operations
  getDebtGoals(userId: number): Promise<DebtGoal[]>;
  createDebtGoal(debtGoal: InsertDebtGoal): Promise<DebtGoal>;
  updateDebtGoal(id: number, data: Partial<InsertDebtGoal>): Promise<DebtGoal | undefined>;
  deleteDebtGoal(id: number, userId: number): Promise<void>;
  
  // Feedback operations
  getFeedback(): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedbackStatus(id: number, status: string): Promise<Feedback | undefined>;
  
  // Savings tracker operations
  getSavingsTracker(userId: number, year: number): Promise<SavingsTracker[]>;
  getCurrentMonthSavings(userId: number): Promise<SavingsTracker | undefined>;
  getCurrentYearSavings(userId: number): Promise<number>;
  updateMonthlySavings(userId: number, month: number, year: number, amount: number): Promise<SavingsTracker>;

  // Credit assessment operations
  getCreditAssessment(userId: number): Promise<CreditAssessment | undefined>;
  createCreditAssessment(assessment: InsertCreditAssessment): Promise<CreditAssessment>;
  updateCreditAssessment(id: number, data: Partial<InsertCreditAssessment>): Promise<CreditAssessment | undefined>;

  // Interview operations
  getLatestInterview(userId: number): Promise<Interview | undefined>;
  createInterview(interview: InsertInterview): Promise<Interview>;

  // Daily check-in operations
  getTodayCheckin(userId: number): Promise<DailyCheckin | undefined>;
  getCheckinStreak(userId: number): Promise<number>;
  createDailyCheckin(checkin: InsertDailyCheckin): Promise<DailyCheckin>;
  updateDailyCheckin(id: number, data: Partial<InsertDailyCheckin>): Promise<DailyCheckin | undefined>;

  // 30-Day Money Reset Challenge operations
  getActiveChallenge(userId: number): Promise<ChallengeEnrollment | undefined>;
  createChallengeEnrollment(enrollment: InsertChallengeEnrollment): Promise<ChallengeEnrollment>;
  updateChallengeEnrollment(id: number, data: Partial<InsertChallengeEnrollment>): Promise<ChallengeEnrollment | undefined>;
  
  // Challenge missions
  getTodayMission(enrollmentId: number, day: number): Promise<ChallengeMission | undefined>;
  getMissionsByEnrollment(enrollmentId: number): Promise<ChallengeMission[]>;
  createChallengeMission(mission: InsertChallengeMission): Promise<ChallengeMission>;
  updateChallengeMission(id: number, data: Partial<InsertChallengeMission>): Promise<ChallengeMission | undefined>;
  
  // Weekly reflections
  getWeeklyReflection(enrollmentId: number, weekNumber: number): Promise<WeeklyReflection | undefined>;
  getAllWeeklyReflections(enrollmentId: number): Promise<WeeklyReflection[]>;
  createWeeklyReflection(reflection: InsertWeeklyReflection): Promise<WeeklyReflection>;
  updateWeeklyReflection(id: number, data: Partial<InsertWeeklyReflection>): Promise<WeeklyReflection | undefined>;
  
  // Challenge streaks
  getChallengeStreak(enrollmentId: number): Promise<ChallengeStreak | undefined>;
  createChallengeStreak(streak: InsertChallengeStreak): Promise<ChallengeStreak>;
  updateChallengeStreak(id: number, data: Partial<InsertChallengeStreak>): Promise<ChallengeStreak | undefined>;
  
  // Transformation moments
  getTransformationMoments(userId: number): Promise<TransformationMoment[]>;
  createTransformationMoment(moment: InsertTransformationMoment): Promise<TransformationMoment>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
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
        subscriptionStatus: 'active'
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
  async getTransactions(userId: number, limit: number = 500): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date)) // Get newest transactions first
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
  
  async getTransactionsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .orderBy(desc(transactions.date));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getTransactionByPlaidId(plaidTransactionId: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.plaidTransactionId, plaidTransactionId));
    return transaction;
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
  
  async deleteSavingsGoal(id: number, userId: number): Promise<void> {
    await db
      .delete(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));
  }

  // Debt Goal methods
  async getDebtGoals(userId: number): Promise<DebtGoal[]> {
    return await db.select().from(debtGoals).where(eq(debtGoals.userId, userId));
  }
  
  async createDebtGoal(debtGoal: InsertDebtGoal): Promise<DebtGoal> {
    const [newDebtGoal] = await db
      .insert(debtGoals)
      .values({
        userId: debtGoal.userId,
        name: debtGoal.name,
        originalAmount: debtGoal.originalAmount,
        currentAmount: debtGoal.currentAmount,
        targetDate: debtGoal.targetDate,
        interestRate: debtGoal.interestRate,
        minimumPayment: debtGoal.minimumPayment,
        color: debtGoal.color,
        icon: debtGoal.icon
      })
      .returning();
    return newDebtGoal;
  }
  
  async updateDebtGoal(id: number, data: Partial<InsertDebtGoal>): Promise<DebtGoal | undefined> {
    const [updatedDebtGoal] = await db
      .update(debtGoals)
      .set(data)
      .where(eq(debtGoals.id, id))
      .returning();
    return updatedDebtGoal;
  }
  
  async deleteDebtGoal(id: number, userId: number): Promise<void> {
    await db
      .delete(debtGoals)
      .where(and(eq(debtGoals.id, id), eq(debtGoals.userId, userId)));
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
      .set({ status })
      .where(eq(feedback.id, id))
      .returning();
    return updatedFeedback;
  }

  // Savings tracker operations
  async getSavingsTracker(userId: number, year: number): Promise<SavingsTracker[]> {
    return await db
      .select()
      .from(savingsTracker)
      .where(and(eq(savingsTracker.userId, userId), eq(savingsTracker.year, year)))
      .orderBy(savingsTracker.month);
  }

  async getCurrentMonthSavings(userId: number): Promise<SavingsTracker | undefined> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const [tracker] = await db
      .select()
      .from(savingsTracker)
      .where(and(
        eq(savingsTracker.userId, userId),
        eq(savingsTracker.month, currentMonth),
        eq(savingsTracker.year, currentYear)
      ));
    
    return tracker;
  }

  async getCurrentYearSavings(userId: number): Promise<number> {
    const currentYear = new Date().getFullYear();
    const yearTrackers = await this.getSavingsTracker(userId, currentYear);
    
    const total = yearTrackers.reduce((total, tracker) => total + tracker.totalSaved, 0);
    // Fix floating point precision issues by rounding to 2 decimal places
    return Math.round(total * 100) / 100;
  }

  async updateMonthlySavings(userId: number, month: number, year: number, amount: number): Promise<SavingsTracker> {
    // First try to update existing record
    const [existing] = await db
      .select()
      .from(savingsTracker)
      .where(and(
        eq(savingsTracker.userId, userId),
        eq(savingsTracker.month, month),
        eq(savingsTracker.year, year)
      ));

    if (existing) {
      const [updated] = await db
        .update(savingsTracker)
        .set({ 
          totalSaved: existing.totalSaved + amount,
          goalsSaved: existing.goalsSaved + amount,
          updatedAt: new Date()
        })
        .where(eq(savingsTracker.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new record
      const [created] = await db
        .insert(savingsTracker)
        .values({
          userId,
          month,
          year,
          totalSaved: amount,
          goalsSaved: amount
        })
        .returning();
      return created;
    }
  }

  // Credit assessment operations
  async getCreditAssessment(userId: number): Promise<CreditAssessment | undefined> {
    const [assessment] = await db.select().from(creditAssessments)
      .where(eq(creditAssessments.userId, userId))
      .orderBy(desc(creditAssessments.createdAt));
    return assessment;
  }

  async createCreditAssessment(assessment: InsertCreditAssessment): Promise<CreditAssessment> {
    const [created] = await db.insert(creditAssessments).values(assessment).returning();
    return created;
  }

  async updateCreditAssessment(id: number, data: Partial<InsertCreditAssessment>): Promise<CreditAssessment | undefined> {
    const [updated] = await db
      .update(creditAssessments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(creditAssessments.id, id))
      .returning();
    return updated;
  }

  // Interview operations
  async getLatestInterview(userId: number): Promise<Interview | undefined> {
    const [interview] = await db.select().from(interviews)
      .where(eq(interviews.userId, userId))
      .orderBy(desc(interviews.createdAt));
    return interview;
  }

  async createInterview(interview: InsertInterview): Promise<Interview> {
    const [created] = await db.insert(interviews).values(interview).returning();
    return created;
  }

  // Daily check-in operations
  async getTodayCheckin(userId: number): Promise<DailyCheckin | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [checkin] = await db.select().from(dailyCheckins)
      .where(and(
        eq(dailyCheckins.userId, userId),
        gte(dailyCheckins.date, today),
        lte(dailyCheckins.date, tomorrow)
      ));
    return checkin;
  }

  async getCheckinStreak(userId: number): Promise<number> {
    const checkins = await db.select().from(dailyCheckins)
      .where(eq(dailyCheckins.userId, userId))
      .orderBy(desc(dailyCheckins.date))
      .limit(30);
    
    if (checkins.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < checkins.length; i++) {
      const checkinDate = new Date(checkins[i].date);
      checkinDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (checkinDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  async createDailyCheckin(checkin: InsertDailyCheckin): Promise<DailyCheckin> {
    const [created] = await db.insert(dailyCheckins).values(checkin).returning();
    return created;
  }

  async updateDailyCheckin(id: number, data: Partial<InsertDailyCheckin>): Promise<DailyCheckin | undefined> {
    const [updated] = await db
      .update(dailyCheckins)
      .set(data)
      .where(eq(dailyCheckins.id, id))
      .returning();
    return updated;
  }

  // 30-Day Money Reset Challenge operations
  async getActiveChallenge(userId: number): Promise<ChallengeEnrollment | undefined> {
    const [enrollment] = await db.select().from(challengeEnrollments)
      .where(and(
        eq(challengeEnrollments.userId, userId),
        eq(challengeEnrollments.status, 'active')
      ))
      .orderBy(desc(challengeEnrollments.createdAt))
      .limit(1);
    return enrollment;
  }

  async createChallengeEnrollment(enrollment: InsertChallengeEnrollment): Promise<ChallengeEnrollment> {
    const [created] = await db.insert(challengeEnrollments).values(enrollment).returning();
    return created;
  }

  async updateChallengeEnrollment(id: number, data: Partial<InsertChallengeEnrollment>): Promise<ChallengeEnrollment | undefined> {
    const [updated] = await db
      .update(challengeEnrollments)
      .set(data)
      .where(eq(challengeEnrollments.id, id))
      .returning();
    return updated;
  }

  // Challenge missions
  async getTodayMission(enrollmentId: number, day: number): Promise<ChallengeMission | undefined> {
    const [mission] = await db.select().from(challengeMissions)
      .where(and(
        eq(challengeMissions.enrollmentId, enrollmentId),
        eq(challengeMissions.day, day)
      ));
    return mission;
  }

  async getMissionsByEnrollment(enrollmentId: number): Promise<ChallengeMission[]> {
    return await db.select().from(challengeMissions)
      .where(eq(challengeMissions.enrollmentId, enrollmentId))
      .orderBy(challengeMissions.day);
  }

  async createChallengeMission(mission: InsertChallengeMission): Promise<ChallengeMission> {
    const [created] = await db.insert(challengeMissions).values(mission).returning();
    return created;
  }

  async updateChallengeMission(id: number, data: Partial<InsertChallengeMission>): Promise<ChallengeMission | undefined> {
    const [updated] = await db
      .update(challengeMissions)
      .set(data)
      .where(eq(challengeMissions.id, id))
      .returning();
    return updated;
  }

  // Weekly reflections
  async getWeeklyReflection(enrollmentId: number, weekNumber: number): Promise<WeeklyReflection | undefined> {
    const [reflection] = await db.select().from(weeklyReflections)
      .where(and(
        eq(weeklyReflections.enrollmentId, enrollmentId),
        eq(weeklyReflections.weekNumber, weekNumber)
      ));
    return reflection;
  }

  async getAllWeeklyReflections(enrollmentId: number): Promise<WeeklyReflection[]> {
    return await db.select().from(weeklyReflections)
      .where(eq(weeklyReflections.enrollmentId, enrollmentId))
      .orderBy(desc(weeklyReflections.weekNumber));
  }

  async createWeeklyReflection(reflection: InsertWeeklyReflection): Promise<WeeklyReflection> {
    const [created] = await db.insert(weeklyReflections).values(reflection).returning();
    return created;
  }

  async updateWeeklyReflection(id: number, data: Partial<InsertWeeklyReflection>): Promise<WeeklyReflection | undefined> {
    const [updated] = await db
      .update(weeklyReflections)
      .set(data)
      .where(eq(weeklyReflections.id, id))
      .returning();
    return updated;
  }

  // Challenge streaks
  async getChallengeStreak(enrollmentId: number): Promise<ChallengeStreak | undefined> {
    const [streak] = await db.select().from(challengeStreaks)
      .where(eq(challengeStreaks.enrollmentId, enrollmentId));
    return streak;
  }

  async createChallengeStreak(streak: InsertChallengeStreak): Promise<ChallengeStreak> {
    const [created] = await db.insert(challengeStreaks).values(streak).returning();
    return created;
  }

  async updateChallengeStreak(id: number, data: Partial<InsertChallengeStreak>): Promise<ChallengeStreak | undefined> {
    const [updated] = await db
      .update(challengeStreaks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(challengeStreaks.id, id))
      .returning();
    return updated;
  }

  // Transformation moments
  async getTransformationMoments(userId: number): Promise<TransformationMoment[]> {
    return await db.select().from(transformationMoments)
      .where(eq(transformationMoments.userId, userId))
      .orderBy(desc(transformationMoments.createdAt));
  }

  async createTransformationMoment(moment: InsertTransformationMoment): Promise<TransformationMoment> {
    const [created] = await db.insert(transformationMoments).values(moment).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
