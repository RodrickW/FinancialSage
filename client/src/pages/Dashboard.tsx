import { useEffect, useState } from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import BottomNavigation from '@/components/BottomNavigation';
import FinancialOverview from '@/components/Dashboard/FinancialOverview';
import SpendingTrends from '@/components/Dashboard/SpendingTrends';
import RecentTransactions from '@/components/Dashboard/RecentTransactions';
import { 
  FinancialOverviewSkeleton, 
  TransactionsSkeleton, 
  CreditScoreSkeleton,
  BudgetProgressSkeleton
} from '@/components/LoadingStates';
import OnboardingTour from '@/components/OnboardingTour';

import ConnectedAccounts from '@/components/Dashboard/ConnectedAccounts';
import BudgetProgress from '@/components/Dashboard/BudgetProgress';
import SavingsGoalCard from '@/components/Dashboard/SavingsGoalCard';
import IncomeSpendingReport from '@/components/Dashboard/IncomeSpendingReport';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PlaidBankOptions, PlaidLinkButton } from '@/components/PlaidLink';
import TrialNotificationBanner from '@/components/TrialNotificationBanner';
import { UserProfile, FinancialOverviewData } from '@/types';
import { Link } from 'wouter';

// Import mock data for demo mode only (not for logged-in users)
import { 
  mockUserProfile, 
  mockFinancialOverview,
  mockSpendingCategories,
  mockMonthlySpending,
  mockTransactions,
  mockAIInsights,
  mockConnectedAccounts,
  mockBudgets
} from '@/lib/utils/mockData';

export default function Dashboard() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState('');
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Format the current date
  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));
  }, []);
  
  // Get the user data from the backend
  const { data: userData, isLoading: userLoading, error: userError } = useQuery<any>({
    queryKey: ['/api/users/profile']
  });

  // Check if user is new and should see onboarding
  useEffect(() => {
    if (userData && !userLoading) {
      // Check from database instead of localStorage
      if (!userData.hasSeenTour) {
        setTimeout(() => setShowOnboarding(true), 1000);
      }
    }
  }, [userData, userLoading]);
  
  // Get the financial overview data
  const { data: financialData, isLoading: financialLoading, error: financialError } = useQuery<any>({
    queryKey: ['/api/financial-overview']
  });
  
  // Handle connect account
  const handleConnectAccount = () => {
    toast({
      title: "Connect Bank Account",
      description: "This feature would normally open Plaid's Link interface.",
      variant: "default",
    });
  };
  
  // Handle export data
  const handleExportData = () => {
    toast({
      title: "Export Initiated",
      description: "Your financial data export will be ready shortly.",
      variant: "default",
    });
  };

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    try {
      await fetch('/api/users/complete-onboarding', {
        method: 'POST',
        credentials: 'include'
      });
      setShowOnboarding(false);
      toast({
        title: "Welcome aboard!",
        description: "You're all set to start managing your finances.",
      });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const handleOnboardingSkip = async () => {
    try {
      await fetch('/api/users/complete-onboarding', {
        method: 'POST',
        credentials: 'include'
      });
      setShowOnboarding(false);
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  };
  
  // Check if this is demo mode (no real user data)
  const isDemoMode = !userData;
  
  // For demo mode, use mock data. For real users, use API data
  const user: UserProfile = userData || mockUserProfile;
  const financialOverview: FinancialOverviewData = financialData || mockFinancialOverview;
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopNav title="Mind My Money" />
      
      <main className="flex-1 overflow-x-hidden pb-16 page-transition">
        <BottomNavigation user={user} />
        
        <div className="p-6 fade-in">
          {/* Welcome and Date Section */}
          <div className="rounded-xl bg-white border border-gray-200 text-black p-6 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold text-black">
                  Welcome back, {user?.firstName || 'Demo User'}!
                </h1>
                <p className="text-gray-600 flex items-center mt-1">
                  <span className="material-icons text-gray-500 text-sm mr-1">today</span>
                  {currentDate}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <PlaidLinkButton 
                  className="flex items-center bg-black text-white border border-gray-300 hover:bg-gray-800 shadow-md btn-animate card-hover"
                  data-tour="connect-account"
                  onSuccess={() => {
                    toast({
                      title: "Account connected",
                      description: "Your account has been successfully connected.",
                    });
                  }}
                >
                  <span className="material-icons text-sm mr-1">add</span>
                  Connect Account
                </PlaidLinkButton>
                
                <Link href="/accounts">
                  <Button variant="outline" className="flex items-center border-gray-300 text-gray-600 hover:bg-gray-50 shadow-md btn-animate card-hover">
                    <span className="material-icons text-sm mr-1">account_balance_wallet</span>
                    View Accounts
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Demo Mode Banner */}
          {isDemoMode && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg mb-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">👋 You're viewing a demo</h3>
                  <p className="text-sm opacity-90">This shows sample data. Sign up to connect your real accounts.</p>
                </div>
                <Link href="/register">
                  <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                    Sign Up Now
                  </Button>
                </Link>
              </div>
            </div>
          )}
          
          {/* Trial Notification Banner (only for real users) */}
          {!isDemoMode && <TrialNotificationBanner />}
          
          {/* Financial Overview Cards */}
          <div data-tour="financial-overview">
            {financialLoading ? (
              <FinancialOverviewSkeleton />
            ) : (
              <FinancialOverview data={financialOverview} />
            )}
          </div>
          
          {/* Income vs Spending Report */}
          <div className="mb-6">
            <IncomeSpendingReport />
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 slide-up">
            {/* Left Column - Spending Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              {/* Monthly Spending Trends */}
              <div className="stagger-item" data-tour="spending-trends">
                <SpendingTrends 
                  spendingData={isDemoMode ? mockMonthlySpending : []}
                  categories={isDemoMode ? mockSpendingCategories : []}
                />
              </div>
              
              {/* Recent Transactions */}
              <div className="stagger-item" data-tour="transactions">
                <RecentTransactions transactions={isDemoMode ? mockTransactions : []} />
              </div>
            </div>
            
            {/* Right Column - Accounts & Financial Info */}
            <div className="space-y-6">
              {/* Savings Goals */}
              <div className="stagger-item">
                <SavingsGoalCard />
              </div>
              
              {/* Connected Accounts */}
              <div className="stagger-item">
                <ConnectedAccounts accounts={isDemoMode ? mockConnectedAccounts : []} />
              </div>
            </div>
          </div>
          
          {/* Budget Progress Overview */}
          <BudgetProgress budgets={isDemoMode ? mockBudgets : []} />
        </div>
      </main>

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </div>
  );
}
