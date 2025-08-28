import React, { useState } from 'react';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import TrialGate from '@/components/TrialGate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { UserProfile, ConnectedAccount } from '@/types';
import { PlaidLinkButton } from '@/components/PlaidLink';

// Removed all mock data imports - using real API data only

export default function Accounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for disconnect confirmation dialog
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [accountToDisconnect, setAccountToDisconnect] = useState<{ id: number; name: string } | null>(null);
  
  // State for account details dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ConnectedAccount | null>(null);
  

  
  // Get the user data
  const { data: userData } = useQuery({
    queryKey: ['/api/users/profile'],
  });
  
  // Get accounts data
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ['/api/accounts'],
  });

  // Get refresh status data
  const { data: refreshStatus } = useQuery({
    queryKey: ['/api/accounts/refresh-status'],
    refetchInterval: 30000, // Update every 30 seconds
  });
  
  // Check if this is demo mode
  const isDemoMode = !userData;
  
  // New users should have access by default (don't show trial gates on first login)
  const hasDefaultAccess = userData && (!(userData as any)?.hasSeenPaywall);
  
  // Only use real user data - no mock fallbacks
  const user = userData;
  const accounts = accountsData || [];
  
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

  // Format date/time for display
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate time until next refresh
  const getTimeUntilRefresh = (nextRefreshTime: string | null) => {
    if (!nextRefreshTime) return null;
    const next = new Date(nextRefreshTime).getTime();
    const now = Date.now();
    const diff = next - now;
    
    if (diff <= 0) return 'Available now';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  // Disconnect account mutation
  const disconnectAccountMutation = useMutation({
    mutationFn: async (accountId: number) => {
      return await apiRequest('DELETE', `/api/accounts/${accountId}`, null);
    },
    onSuccess: async () => {
      // Small delay to ensure database cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refresh all financial data after account disconnection
      queryClient.refetchQueries({ queryKey: ['/api/accounts'] });
      queryClient.refetchQueries({ queryKey: ['/api/financial-overview'] });
      queryClient.refetchQueries({ queryKey: ['/api/transactions'] });
      queryClient.refetchQueries({ queryKey: ['/api/spending-trends'] });
      queryClient.refetchQueries({ queryKey: ['/api/savings-goals'] });
      queryClient.refetchQueries({ queryKey: ['/api/budgets'] });
      
      toast({
        title: "Account Disconnected",
        description: "Your account has been successfully disconnected. All data has been updated.",
      });
      setDisconnectDialogOpen(false);
      setAccountToDisconnect(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect account. Please try again.",
        variant: "destructive",
      });
    },
  });



  // Transaction refresh mutation - gets latest transactions
  const refreshTransactionsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/plaid/refresh-transactions', { days: 7 });
    },
    onSuccess: async (response: any) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      queryClient.refetchQueries({ queryKey: ['/api/transactions'] });
      queryClient.refetchQueries({ queryKey: ['/api/financial-overview'] });
      toast({
        title: "Transactions Updated",
        description: `Added ${response.newTransactions} new transactions from the last 7 days.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to refresh transactions. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Full sync mutation - refreshes balances and syncs recent transactions
  const fullSyncMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/plaid/full-sync', { days: 7 });
    },
    onSuccess: async (response: any) => {
      // Small delay to ensure database update is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      // Force fresh data fetch instead of just invalidating cache
      queryClient.refetchQueries({ queryKey: ['/api/accounts'] });
      queryClient.refetchQueries({ queryKey: ['/api/transactions'] });
      queryClient.refetchQueries({ queryKey: ['/api/financial-overview'] });
      toast({
        title: "Sync Complete",
        description: `Updated ${response.updatedBalances} balances and added ${response.newTransactions} new transactions.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync account data. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Balance refresh mutation - only refreshes account balances
  const refreshBalancesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/plaid/refresh-balances', {});
    },
    onSuccess: async (response: any) => {
      // Small delay to ensure database update is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      // Force fresh data fetch instead of just invalidating cache
      queryClient.refetchQueries({ queryKey: ['/api/accounts'] });
      queryClient.refetchQueries({ queryKey: ['/api/financial-overview'] });
      toast({
        title: "Balances Updated",
        description: `Refreshed ${response.updatedAccounts} account balances.`,
      });
    },
    onError: (error: any) => {
      console.error('Balance refresh error:', error);
      
      // Handle rate limiting specifically
      if (error.status === 429) {
        toast({
          title: "Rate Limited",
          description: `Please wait ${error.remainingMinutes || 720} minutes before refreshing again to avoid excessive API charges.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Refresh Failed",
          description: error.message || "Failed to refresh balances. Please try again.",
          variant: "destructive",
        });
      }
    },
  });
  
  // Show account details
  const handleViewDetails = (accountId: number) => {
    const account = accounts.find((acc: ConnectedAccount) => acc.id === accountId);
    if (account) {
      setSelectedAccount(account);
      setDetailsDialogOpen(true);
    }
  };

  // Handle disconnect account - show confirmation dialog
  const handleDisconnectAccount = (accountId: number, accountName: string) => {
    setAccountToDisconnect({ id: accountId, name: accountName });
    setDisconnectDialogOpen(true);
  };

  // Confirm disconnect account
  const confirmDisconnectAccount = () => {
    if (accountToDisconnect) {
      disconnectAccountMutation.mutate(accountToDisconnect.id);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1 overflow-x-hidden pb-16">
        <BottomNavigation user={user as any} />
        <TopNav title="Accounts" />
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Connected Accounts</h1>
              <p className="text-neutral-500">Manage your linked financial accounts</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
              <TrialGate feature="Bank Connection" hasStartedTrial={(user as any)?.hasStartedTrial || (user as any)?.isPremium || isDemoMode || hasDefaultAccess}>
                <PlaidLinkButton 
                  className="flex items-center bg-black text-white border border-gray-300 hover:bg-gray-800 shadow-md btn-animate card-hover"
                  onSuccess={() => {
                    toast({
                      title: "Account connected successfully!",
                      description: "Your new account has been added and is syncing.",
                      variant: "default",
                    });
                    // Refresh accounts data
                    queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
                  }}
                >
                  <span className="material-icons text-sm mr-1">add</span>
                  Connect Account
                </PlaidLinkButton>
              </TrialGate>
              
              <Button 
                variant="outline" 
                onClick={() => refreshTransactionsMutation.mutate()}
                disabled={refreshTransactionsMutation.isPending || fullSyncMutation.isPending}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-none hover:from-green-700 hover:to-emerald-700"
              >
                {refreshTransactionsMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2">receipt</span>
                    Refresh Transactions
                  </>
                )}
              </Button>

              <Button 
                variant="outline" 
                onClick={() => fullSyncMutation.mutate()}
                disabled={fullSyncMutation.isPending || refreshBalancesMutation.isPending || refreshTransactionsMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none hover:from-purple-700 hover:to-blue-700"
              >
                {fullSyncMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Syncing All...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2">sync</span>
                    Sync All Accounts
                  </>
                )}
              </Button>
              

            </div>
          </div>

          {/* Balance Refresh Status Card */}
          {refreshStatus && refreshStatus.hasPlaidAccounts && (
            <Card className="mb-6 border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <span className="material-icons text-blue-600 text-lg">schedule</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Balance Refresh Status</h3>
                      <p className="text-sm text-gray-600">
                        Last updated: {formatDateTime(refreshStatus.lastBalanceUpdate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {refreshStatus.canRefresh ? (
                      <div className="flex items-center text-green-600">
                        <span className="material-icons text-sm mr-1">check_circle</span>
                        <span className="text-sm font-medium">Available now</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-600">
                        <span className="material-icons text-sm mr-1">access_time</span>
                        <span className="text-sm font-medium">
                          Available in {getTimeUntilRefresh(refreshStatus.nextRefreshAllowed)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {!refreshStatus.automaticRefreshStatus.enabled && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-start space-x-2">
                      <span className="material-icons text-amber-600 text-sm mt-0.5">info</span>
                      <div>
                        <p className="text-sm text-amber-800 font-medium">
                          Automatic updates disabled
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          {refreshStatus.automaticRefreshStatus.disabledReason}. 
                          Manual refreshes available every 12 hours to control API costs.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          <TrialGate feature="Account Management" hasStartedTrial={(user as any)?.hasStartedTrial || (user as any)?.isPremium || isDemoMode}>
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
              {(accounts as any)?.map((account: ConnectedAccount) => {
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
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs" 
                          onClick={() => refreshBalancesMutation.mutate()}
                          disabled={refreshBalancesMutation.isPending}
                        >
                          {refreshBalancesMutation.isPending ? (
                            <>
                              <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full mr-1" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <span className="material-icons text-sm mr-1">sync</span>
                              Refresh
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => handleViewDetails(account.id)}>
                          <span className="material-icons text-sm mr-1">more_horiz</span>
                          Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" 
                          onClick={() => handleDisconnectAccount(account.id, account.accountName)}
                        >
                          <span className="material-icons text-sm mr-1">link_off</span>
                          Disconnect
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

      {/* Disconnect Account Confirmation Dialog */}
      <Dialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-700">
              <span className="material-icons mr-2 text-red-500">warning</span>
              Disconnect Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect "{accountToDisconnect?.name}"? This will remove the account and all associated transaction data from your profile.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="material-icons text-yellow-600 mr-3 mt-0.5">info</span>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">What happens when you disconnect:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Account will be removed from your dashboard</li>
                    <li>Transaction history will be cleared</li>
                    <li>Budget and insights will be updated</li>
                    <li>You can reconnect this account anytime</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDisconnectDialogOpen(false)}
              disabled={disconnectAccountMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDisconnectAccount}
              disabled={disconnectAccountMutation.isPending}
            >
              {disconnectAccountMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <span className="material-icons mr-2 text-sm">link_off</span>
                  Disconnect Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="material-icons mr-2 text-primary">account_balance</span>
              Account Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedAccount && (
            <div className="space-y-4">
              {/* Account Header */}
              <div className="flex items-center p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
                <div className={`w-12 h-12 ${accountTypes[selectedAccount.accountType as keyof typeof accountTypes]?.color || 'bg-primary-50 text-primary-500'} rounded-lg flex items-center justify-center mr-4`}>
                  <span className="material-icons text-lg">
                    {accountTypes[selectedAccount.accountType as keyof typeof accountTypes]?.icon || 'account_balance'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedAccount.accountName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedAccount.institutionName}</p>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-muted-foreground">Account Number</span>
                  <span className="text-sm font-mono">{selectedAccount.accountNumber}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-muted-foreground">Account Type</span>
                  <span className="text-sm capitalize">{selectedAccount.accountType}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-muted-foreground">Current Balance</span>
                  <span className="text-sm font-semibold">{formatCurrency(selectedAccount.balance)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-muted-foreground">Institution</span>
                  <span className="text-sm">{selectedAccount.institutionName}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-muted-foreground">Connection Status</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-600">Connected</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-muted-foreground mb-3">Quick Actions</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      refreshBalancesMutation.mutate();
                    }}
                  >
                    <span className="material-icons text-sm mr-1">sync</span>
                    Refresh Balance
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      handleDisconnectAccount(selectedAccount.id, selectedAccount.accountName);
                    }}
                  >
                    <span className="material-icons text-sm mr-1">link_off</span>
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}
