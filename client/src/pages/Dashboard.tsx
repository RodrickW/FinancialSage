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
import DailyCheckinCard from '@/components/Dashboard/DailyCheckinCard';
import MoneyResetBanner from '@/components/Dashboard/MoneyResetBanner';
import FaithModeToggle from '@/components/FaithModeToggle';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PlaidBankOptions, PlaidLinkButton } from '@/components/PlaidLink';
import { UserProfile, FinancialOverviewData, Transaction } from '@/types';
import { Link } from 'wouter';
import { Sparkles, Target, MessageCircle, TrendingUp, Lock } from 'lucide-react';

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

  // Check if user should see onboarding tour (show once per session for first 2 logins)
  useEffect(() => {
    if (userData && !userLoading) {
      // Check if tour was already shown this session
      const tourShownThisSession = sessionStorage.getItem('tourShownThisSession');
      if (tourShownThisSession) {
        return; // Already shown this session, don't show again
      }
      
      // Show tour if user has viewed it less than 2 times
      const tourViews = userData.tourViewCount || 0;
      const shouldShowTour = tourViews < 2;
      if (shouldShowTour) {
        sessionStorage.setItem('tourShownThisSession', 'true');
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
  
  // Get the user's subscription tier
  const currentTier = (userData?.subscriptionTier as 'free' | 'plus' | 'pro') || 'free';
  
  // Legacy access check for backwards compatibility
  const hasLegacyAccess = userData?.hasStartedTrial || userData?.isPremium;
  
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
                {/* Bank Connection - Available to all tiers */}
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
                
                {/* View Accounts - Available to all tiers */}
                <Link href="/accounts">
                  <Button variant="outline" className="flex items-center border-gray-300 text-gray-600 hover:bg-gray-50 shadow-md btn-animate card-hover">
                    <span className="material-icons text-sm mr-1">account_balance_wallet</span>
                    View Accounts
                  </Button>
                </Link>

                {/* Money Mind Interview Button - Requires Plus tier */}
                <TrialGate feature="AI Financial Coach" currentTier={currentTier} requiredTier="plus" hasStartedTrial={hasLegacyAccess || isDemoMode}>
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
          
          
          {/* Faith Mode Toggle */}
          {!isDemoMode && user && (
            <div className="mb-6" data-tour="faith-mode">
              <FaithModeToggle />
            </div>
          )}
          
          {/* Premium features - only show if user has access */}
          {!isDemoMode && user && (hasLegacyAccess || currentTier !== 'free') && (
            <>
              {/* Daily Check-In Card */}
              <div data-tour="daily-checkin">
                <DailyCheckinCard />
              </div>
              
              {/* 30-Day Money Reset Banner */}
              <div data-tour="money-reset">
                <MoneyResetBanner />
              </div>
              
              {/* Proactive AI Insights */}
              <div className="mb-6" data-tour="ai-coach">
                <AIInsights user={user} />
              </div>
            </>
          )}
          
          {/* Demo mode AI Insights */}
          {isDemoMode && user && (
            <div className="mb-6" data-tour="ai-coach">
              <AIInsights user={user} />
            </div>
          )}

          {/* Financial Overview Cards - Available to all tiers */}
          <div data-tour="financial-overview">
            {financialLoading ? (
              <FinancialOverviewSkeleton />
            ) : (
              <FinancialOverview data={financialOverview} />
            )}
          </div>
          
          {/* Consolidated Upgrade Card - Show only for free users without legacy access */}
          {!isDemoMode && user && !hasLegacyAccess && currentTier === 'free' && (
            <div className="mt-6">
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-gray-900">
                    Unlock Your Financial Transformation
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    Get personalized AI coaching and powerful tools to transform your money mindset
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Plus Features */}
                  <div className="bg-white rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-emerald-800 text-lg">Plus Plan</h3>
                      <span className="text-emerald-700 font-bold">$5.99/mo</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>AI Coach (20 msgs/month)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>AI Financial Interview</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-600" />
                        <span>30-Day Money Reset</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span>AI-Generated Budget</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Pro Features */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-purple-800 text-lg">Pro Plan</h3>
                      <span className="text-purple-700 font-bold">$9.99/mo</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p className="mb-2">Everything in Plus, plus:</p>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>Unlimited AI Coach messages</span>
                      </div>
                    </div>
                  </div>
                  
                  <Link href="/pricing">
                    <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 text-lg">
                      View Plans & Upgrade
                    </Button>
                  </Link>
                  
                  <p className="text-xs text-center text-gray-500">
                    Instant access • Cancel anytime • Save with annual plans
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          
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
