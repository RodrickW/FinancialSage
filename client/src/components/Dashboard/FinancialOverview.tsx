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
  
  // Get today's date formatted
  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  
  // Get current week date range
  const getWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek); // Start from Sunday
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Saturday
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    };
    
    return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
  };
  
  const weekRange = getWeekRange();
  
  // Get current month name
  const currentMonth = today.toLocaleDateString('en-US', { 
    month: 'long' 
  });
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Daily Spending Card */}
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-red-100 hover:shadow-xl transform transition-all duration-300 hover:-translate-y-2 hover:scale-105">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-red-700 font-semibold flex items-center">
              <span className="text-lg mr-2">💳</span>
              Daily Spending
            </p>
            <h3 className="text-3xl font-bold text-red-900 tabular-nums mt-1">{formatCurrency(data.dailySpending || 0)}</h3>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">💳</span>
          </div>
        </div>
        {/* Progress bar for daily spending */}
        <div className="mb-3">
          <div className="w-full bg-red-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-500" style={{width: `${Math.min((data.dailySpending || 0) / 100, 1) * 100}%`}}></div>
          </div>
        </div>
        <div className="flex items-center text-sm">
          <span className="inline-block bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
            {todayFormatted}
          </span>
          <span className="text-red-700 ml-2 font-medium">spent today</span>
        </div>
      </Card>
      
      {/* Weekly Spending Card */}
      <Card className="bg-gradient-to-br from-emerald-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-emerald-100 hover:shadow-xl transform transition-all duration-300 hover:-translate-y-2 hover:scale-105">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-emerald-800 font-semibold flex items-center">
              <span className="text-lg mr-2">📅</span>
              Weekly Spending
            </p>
            <h3 className="text-3xl font-bold text-blue-900 tabular-nums mt-1">{formatCurrency(data.weeklySpending || data.monthlySpending * 0.25)}</h3>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">📅</span>
          </div>
        </div>
        {/* Circular progress for weekly spending */}
        <div className="mb-3 flex justify-center">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-emerald-200" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
              <path className="text-emerald-500" strokeWidth="3" strokeDasharray={`${Math.min(((data.weeklySpending || data.monthlySpending * 0.25) / (data.monthlySpending || 1000)) * 100, 100)}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-800">{Math.round(((data.weeklySpending || data.monthlySpending * 0.25) / (data.monthlySpending || 1000)) * 100)}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center text-sm">
          <span className="inline-block bg-gradient-to-r from-emerald-500 to-indigo-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
            {weekRange}
          </span>
          <span className="text-emerald-800 ml-2 font-medium">current week</span>
        </div>
      </Card>
      
      {/* Monthly Spending Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg border border-green-100 hover:shadow-xl transform transition-all duration-300 hover:-translate-y-2 hover:scale-105">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-green-700 font-semibold flex items-center">
              <span className="text-lg mr-2">📈</span>
              Monthly Spending
            </p>
            <h3 className="text-3xl font-bold text-green-900 tabular-nums mt-1">{formatCurrency(data.monthlySpending)}</h3>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">📈</span>
          </div>
        </div>
        {/* Progress bar with trend indicator */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-green-700 mb-1">
            <span>vs Last Month</span>
            <span className={spendingChange <= 0 ? 'text-green-600' : 'text-red-500'}>
              {spendingChange <= 0 ? '↓' : '↑'} {Math.abs(spendingChange).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all duration-500 ${spendingChange <= 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{width: `${Math.min(75 + (spendingChange * 2), 100)}%`}}></div>
          </div>
        </div>
        <div className="flex items-center text-sm">
          <span className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
            {currentMonth}
          </span>
          <span className="text-green-700 ml-2 font-medium">spending trend</span>
        </div>
      </Card>
      
      {/* Total Balance Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transform transition-all duration-300 hover:-translate-y-2 hover:scale-105">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-purple-700 font-semibold flex items-center">
              <span className="text-lg mr-2">💵</span>
              Total Balance
            </p>
            <h3 className="text-3xl font-bold text-purple-900 tabular-nums mt-1">{formatCurrency(data.totalBalance)}</h3>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">💵</span>
          </div>
        </div>
        {/* Semi-circular progress for balance growth */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-purple-700 mb-1">
            <span>Balance Growth</span>
            <span className={balanceChange >= 0 ? 'text-green-600' : 'text-red-500'}>
              {balanceChange >= 0 ? '↑ +' : '↓ '}{Math.abs(balanceChange).toFixed(1)}%
            </span>
          </div>
          <div className="relative">
            <div className="w-full bg-purple-200 rounded-full h-3">
              <div className={`h-3 rounded-full transition-all duration-700 ${balanceChange >= 0 ? 'bg-gradient-to-r from-purple-500 to-violet-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{width: `${Math.min(Math.max(50 + balanceChange * 5, 10), 100)}%`}}></div>
            </div>
          </div>
        </div>
        <div className="flex items-center text-sm">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium shadow-sm ${balanceChange >= 0 ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white' : 'bg-gradient-to-r from-red-400 to-red-500 text-white'}`}>
            {balanceChange >= 0 ? 'Growing' : 'Declining'}
          </span>
          <span className="text-purple-700 ml-2 font-medium">from last month</span>
        </div>
      </Card>
    </div>
  );
}
