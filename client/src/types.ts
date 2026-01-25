// Dashboard types
export type SubscriptionTier = 'free' | 'plus' | 'pro';

export interface UserProfile {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  isPremium: boolean;
  hasStartedTrial: boolean;
  trialEndsAt?: string;
  subscriptionStatus: string;
  subscriptionTier?: SubscriptionTier;
  faithModeEnabled?: boolean;
}

export interface FinancialOverviewData {
  totalBalance: number;
  previousMonthBalance?: number;
  monthlySpending: number;
  previousMonthSpending?: number;
  weeklySpending?: number;
  dailySpending?: number;
  savingsProgress: {
    current: number;
    target: number;
    name: string;
  };
}

export interface SpendingCategory {
  name: string;
  amount: number;
  icon: string;
  color: string;
}

export interface MonthlySpending {
  month: string;
  income: number;
  expenses: number;
}

export interface Transaction {
  id: number;
  merchantName: string;
  merchantIcon: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
}

export interface AIInsight {
  id: number;
  type: string;
  title: string;
  description: string;
  icon: string;
  severity: 'info' | 'warning' | 'alert';
  color: string;
}

export interface FinancialHealthScore {
  score: number;
  maxScore: number;
  rating: string;
}

export interface ConnectedAccount {
  id: number;
  accountName: string;
  accountType: string;
  accountNumber: string;
  balance: number;
  institutionName: string;
  institutionLogo?: string;
}

export interface BudgetItem {
  id: number;
  category: string;
  icon: string;
  spent: number;
  limit: number;
  daysLeft: number;
  color: string;
}

// Authentication types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  email: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// OpenAI types
export interface AIRecommendation {
  type: string;
  title: string;
  content: string;
}
