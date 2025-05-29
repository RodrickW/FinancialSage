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
      
      {/* Credit Score Card */}
      <Card className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transform transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm text-gray-600 font-medium flex items-center">
              <span className="material-icons text-xs mr-1">credit_score</span>
              Credit Score
            </p>
            <h3 className="text-2xl font-bold text-black tabular-nums mt-1">{data.creditScore}</h3>
          </div>
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-inner">
            <span className="material-icons text-white">credit_score</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mt-2 overflow-hidden shadow-inner">
          <div className="bg-black h-3 rounded-full transition-all duration-500 shadow-sm" style={{ width: `${(data.creditScore / 850) * 100}%` }}></div>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2 font-medium">
          <span>Poor</span>
          <span>Fair</span>
          <span>Good</span>
          <span>Excellent</span>
        </div>
      </Card>
      
      {/* Savings Goal Card */}
      <Card className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-xl p-6 shadow-md border-t border-l border-amber-200 hover:shadow-lg transform transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm text-amber-600 font-medium flex items-center">
              <span className="material-icons text-xs mr-1">savings</span>
              Savings Goal
            </p>
            <h3 className="text-xl font-bold text-amber-900 tabular-nums mt-1">
              {formatCurrency(data.savingsProgress.current)} <span className="text-sm opacity-70">of</span> {formatCurrency(data.savingsProgress.target)}
            </h3>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-inner">
            <span className="material-icons text-white">savings</span>
          </div>
        </div>
        <div className="w-full bg-amber-200 bg-opacity-40 rounded-full h-3 mt-2 overflow-hidden shadow-inner">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full transition-all duration-500 shadow-sm" style={{ width: `${savingsPercentage}%` }}></div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-amber-700">{data.savingsProgress.name}</span>
          <span className="text-sm font-medium bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">{savingsPercentage}% complete</span>
        </div>
      </Card>
    </div>
  );
}
