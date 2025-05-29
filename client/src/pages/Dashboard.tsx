import { useEffect, useState } from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import BottomNavigation from '@/components/BottomNavigation';
import FinancialOverview from '@/components/Dashboard/FinancialOverview';
import SpendingTrends from '@/components/Dashboard/SpendingTrends';
import RecentTransactions from '@/components/Dashboard/RecentTransactions';

import ConnectedAccounts from '@/components/Dashboard/ConnectedAccounts';
import CreditScore from '@/components/Dashboard/CreditScore';
import BudgetProgress from '@/components/Dashboard/BudgetProgress';
import SavingsGoalCard from '@/components/Dashboard/SavingsGoalCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PlaidBankOptions, PlaidLinkButton } from '@/components/PlaidLink';
import { UserProfile, FinancialOverviewData } from '@/types';

// Import mock data for development
import { 
  mockUserProfile, 
  mockFinancialOverview, 
  mockSpendingCategories, 
  mockMonthlySpending, 
  mockTransactions, 
  mockAIInsights, 
  mockConnectedAccounts, 
  mockCreditScore, 
  mockBudgets 
} from '@/lib/utils/mockData';

export default function Dashboard() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState('');
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  
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
  
  // Use user data from API or fallback to mock data
  const user: UserProfile = userData || mockUserProfile;
  
  // Use financial overview from API or fallback to mock data
  const financialOverview: FinancialOverviewData = financialData || mockFinancialOverview;
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopNav title="Mind My Money" />
      
      <main className="flex-1 overflow-x-hidden pb-16">
        <BottomNavigation user={user} />
        
        <div className="p-6">
          {/* Welcome and Date Section */}
          <div className="rounded-xl bg-white border border-gray-200 text-black p-6 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold text-black">
                  Welcome back, {user.firstName}!
                </h1>
                <p className="text-gray-600 flex items-center mt-1">
                  <span className="material-icons text-gray-500 text-sm mr-1">today</span>
                  {currentDate}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <PlaidLinkButton 
                  className="flex items-center bg-black text-white border border-gray-300 hover:bg-gray-800 shadow-md transition-all duration-200 hover:shadow-lg"
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
              </div>
            </div>
          </div>
          
          {/* Financial Overview Cards */}
          <FinancialOverview data={financialOverview} />
          
          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Spending Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              {/* Monthly Spending Trends */}
              <SpendingTrends 
                spendingData={mockMonthlySpending}
                categories={mockSpendingCategories}
              />
              
              {/* Recent Transactions */}
              <RecentTransactions transactions={mockTransactions} />
            </div>
            
            {/* Right Column - Accounts & Financial Info */}
            <div className="space-y-6">
              {/* Savings Goals */}
              <SavingsGoalCard />
              
              {/* Connected Accounts */}
              <ConnectedAccounts accounts={mockConnectedAccounts} />
              
              {/* Credit Score Overview */}
              <CreditScore data={mockCreditScore} />
            </div>
          </div>
          
          {/* Budget Progress Overview */}
          <BudgetProgress budgets={mockBudgets} />
        </div>
      </main>
    </div>
  );
}
