import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import RecentTransactions from '@/components/Dashboard/RecentTransactions';
import IncomeSpendingReport from '@/components/Dashboard/IncomeSpendingReport';
import { TransactionsSkeleton } from '@/components/LoadingStates';
import TrialGate from '@/components/TrialGate';
import { useQuery } from '@tanstack/react-query';
import { UserProfile } from '@/types';

export default function Analytics() {
  const { data: userData } = useQuery<any>({
    queryKey: ['/api/users/profile']
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
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

          <div className="mb-6" data-testid="transactions-section">
            <TrialGate feature="Transaction History" hasStartedTrial={user?.hasStartedTrial || user?.isPremium || isDemoMode || hasDefaultAccess}>
              {transactionsLoading ? (
                <TransactionsSkeleton />
              ) : (
                <RecentTransactions transactions={(recentTransactions || []).slice(0, 7)} />
              )}
            </TrialGate>
          </div>
        </div>
      </main>
    </div>
  );
}
