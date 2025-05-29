import { FinancialOverviewData } from '@/types';
import { Card } from '@/components/ui/card';

interface FinancialOverviewProps {
  data: FinancialOverviewData;
}

export default function FinancialOverview({ data }: FinancialOverviewProps) {
  // Calculate percentage changes
  const balanceChange = data.previousMonthBalance 
    ? ((data.totalBalance - data.previousMonthBalance) / data.previousMonthBalance) * 100
    : 0;
  
  const spendingChange = data.previousMonthSpending
    ? ((data.monthlySpending - data.previousMonthSpending) / data.previousMonthSpending) * 100
    : 0;
    
  const savingsPercentage = Math.round((data.savingsProgress.current / data.savingsProgress.target) * 100);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Balance Card */}
      <Card className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transform transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 font-medium flex items-center">
              <span className="material-icons text-xs mr-1">account_balance_wallet</span>
              Total Balance
            </p>
            <h3 className="text-2xl font-bold text-black tabular-nums mt-1">{formatCurrency(data.totalBalance)}</h3>
          </div>
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-inner">
            <span className="material-icons text-white">account_balance_wallet</span>
          </div>
        </div>
        <div className="flex items-center text-sm">
          <span className={`inline-block ${balanceChange >= 0 ? 'bg-black text-white' : 'bg-gray-600 text-white'} px-2 py-1 rounded-full text-xs font-medium shadow-sm`}>
            {balanceChange >= 0 ? '↑ +' : '↓ '}{balanceChange.toFixed(1)}%
          </span>
          <span className="text-gray-600 ml-2">from last month</span>
        </div>
      </Card>
      
      {/* Monthly Spending Card */}
      <Card className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transform transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 font-medium flex items-center">
              <span className="material-icons text-xs mr-1">payments</span>
              Monthly Spending
            </p>
            <h3 className="text-2xl font-bold text-black tabular-nums mt-1">{formatCurrency(data.monthlySpending)}</h3>
          </div>
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-inner">
            <span className="material-icons text-white">trending_down</span>
          </div>
        </div>
        <div className="flex items-center text-sm">
          <span className={`inline-block ${spendingChange <= 0 ? 'bg-black text-white' : 'bg-gray-600 text-white'} px-2 py-1 rounded-full text-xs font-medium shadow-sm`}>
            {spendingChange <= 0 ? '↓ ' : '↑ +'}{Math.abs(spendingChange).toFixed(1)}%
          </span>
          <span className="text-gray-600 ml-2">from last month</span>
        </div>
      </Card>
      
      {/* Daily Spending Card */}
      <Card className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transform transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 font-medium flex items-center">
              <span className="material-icons text-xs mr-1">today</span>
              Daily Spending
            </p>
            <h3 className="text-2xl font-bold text-black tabular-nums mt-1">{formatCurrency(data.dailySpending || data.monthlySpending / 30)}</h3>
          </div>
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-inner">
            <span className="material-icons text-white">today</span>
          </div>
        </div>
        <div className="flex items-center text-sm">
          <span className={`inline-block bg-black text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm`}>
            Today
          </span>
          <span className="text-gray-600 ml-2">average daily spend</span>
        </div>
      </Card>
      
      {/* Weekly Spending Card */}
      <Card className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transform transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 font-medium flex items-center">
              <span className="material-icons text-xs mr-1">date_range</span>
              Weekly Spending
            </p>
            <h3 className="text-2xl font-bold text-black tabular-nums mt-1">{formatCurrency(data.weeklySpending || data.monthlySpending * 0.25)}</h3>
          </div>
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-inner">
            <span className="material-icons text-white">date_range</span>
          </div>
        </div>
        <div className="flex items-center text-sm">
          <span className={`inline-block bg-black text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm`}>
            This week
          </span>
          <span className="text-gray-600 ml-2">7 days</span>
        </div>
      </Card>
    </div>
  );
}
