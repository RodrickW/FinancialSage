import { FinancialOverviewData } from '@/types';
import { TrendingDown, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface FinancialOverviewProps {
  data: FinancialOverviewData;
}

export default function FinancialOverview({ data }: FinancialOverviewProps) {
  const balanceChange = data.previousMonthBalance 
    ? ((data.totalBalance - data.previousMonthBalance) / data.previousMonthBalance) * 100
    : 0;
  
  const spendingChange = data.previousMonthSpending
    ? ((data.monthlySpending - data.previousMonthSpending) / data.previousMonthSpending) * 100
    : 0;
    
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const formatCurrencyDetailed = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const getWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
  };
  
  const currentMonth = today.toLocaleDateString('en-US', { month: 'long' });

  const metrics = [
    {
      label: 'Today',
      sublabel: todayFormatted,
      value: formatCurrencyDetailed(data.dailySpending || 0),
      accent: 'text-gray-900',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      icon: <TrendingDown className="w-4 h-4" />,
    },
    {
      label: 'This Week',
      sublabel: getWeekRange(),
      value: formatCurrencyDetailed(data.weeklySpending || data.monthlySpending * 0.25),
      accent: 'text-gray-900',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      icon: <TrendingDown className="w-4 h-4" />,
      percentage: Math.round(((data.weeklySpending || data.monthlySpending * 0.25) / (data.monthlySpending || 1000)) * 100),
    },
    {
      label: currentMonth,
      sublabel: spendingChange !== 0 ? `${spendingChange > 0 ? '+' : ''}${spendingChange.toFixed(1)}% vs last month` : 'Monthly total',
      value: formatCurrencyDetailed(data.monthlySpending),
      accent: 'text-gray-900',
      iconBg: spendingChange <= 0 ? 'bg-emerald-50' : 'bg-red-50',
      iconColor: spendingChange <= 0 ? 'text-emerald-500' : 'text-red-500',
      icon: spendingChange <= 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />,
      changePositive: spendingChange <= 0,
    },
    {
      label: 'Total Balance',
      sublabel: balanceChange !== 0 ? `${balanceChange >= 0 ? '+' : ''}${balanceChange.toFixed(1)}% growth` : 'All accounts',
      value: formatCurrency(data.totalBalance),
      accent: 'text-gray-900',
      iconBg: balanceChange >= 0 ? 'bg-emerald-50' : 'bg-red-50',
      iconColor: balanceChange >= 0 ? 'text-emerald-500' : 'text-red-500',
      icon: balanceChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />,
      changePositive: balanceChange >= 0,
      large: true,
    },
  ];
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {metrics.map((metric, index) => (
        <div 
          key={index} 
          className="metric-card stagger-item group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{metric.label}</span>
            <div className={`w-7 h-7 rounded-lg ${metric.iconBg} flex items-center justify-center ${metric.iconColor}`}>
              {metric.icon}
            </div>
          </div>
          <div className={`text-xl md:text-2xl font-bold ${metric.accent} tabular-nums tracking-tight`}>
            {metric.value}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">{metric.sublabel}</p>
        </div>
      ))}
    </div>
  );
}
