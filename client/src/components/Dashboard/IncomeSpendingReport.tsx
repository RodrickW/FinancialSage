import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Download, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface IncomeSpendingData {
  period: 'week' | 'month';
  income: number;
  spending: number;
  previousIncome: number;
  previousSpending: number;
  categories: {
    name: string;
    amount: number;
    percentage: number;
  }[];
  transactions: {
    id: number;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
    category: string;
  }[];
  hasAnalysis: boolean;
}

export default function IncomeSpendingReport() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('month');

  // Fetch income vs spending data
  const { data: reportData, isLoading } = useQuery<IncomeSpendingData>({
    queryKey: ['/api/reports/income-spending', selectedPeriod],
    retry: false,
  });

  // If no data yet, don't show anything
  if (!reportData) {
    return null;
  }

  const netIncome = reportData.income - reportData.spending;
  const previousNetIncome = reportData.previousIncome - reportData.previousSpending;
  const netIncomeChange = ((netIncome - previousNetIncome) / previousNetIncome) * 100;
  const spendingRatio = (reportData.spending / reportData.income) * 100;

  const handleExport = () => {
    const csvContent = [
      ['Type', 'Amount', 'Previous Period', 'Change'],
      ['Income', reportData.income.toFixed(2), reportData.previousIncome.toFixed(2), ((reportData.income - reportData.previousIncome) / reportData.previousIncome * 100).toFixed(1) + '%'],
      ['Spending', reportData.spending.toFixed(2), reportData.previousSpending.toFixed(2), ((reportData.spending - reportData.previousSpending) / reportData.previousSpending * 100).toFixed(1) + '%'],
      ['Net Income', netIncome.toFixed(2), previousNetIncome.toFixed(2), netIncomeChange.toFixed(1) + '%'],
      [''],
      ['Category Breakdown'],
      ...reportData.categories.map((cat: any) => [cat.name, cat.amount.toFixed(2), cat.percentage.toFixed(1) + '%'])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-spending-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income vs Spending Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Income vs Spending Report
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border">
              <Button
                variant={selectedPeriod === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPeriod('week')}
                className="rounded-r-none"
              >
                Week
              </Button>
              <Button
                variant={selectedPeriod === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPeriod('month')}
                className="rounded-l-none"
              >
                Month
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Spending by Category Pie Chart */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-2 text-lg">Spending by Category</h4>
          <p className="text-sm text-gray-500 mb-4">Where your money is going this {selectedPeriod}</p>
          
          {/* Show prompt if no analysis data exists */}
          {!reportData.hasAnalysis || reportData.categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Spending Analysis Yet</h3>
              <p className="text-gray-500 mb-4 max-w-sm mx-auto">
                Run "Analyze My Spending" on the Budget page to see your spending breakdown here.
              </p>
              <Button 
                onClick={() => window.location.href = '/budget'}
                className="bg-black text-white hover:bg-gray-800"
              >
                Go to Budget Page
              </Button>
            </div>
          ) : (
          <>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {reportData.categories.map((_, index) => {
                    const gradientColors = [
                      { start: '#3b82f6', end: '#1d4ed8' },
                      { start: '#8b5cf6', end: '#6d28d9' },
                      { start: '#ec4899', end: '#be185d' },
                      { start: '#f59e0b', end: '#d97706' },
                      { start: '#10b981', end: '#047857' },
                      { start: '#06b6d4', end: '#0891b2' },
                      { start: '#f43f5e', end: '#e11d48' },
                      { start: '#84cc16', end: '#65a30d' },
                    ];
                    const colors = gradientColors[index % gradientColors.length];
                    return (
                      <linearGradient key={`gradient-${index}`} id={`pieGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={colors.start} stopOpacity={1}/>
                        <stop offset="100%" stopColor={colors.end} stopOpacity={0.9}/>
                      </linearGradient>
                    );
                  })}
                </defs>
                <Pie
                  data={reportData.categories.map((cat, index) => ({
                    name: cat.name,
                    value: cat.amount,
                    percentage: cat.percentage
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {reportData.categories.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#pieGradient-${index})`}
                      style={{ filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))' }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '16px', 
                    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                    padding: '12px 16px'
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    <span className="font-bold text-gray-900">${value.toLocaleString()}</span>,
                    <span className="text-gray-600">{name}</span>
                  ]}
                  labelFormatter={() => ''}
                />
                <Legend 
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingLeft: '20px' }}
                  formatter={(value: string, entry: any) => (
                    <span className="text-sm text-gray-700">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-2xl font-bold text-gray-900">${reportData.spending.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Spending</p>
          </div>
          </>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 text-white shadow-lg shadow-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-100 text-sm font-medium">Income</span>
              <ArrowUpRight className="w-5 h-5 text-emerald-200" />
            </div>
            <p className="text-2xl font-bold">${reportData.income.toLocaleString()}</p>
            <p className="text-xs text-emerald-200 mt-1">
              {((reportData.income - reportData.previousIncome) / reportData.previousIncome * 100).toFixed(1)}% change
            </p>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-4 text-white shadow-lg shadow-rose-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-rose-100 text-sm font-medium">Spending</span>
              <ArrowDownRight className="w-5 h-5 text-rose-200" />
            </div>
            <p className="text-2xl font-bold">${reportData.spending.toLocaleString()}</p>
            <p className="text-xs text-rose-200 mt-1">
              {((reportData.spending - reportData.previousSpending) / reportData.previousSpending * 100).toFixed(1)}% change
            </p>
          </div>

          <div className={`${netIncome >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200' : 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-200'} rounded-2xl p-4 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Net</span>
              {netIncome >= 0 ? <TrendingUp className="w-5 h-5 text-white/60" /> : <TrendingDown className="w-5 h-5 text-white/60" />}
            </div>
            <p className="text-2xl font-bold">${Math.abs(netIncome).toLocaleString()}</p>
            <p className="text-xs text-white/60 mt-1">
              {netIncome >= 0 ? 'Saved this period' : 'Over budget'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-violet-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-violet-100 text-sm font-medium">Savings Rate</span>
              <DollarSign className="w-5 h-5 text-violet-200" />
            </div>
            <p className="text-2xl font-bold">{Math.max(0, 100 - spendingRatio).toFixed(0)}%</p>
            <p className="text-xs text-violet-200 mt-1">
              {spendingRatio > 80 ? 'Needs improvement' : spendingRatio > 60 ? 'Moderate' : 'Excellent'}
            </p>
          </div>
        </div>

        {/* Category Breakdown with Visual Bars */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 mb-4">Spending by Category</h4>
          <div className="space-y-4">
            {reportData.categories.slice(0, 5).map((category: any, index: number) => {
              const colors = ['from-blue-400 to-blue-600', 'from-purple-400 to-purple-600', 'from-pink-400 to-pink-600', 'from-amber-400 to-amber-600', 'from-teal-400 to-teal-600'];
              return (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{category.name}</span>
                    <span className="text-sm font-bold text-gray-900">${category.amount.toLocaleString()}</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{category.percentage.toFixed(1)}% of spending</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}