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
      <Card className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-neutral-500 font-medium">Total Balance</p>
            <h3 className="text-2xl font-bold tabular-nums mt-1">{formatCurrency(data.totalBalance)}</h3>
          </div>
          <span className="material-icons bg-primary-50 text-primary-500 p-2 rounded-lg">account_balance_wallet</span>
        </div>
        <div className="flex items-center text-sm">
          <span className={`inline-block ${balanceChange >= 0 ? 'bg-success-500 text-white' : 'bg-error-500 text-white'} px-2 py-0.5 rounded text-xs font-medium`}>
            {balanceChange >= 0 ? '+' : ''}{balanceChange.toFixed(1)}%
          </span>
          <span className="text-neutral-500 ml-2">from last month</span>
        </div>
      </Card>
      
      {/* Monthly Spending Card */}
      <Card className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-neutral-500 font-medium">Monthly Spending</p>
            <h3 className="text-2xl font-bold tabular-nums mt-1">{formatCurrency(data.monthlySpending)}</h3>
          </div>
          <span className="material-icons bg-error-500 text-white p-2 rounded-lg">trending_down</span>
        </div>
        <div className="flex items-center text-sm">
          <span className={`inline-block ${spendingChange <= 0 ? 'bg-success-500 text-white' : 'bg-error-500 text-white'} px-2 py-0.5 rounded text-xs font-medium`}>
            {spendingChange >= 0 ? '+' : ''}{spendingChange.toFixed(1)}%
          </span>
          <span className="text-neutral-500 ml-2">from last month</span>
        </div>
      </Card>
      
      {/* Credit Score Card */}
      <Card className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm text-neutral-500 font-medium">Credit Score</p>
            <h3 className="text-2xl font-bold tabular-nums mt-1">{data.creditScore}</h3>
          </div>
          <span className="material-icons bg-secondary-50 text-secondary-500 p-2 rounded-lg">credit_score</span>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-2.5 mt-2">
          <div className="bg-gradient-to-r from-secondary-500 to-primary-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(data.creditScore / 850) * 100}%` }}></div>
        </div>
        <div className="flex justify-between text-xs text-neutral-500 mt-1">
          <span>Poor</span>
          <span>Fair</span>
          <span>Good</span>
          <span>Excellent</span>
        </div>
      </Card>
      
      {/* Savings Goal Card */}
      <Card className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm text-neutral-500 font-medium">Savings Goal</p>
            <h3 className="text-2xl font-bold tabular-nums mt-1">
              {formatCurrency(data.savingsProgress.current)} / {formatCurrency(data.savingsProgress.target)}
            </h3>
          </div>
          <span className="material-icons bg-accent-500 text-white p-2 rounded-lg">savings</span>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-2.5 mt-2">
          <div className="bg-accent-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${savingsPercentage}%` }}></div>
        </div>
        <div className="text-xs text-neutral-500 mt-1">
          <span>{data.savingsProgress.name}: {savingsPercentage}% complete</span>
        </div>
      </Card>
    </div>
  );
}
