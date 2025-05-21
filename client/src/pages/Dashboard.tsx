import { useEffect, useState } from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import BottomNavigation from '@/components/BottomNavigation';
import FinancialOverview from '@/components/Dashboard/FinancialOverview';
import SpendingTrends from '@/components/Dashboard/SpendingTrends';
import RecentTransactions from '@/components/Dashboard/RecentTransactions';
import AIInsights from '@/components/Dashboard/AIInsights';
import ConnectedAccounts from '@/components/Dashboard/ConnectedAccounts';
import CreditScore from '@/components/Dashboard/CreditScore';
import BudgetProgress from '@/components/Dashboard/BudgetProgress';
import SavingsGoalCard from '@/components/Dashboard/SavingsGoalCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PlaidBankOptions, PlaidLinkButton } from '@/components/PlaidLink';

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
  const { data: userData, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['/api/users/profile'],
    onError: () => {
      // Fallback to mock data
      console.error('Failed to load user profile, using mock data instead');
    }
  });
  
  // Get the financial overview data
  const { data: financialData, isLoading: financialLoading, error: financialError } = useQuery({
    queryKey: ['/api/financial-overview'],
    onError: () => {
      // Fallback to mock data
      console.error('Failed to load financial overview, using mock data instead');
    }
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
  
  const user = userData || mockUserProfile;
  const financialOverview = financialData || mockFinancialOverview;
  
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <TopNav title="Mind My Money" />
      
      <main className="flex-1 overflow-x-hidden pb-16">
        <BottomNavigation user={user} />
        
        <div className="p-6">
          {/* Welcome and Date Section */}
          <div className="rounded-xl bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 p-6 mb-8 shadow-sm border border-green-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Welcome back, {user.firstName}!
                </h1>
                <p className="text-neutral-600 flex items-center mt-1">
                  <span className="material-icons text-emerald-400 text-sm mr-1">today</span>
                  {currentDate}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <PlaidLinkButton 
                  className="flex items-center bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md transition-all duration-200 hover:shadow-lg"
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
                <Button 
                  variant="outline"
                  className="flex items-center bg-white border border-green-200 hover:bg-green-50 transition-all duration-200"
                  onClick={handleExportData}
                >
                  <span className="material-icons text-sm mr-1">file_download</span>
                  Export
                </Button>
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
            
            {/* Right Column - AI Insights & Accounts */}
            <div className="space-y-6">
              {/* AI Financial Insights */}
              <AIInsights 
                insights={mockAIInsights}
                healthScore={{ score: 78, maxScore: 100, rating: 'Good' }}
              />
              
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
