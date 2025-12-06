import { useEffect, useState } from 'react';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import SpendingTrends from '@/components/Dashboard/SpendingTrends';
import RecentTransactions from '@/components/Dashboard/RecentTransactions';
import IncomeSpendingReport from '@/components/Dashboard/IncomeSpendingReport';
import { TransactionsSkeleton } from '@/components/LoadingStates';
import TrialGate from '@/components/TrialGate';
import { useQuery } from '@tanstack/react-query';
import { UserProfile } from '@/types';

export default function Analytics() {
  const { data: userData, isLoading: userLoading } = useQuery<any>({
    queryKey: ['/api/users/profile']
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
  });

  const { data: spendingTrendsData, isLoading: spendingTrendsLoading } = useQuery({
    queryKey: ['/api/spending-trends'],
    retry: false,
  });

  const isDemoMode = !userData;
  const hasDefaultAccess = userData && (!(userData as any)?.hasSeenPaywall);
  const user: UserProfile = userData;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopNav title="Analytics" />
      
      <main className="flex-1 overflow-x-hidden pb-16 page-transition">
        <BottomNavigation user={user} />
        
        <div className="p-6 fade-in">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-black">Spending Analytics</h1>
            <p className="text-gray-600">Track your spending trends and transactions</p>
          </div>

          <div className="mb-6">
            <IncomeSpendingReport />
          </div>

          <div className="mb-6" data-testid="spending-trends-section">
            <TrialGate feature="Spending Analysis" hasStartedTrial={user?.hasStartedTrial || user?.isPremium || isDemoMode || hasDefaultAccess}>
              {spendingTrendsLoading ? (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded mb-4"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="text-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded mb-1"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <SpendingTrends 
                  spendingData={(spendingTrendsData as any)?.spendingData || []}
                  categories={(spendingTrendsData as any)?.categories || []}
                />
              )}
            </TrialGate>
          </div>

          <div className="mb-6" data-testid="transactions-section">
            <TrialGate feature="Transaction History" hasStartedTrial={user?.hasStartedTrial || user?.isPremium || isDemoMode || hasDefaultAccess}>
              {transactionsLoading ? (
                <TransactionsSkeleton />
              ) : (
                <RecentTransactions transactions={recentTransactions || []} />
              )}
            </TrialGate>
          </div>
        </div>
      </main>
    </div>
  );
}
