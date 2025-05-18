import { 
  FinancialOverviewData, 
  SpendingCategory, 
  MonthlySpending, 
  Transaction, 
  AIInsight, 
  ConnectedAccount, 
  CreditScoreData, 
  BudgetItem,
  UserProfile 
} from '@/types';

// Mock user profile
export const mockUserProfile: UserProfile = {
  id: 1,
  username: 'sarahjohnson',
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah@example.com'
};

// Mock financial overview data
export const mockFinancialOverview: FinancialOverviewData = {
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

// Mock spending categories
export const mockSpendingCategories: SpendingCategory[] = [
  {
    name: 'Food & Dining',
    amount: 820.45,
    icon: 'restaurant',
    color: 'text-primary-500 bg-primary-50'
  },
  {
    name: 'Housing',
    amount: 1450.00,
    icon: 'home',
    color: 'text-secondary-500 bg-secondary-50'
  },
  {
    name: 'Transportation',
    amount: 385.20,
    icon: 'directions_car',
    color: 'text-accent-500 bg-accent-50'
  },
  {
    name: 'Shopping',
    amount: 605.85,
    icon: 'shopping_bag',
    color: 'text-error-500 bg-error-50'
  }
];

// Mock monthly spending trends data
export const mockMonthlySpending: MonthlySpending[] = [
  { month: 'Feb', income: 4200, expenses: 3100 },
  { month: 'Mar', income: 4300, expenses: 3400 },
  { month: 'Apr', income: 4100, expenses: 3200 },
  { month: 'May', income: 4500, expenses: 3500 },
  { month: 'Jun', income: 4800, expenses: 3600 },
  { month: 'Jul', income: 5000, expenses: 3800 }
];

// Mock transactions
export const mockTransactions: Transaction[] = [
  {
    id: 1,
    merchantName: 'Starbucks',
    merchantIcon: 'coffee',
    category: 'Coffee Shop',
    amount: -5.75,
    date: 'Jul 3, 2023'
  },
  {
    id: 2,
    merchantName: 'Whole Foods Market',
    merchantIcon: 'shopping_cart',
    category: 'Groceries',
    amount: -78.29,
    date: 'Jul 2, 2023'
  },
  {
    id: 3,
    merchantName: 'Payroll Deposit',
    merchantIcon: 'attach_money',
    category: 'Income',
    amount: 2450.00,
    date: 'Jul 1, 2023'
  },
  {
    id: 4,
    merchantName: 'Netflix',
    merchantIcon: 'movie',
    category: 'Entertainment',
    amount: -14.99,
    date: 'Jun 30, 2023'
  },
  {
    id: 5,
    merchantName: 'Shell Gas Station',
    merchantIcon: 'local_gas_station',
    category: 'Transportation',
    amount: -42.75,
    date: 'Jun 28, 2023'
  }
];

// Mock AI insights
export const mockAIInsights: AIInsight[] = [
  {
    id: 1,
    type: 'spending',
    title: 'Spending Insight',
    description: 'Your restaurant spending is 35% higher than last month. Consider setting a dining budget to save more.',
    icon: 'lightbulb',
    severity: 'warning',
    color: 'bg-primary-50 text-primary-500'
  },
  {
    id: 2,
    type: 'savings',
    title: 'Savings Opportunity',
    description: 'Moving $2000 from your checking to a high-yield savings account could earn you $120 more this year.',
    icon: 'trending_up',
    severity: 'info',
    color: 'bg-secondary-50 text-secondary-500'
  }
];

// Mock connected accounts
export const mockConnectedAccounts: ConnectedAccount[] = [
  {
    id: 1,
    accountName: 'Chase Checking',
    accountType: 'checking',
    accountNumber: '****4567',
    balance: 8942.50,
    institutionName: 'Chase Bank'
  },
  {
    id: 2,
    accountName: 'Chase Savings',
    accountType: 'savings',
    accountNumber: '****7890',
    balance: 15621.48,
    institutionName: 'Chase Bank'
  },
  {
    id: 3,
    accountName: 'Amex Platinum',
    accountType: 'credit',
    accountNumber: '****2345',
    balance: -1240.75,
    institutionName: 'American Express'
  }
];

// Mock credit score data
export const mockCreditScore: CreditScoreData = {
  score: 752,
  rating: 'Good',
  lastUpdated: 'Today',
  factors: [
    {
      name: 'Payment History',
      rating: 'Excellent',
      percentage: 98
    },
    {
      name: 'Credit Utilization',
      rating: 'Good',
      percentage: 72
    },
    {
      name: 'Length of History',
      rating: 'Fair',
      percentage: 60
    }
  ]
};

// Mock budget items
export const mockBudgets: BudgetItem[] = [
  {
    id: 1,
    category: 'Food & Dining',
    icon: 'restaurant',
    spent: 820,
    limit: 900,
    daysLeft: 21,
    color: 'bg-error-500'
  },
  {
    id: 2,
    category: 'Transportation',
    icon: 'directions_car',
    spent: 385,
    limit: 500,
    daysLeft: 21,
    color: 'bg-secondary-500'
  },
  {
    id: 3,
    category: 'Shopping',
    icon: 'shopping_bag',
    spent: 605,
    limit: 750,
    daysLeft: 21,
    color: 'bg-success-500'
  }
];
