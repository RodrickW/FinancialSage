import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Calendar, Download, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

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
}

export default function IncomeSpendingReport() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('month');

  // Fetch income vs spending data
  const { data: reportData, isLoading } = useQuery<IncomeSpendingData>({
    queryKey: ['/api/reports/income-spending', selectedPeriod],
    retry: false,
  });

  // Removed mock data - using real API data only
  const placeholderData: IncomeSpendingData = {
    period: selectedPeriod,
    income: selectedPeriod === 'week' ? 1250 : 5200,
    spending: selectedPeriod === 'week' ? 987 : 3850,
    previousIncome: selectedPeriod === 'week' ? 1180 : 4950,
    previousSpending: selectedPeriod === 'week' ? 1045 : 4100,
    categories: [
      { name: 'Food & Dining', amount: selectedPeriod === 'week' ? 245 : 980, percentage: 25 },
      { name: 'Transportation', amount: selectedPeriod === 'week' ? 187 : 740, percentage: 19 },
      { name: 'Entertainment', amount: selectedPeriod === 'week' ? 156 : 620, percentage: 16 },
      { name: 'Shopping', amount: selectedPeriod === 'week' ? 134 : 535, percentage: 14 },
      { name: 'Bills & Utilities', amount: selectedPeriod === 'week' ? 125 : 500, percentage: 13 },
      { name: 'Other', amount: selectedPeriod === 'week' ? 140 : 475, percentage: 13 },
    ],
    transactions: [
      { id: 1, description: 'Salary Deposit', amount: selectedPeriod === 'week' ? 1250 : 5200, type: 'income', date: '2024-01-15', category: 'Salary' },
      { id: 2, description: 'Grocery Store', amount: -85, type: 'expense', date: '2024-01-14', category: 'Food & Dining' },
      { id: 3, description: 'Gas Station', amount: -45, type: 'expense', date: '2024-01-13', category: 'Transportation' },
      { id: 4, description: 'Netflix', amount: -15, type: 'expense', date: '2024-01-12', category: 'Entertainment' },
      { id: 5, description: 'Amazon Purchase', amount: -67, type: 'expense', date: '2024-01-11', category: 'Shopping' },
    ]
  };

  const data = reportData;
  const netIncome = data.income - data.spending;
  const previousNetIncome = data.previousIncome - data.previousSpending;
  const netIncomeChange = ((netIncome - previousNetIncome) / previousNetIncome) * 100;
  const spendingRatio = (data.spending / data.income) * 100;

  const handleExport = () => {
    const csvContent = [
      ['Type', 'Amount', 'Previous Period', 'Change'],
      ['Income', data.income.toFixed(2), data.previousIncome.toFixed(2), ((data.income - data.previousIncome) / data.previousIncome * 100).toFixed(1) + '%'],
      ['Spending', data.spending.toFixed(2), data.previousSpending.toFixed(2), ((data.spending - data.previousSpending) / data.previousSpending * 100).toFixed(1) + '%'],
      ['Net Income', netIncome.toFixed(2), previousNetIncome.toFixed(2), netIncomeChange.toFixed(1) + '%'],
      [''],
      ['Category Breakdown'],
      ...data.categories.map(cat => [cat.name, cat.amount.toFixed(2), cat.percentage.toFixed(1) + '%'])
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Income</p>
                <p className="text-2xl font-bold text-green-700">${data.income.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-xs text-green-600">
                {((data.income - data.previousIncome) / data.previousIncome * 100).toFixed(1)}% vs last {selectedPeriod}
              </span>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Total Spending</p>
                <p className="text-2xl font-bold text-red-700">${data.spending.toLocaleString()}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-xs text-red-600">
                {((data.spending - data.previousSpending) / data.previousSpending * 100).toFixed(1)}% vs last {selectedPeriod}
              </span>
            </div>
          </div>

          <div className={`${netIncome >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Income</p>
                <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  ${netIncome.toLocaleString()}
                </p>
              </div>
              {netIncome >= 0 ? (
                <TrendingUp className="w-8 h-8 text-blue-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-orange-600" />
              )}
            </div>
            <div className="flex items-center mt-2">
              <span className={`text-xs ${netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {netIncomeChange.toFixed(1)}% vs last {selectedPeriod}
              </span>
            </div>
          </div>
        </div>

        {/* Spending Ratio */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Spending Ratio</span>
            <Badge variant={spendingRatio > 80 ? 'destructive' : spendingRatio > 60 ? 'secondary' : 'default'}>
              {spendingRatio.toFixed(1)}% of income
            </Badge>
          </div>
          <Progress value={spendingRatio} className="h-2" />
          <p className="text-xs text-gray-500">
            {spendingRatio > 80 ? 'High spending ratio - consider reducing expenses' : 
             spendingRatio > 60 ? 'Moderate spending ratio' : 
             'Good spending ratio - healthy savings potential'}
          </p>
        </div>

        {/* Category Breakdown */}
        <div>
          <h4 className="font-medium mb-3">Spending by Category</h4>
          <div className="space-y-3">
            {data.categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm text-gray-600">${category.amount.toLocaleString()}</span>
                  </div>
                  <Progress value={category.percentage} className="h-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h4 className="font-medium mb-3">Recent Transactions</h4>
          <div className="space-y-2">
            {data.transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium">{transaction.description}</p>
                  <p className="text-xs text-gray-500">{transaction.category} • {transaction.date}</p>
                </div>
                <span className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'income' ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}