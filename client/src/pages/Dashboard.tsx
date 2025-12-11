import { useEffect, useState } from 'react';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import FinancialOverview from '@/components/Dashboard/FinancialOverview';
import AIInsights from '@/components/Dashboard/AIInsights';
import { 
  FinancialOverviewSkeleton
} from '@/components/LoadingStates';
import OnboardingTour from '@/components/OnboardingTour';
import TrialGate from '@/components/TrialGate';
import { TrialStatus } from '@/components/TrialStatus';
import DailyCheckinCard from '@/components/Dashboard/DailyCheckinCard';
import MoneyResetBanner from '@/components/Dashboard/MoneyResetBanner';
import FaithModeToggle from '@/components/FaithModeToggle';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PlaidBankOptions, PlaidLinkButton } from '@/components/PlaidLink';
import TrialNotificationBanner from '@/components/TrialNotificationBanner';
import { UserProfile, FinancialOverviewData, Transaction } from '@/types';
import { Link } from 'wouter';

// Removed all mock data imports - using real API data only

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  // Check if user is new and should see onboarding (only on first two logins)
  useEffect(() => {
    if (userData && !userLoading) {
      // Show tour only on first two logins and if they haven't seen it yet
      const shouldShowTour = !userData.hasSeenTour && (userData.loginCount || 0) <= 2;
      if (shouldShowTour) {
        setTimeout(() => setShowOnboarding(true), 1000);
      }
    }
  }, [userData, userLoading]);
  
  // Get the financial overview data
  const { data: financialData, isLoading: financialLoading, error: financialError } = useQuery<any>({
    queryKey: ['/api/financial-overview']
  });

  // Transaction refresh mutation
  const refreshTransactionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/plaid/refresh-transactions', {});
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate all financial data to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/financial-overview'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/spending-trends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
      
      toast({
        title: "Transactions Updated!",
        description: data.newTransactions > 0 
          ? `Added ${data.newTransactions} new transactions from the last 7 days`
          : "All transactions are up to date",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: "Failed to refresh transactions. Please try again later.",
        variant: "destructive",
      });
    },
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
      
      // Show toast encouraging bank connection
      toast({
        title: "Welcome aboard!",
        description: "Let's connect your bank account to get started with real insights.",
      });
      
      // After a brief delay, open the add account dialog if no accounts are connected
      setTimeout(() => {
        setAddAccountOpen(true);
      }, 1500);
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
  
  // Check if this is demo mode (only for anonymous marketing preview)
  const isDemoMode = !userData;
  
  // New users should have access by default (don't show trial gates on first login)
  const hasDefaultAccess = userData && (!(userData as any)?.hasSeenPaywall);
  
  // For real users, only use actual API data - no fake data
  const user: UserProfile = userData;
  const financialOverview: FinancialOverviewData = financialData || {
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
  };
  
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
                <TrialGate feature="Bank Connection" hasStartedTrial={user?.hasStartedTrial || user?.isPremium || isDemoMode || hasDefaultAccess}>
                  <PlaidLinkButton 
                    className="flex items-center bg-black text-white border border-gray-300 hover:bg-gray-800 shadow-md btn-animate card-hover"
                    data-tour="connect-account"
                    onSuccess={() => {
                      toast({
                        title: "Account connected successfully!",
                        description: "Let's set up your financial profile with our AI coach.",
                      });
                      
                      // Redirect to AI coach for initial interview after brief delay
                      setTimeout(() => {
                        window.location.href = '/coach?onboarding=true';
                      }, 2000);
                    }}
                  >
                    <span className="material-icons text-sm mr-1">add</span>
                    Connect Account
                  </PlaidLinkButton>
                </TrialGate>
                
                <TrialGate feature="Account Management" hasStartedTrial={user?.hasStartedTrial || user?.isPremium || isDemoMode || hasDefaultAccess}>
                  <Link href="/accounts">
                    <Button variant="outline" className="flex items-center border-gray-300 text-gray-600 hover:bg-gray-50 shadow-md btn-animate card-hover">
                      <span className="material-icons text-sm mr-1">account_balance_wallet</span>
                      View Accounts
                    </Button>
                  </Link>
                </TrialGate>
                

                {/* Money Mind Interview Button */}
                <TrialGate feature="AI Financial Coach" hasStartedTrial={user?.hasStartedTrial || user?.isPremium || isDemoMode || hasDefaultAccess}>
                  <Link href="/coach?onboarding=true" data-tour="money-mind-interview">
                    <Button variant="outline" className="flex items-center border-green-300 text-green-600 hover:bg-green-50 shadow-md btn-animate card-hover">
                      <span className="material-icons text-sm mr-1">psychology</span>
                      Money Mind Interview
                    </Button>
                  </Link>
                </TrialGate>
              </div>
            </div>
          </div>
          

          
          {/* Demo Mode Banner */}
          {isDemoMode && (
            <div className="bg-gradient-to-r from-emerald-500 to-purple-600 text-white p-4 rounded-lg mb-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">👋 You're viewing a demo</h3>
                  <p className="text-sm opacity-90">This shows sample data. Sign up to connect your real accounts.</p>
                </div>
                <Link href="/register">
                  <Button variant="secondary" className="bg-white text-emerald-700 hover:bg-gray-100">
                    Sign Up Now
                  </Button>
                </Link>
              </div>
            </div>
          )}
          
          {/* Trial Notification Banner (only for real users) */}
          {!isDemoMode && <TrialNotificationBanner />}
          
          {/* Trial Status Component */}
          {!isDemoMode && <TrialStatus />}
          
          {/* Faith Mode Toggle */}
          {!isDemoMode && user && (
            <div className="mb-6" data-tour="faith-mode">
              <FaithModeToggle />
            </div>
          )}
          
          {/* Daily Check-In Card */}
          {!isDemoMode && user && (
            <div data-tour="daily-checkin">
              <TrialGate feature="Daily Check-In" hasStartedTrial={user?.hasStartedTrial || user?.isPremium || hasDefaultAccess}>
                <DailyCheckinCard />
              </TrialGate>
            </div>
          )}
          
          {/* 30-Day Money Reset Banner */}
          {!isDemoMode && user && (
            <div data-tour="money-reset">
              <TrialGate feature="30-Day Money Reset" hasStartedTrial={user?.hasStartedTrial || user?.isPremium || hasDefaultAccess}>
                <MoneyResetBanner />
              </TrialGate>
            </div>
          )}
          
          {/* Proactive AI Insights */}
          {user && (
            <div className="mb-6" data-tour="ai-coach">
              <TrialGate feature="AI Financial Insights" hasStartedTrial={user?.hasStartedTrial || user?.isPremium || isDemoMode || hasDefaultAccess}>
                <AIInsights user={user} />
              </TrialGate>
            </div>
          )}

          {/* Financial Overview Cards */}
          <div data-tour="financial-overview">
            <TrialGate feature="Financial Analytics" hasStartedTrial={user?.hasStartedTrial || user?.isPremium || isDemoMode || hasDefaultAccess}>
              {financialLoading ? (
                <FinancialOverviewSkeleton />
              ) : (
                <FinancialOverview data={financialOverview} />
              )}
            </TrialGate>
          </div>
          
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
