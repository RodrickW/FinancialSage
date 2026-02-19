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
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { PlaidLinkButton } from '@/components/PlaidLink';
import { UserProfile, FinancialOverviewData, Transaction } from '@/types';
import { Link } from 'wouter';
import { Sparkles, Target, MessageCircle, TrendingUp, Lock, Plus, Wallet, Brain, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));
  }, []);
  
  const { data: userData, isLoading: userLoading, error: userError } = useQuery<any>({
    queryKey: ['/api/users/profile']
  });

  useEffect(() => {
    if (userData && !userLoading) {
      const tourShownThisSession = sessionStorage.getItem('tourShownThisSession');
      if (tourShownThisSession) return;
      const tourViews = userData.tourViewCount || 0;
      if (tourViews < 2) {
        sessionStorage.setItem('tourShownThisSession', 'true');
        setTimeout(() => setShowOnboarding(true), 1000);
      }
    }
  }, [userData, userLoading]);
  
  const { data: financialData, isLoading: financialLoading } = useQuery<any>({
    queryKey: ['/api/financial-overview']
  });

  const refreshTransactionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/plaid/refresh-transactions', {});
      return response.json();
    },
    onSuccess: (data) => {
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
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to refresh transactions. Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleOnboardingComplete = async () => {
    try {
      await fetch('/api/users/complete-onboarding', { method: 'POST', credentials: 'include' });
      setShowOnboarding(false);
      toast({ title: "Welcome aboard!", description: "Let's connect your bank account to get started with real insights." });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const handleOnboardingSkip = async () => {
    try {
      await fetch('/api/users/complete-onboarding', { method: 'POST', credentials: 'include' });
      setShowOnboarding(false);
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  };
  
  const isDemoMode = !userData;
  const currentTier = (userData?.subscriptionTier as 'free' | 'plus' | 'pro') || 'free';
  const hasLegacyAccess = userData?.hasStartedTrial || userData?.isPremium;
  const user: UserProfile = userData;
  const financialOverview: FinancialOverviewData = financialData || {
    totalBalance: 0, previousMonthBalance: 0, monthlySpending: 0, previousMonthSpending: 0,
    weeklySpending: 0, dailySpending: 0, creditScore: 0,
    savingsProgress: { current: 0, target: 0, name: 'Set a savings goal' }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <TopNav title="Mind My Money" />
      
      <main className="flex-1 overflow-x-hidden pb-20">
        <BottomNavigation user={user} />
        
        <div className="max-w-5xl mx-auto px-4 py-6 fade-in">
          {/* Welcome Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{currentDate}</p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-6">
            <PlaidLinkButton 
              className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              data-tour="connect-account"
              onSuccess={() => {
                toast({ title: "Account connected successfully!", description: "Let's set up your financial profile with our AI coach." });
                setTimeout(() => { window.location.href = '/coach?onboarding=true'; }, 2000);
              }}
            >
              <Plus className="w-4 h-4" />
              Connect Account
            </PlaidLinkButton>
            
            <Link href="/accounts">
              <Button variant="outline" size="sm" className="gap-1.5 text-sm font-medium border-gray-200 text-gray-700 hover:bg-gray-50">
                <Wallet className="w-4 h-4" />
                Accounts
              </Button>
            </Link>

            <TrialGate feature="AI Financial Coach" currentTier={currentTier} requiredTier="plus" hasStartedTrial={hasLegacyAccess || isDemoMode}>
              <Link href="/coach?onboarding=true" data-tour="money-mind-interview">
                <Button variant="outline" size="sm" className="gap-1.5 text-sm font-medium border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                  <Brain className="w-4 h-4" />
                  Money Mind
                </Button>
              </Link>
            </TrialGate>
          </div>
          
          {/* Demo Mode Banner */}
          {isDemoMode && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-2xl mb-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">You're viewing a demo</h3>
                  <p className="text-sm text-emerald-100 mt-0.5">Sign up to connect your real accounts.</p>
                </div>
                <Link href="/register">
                  <Button size="sm" className="bg-white text-emerald-700 hover:bg-emerald-50 font-medium shadow-sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          )}
          
          {/* Faith Mode */}
          {!isDemoMode && user && (
            <div className="mb-4" data-tour="faith-mode">
              <FaithModeToggle />
            </div>
          )}
          
          {/* Premium Features */}
          {!isDemoMode && user && (hasLegacyAccess || currentTier !== 'free') && (
            <div className="space-y-4 mb-6">
              <div data-tour="daily-checkin">
                <DailyCheckinCard />
              </div>
              <div data-tour="money-reset">
                <MoneyResetBanner />
              </div>
              <div data-tour="ai-coach">
                <AIInsights user={user} />
              </div>
            </div>
          )}
          
          {isDemoMode && user && (
            <div className="mb-6" data-tour="ai-coach">
              <AIInsights user={user} />
            </div>
          )}

          {/* Financial Overview */}
          <div data-tour="financial-overview">
            {financialLoading ? (
              <FinancialOverviewSkeleton />
            ) : (
              <FinancialOverview data={financialOverview} />
            )}
          </div>
          
          {/* Upgrade Card */}
          {!isDemoMode && user && !hasLegacyAccess && currentTier === 'free' && (
            <div className="mt-6 section-card overflow-hidden">
              <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Unlock Your Full Potential</h3>
                    <p className="text-emerald-100 text-sm">AI coaching & tools to transform your finances</p>
                  </div>
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                {/* Plus Plan */}
                <div className="border border-emerald-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Plus</span>
                      <span className="text-sm text-gray-500">Most Popular</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">$5.99<span className="text-sm font-normal text-gray-400">/mo</span></span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: MessageCircle, text: 'AI Coach (20/mo)' },
                      { icon: Sparkles, text: 'AI Interview' },
                      { icon: Target, text: '30-Day Reset' },
                      { icon: TrendingUp, text: 'AI Budget' },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro Plan */}
                <div className="border border-purple-100 bg-purple-50/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase">Pro</span>
                    <span className="text-lg font-bold text-gray-900">$9.99<span className="text-sm font-normal text-gray-400">/mo</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                    <span>Everything in Plus + Unlimited AI coaching</span>
                  </div>
                </div>
                
                <Link href="/pricing">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 rounded-xl shadow-sm">
                    View Plans
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                
                <p className="text-[11px] text-center text-gray-400">
                  Cancel anytime &middot; Save with annual plans
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <OnboardingTour
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </div>
  );
}
