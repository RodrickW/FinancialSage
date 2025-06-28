import React from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import BottomNavigation from '@/components/BottomNavigation';
import TrialGate from '@/components/TrialGate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { UserProfile, ConnectedAccount } from '@/types';

// Import mock data for demo mode only
import { mockUserProfile, mockConnectedAccounts } from '@/lib/utils/mockData';

export default function Accounts() {
  const { toast } = useToast();
  
  // Get the user data
  const { data: userData } = useQuery({
    queryKey: ['/api/users/profile'],
  });
  
  // Get accounts data
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ['/api/accounts'],
  });
  
  // Check if this is demo mode
  const isDemoMode = !userData;
  
  // For demo mode, use mock data. For real users, use API data
  const user = userData || mockUserProfile;
  const accounts = accountsData || (isDemoMode ? mockConnectedAccounts : []);
  
  const accountTypes = {
    checking: { icon: 'account_balance', color: 'bg-primary-50 text-primary-500' },
    savings: { icon: 'savings', color: 'bg-secondary-50 text-secondary-500' },
    credit: { icon: 'credit_card', color: 'bg-error-50 text-error-500' },
    investment: { icon: 'trending_up', color: 'bg-accent-50 text-accent-500' },
  };
  
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Handle refresh account action
  const handleRefreshAccount = () => {
    toast({
      title: "Account refreshed",
      description: "Account information has been refreshed."
    });
  };
  
  // Show account details
  const handleViewDetails = (accountId: number) => {
    toast({
      title: "View account details",
      description: `Viewing details for account #${accountId}`
    });
  };
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      <Sidebar user={user} />
      
      <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
        <BottomNavigation user={user} />
        <TopNav title="Accounts" />
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Connected Accounts</h1>
              <p className="text-neutral-500">Manage your linked financial accounts</p>
            </div>
          </div>
          
          <TrialGate feature="Account Management" hasStartedTrial={user?.hasStartedTrial || isDemoMode}>
            {accountsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white rounded-xl shadow-sm">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-neutral-200 rounded-lg mr-4"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                          <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-neutral-200 rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-neutral-200 rounded w-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((account: ConnectedAccount) => {
                const accountType = accountTypes[account.accountType as keyof typeof accountTypes] || accountTypes.checking;
                
                return (
                  <Card key={account.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className={`w-10 h-10 ${accountType.color} rounded-lg flex items-center justify-center mr-4`}>
                          <span className="material-icons">{accountType.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{account.accountName}</h3>
                          <p className="text-sm text-neutral-500">{account.institutionName} • {account.accountNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-baseline">
                        <span className="text-xl font-bold tabular-nums mr-2">
                          {formatCurrency(account.balance)}
                        </span>
                        <span className="text-sm text-neutral-500">
                          {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}
                        </span>
                      </div>
                      <div className="mt-4 flex">
                        <Button variant="outline" size="sm" className="text-xs mr-2" onClick={handleRefreshAccount}>
                          <span className="material-icons text-sm mr-1">sync</span>
                          Refresh
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => handleViewDetails(account.id)}>
                          <span className="material-icons text-sm mr-1">more_horiz</span>
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            )}
          </TrialGate>
        </div>
      </main>
    </div>
  );
}
