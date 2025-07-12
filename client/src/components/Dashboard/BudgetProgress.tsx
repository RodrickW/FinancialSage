import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Edit, TrendingUp, ArrowRight, DollarSign } from 'lucide-react';

interface BudgetCategory {
  id: number;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  icon: string;
}

export default function BudgetProgress() {
  // Fetch real budget data from API
  const { data: budgetData, isLoading: budgetLoading } = useQuery<BudgetCategory[]>({
    queryKey: ['/api/budgets'],
    retry: false,
  });
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const calculatePercentage = (spent: number, amount: number) => {
    if (amount === 0) return 0;
    return Math.min(Math.round((spent / amount) * 100), 100);
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'food': '🍽️',
      'transportation': '🚗',
      'entertainment': '🎬',
      'shopping': '🛍️',
      'utilities': '💡',
      'healthcare': '🏥',
      'travel': '✈️',
      'education': '📚',
      'groceries': '🛒',
      'dining': '🍽️',
      'gas': '⛽',
      'insurance': '🛡️',
      'rent': '🏠',
      'mortgage': '🏡',
      'savings': '💰',
      'investments': '📈',
      'charity': '💝',
      'clothing': '👔',
      'personal': '👤',
      'pets': '🐕',
      'gym': '🏋️',
      'subscriptions': '📱',
      'other': '📦'
    };
    return icons[category.toLowerCase()] || '📊';
  };

  // Calculate totals for summary
  const totalBudget = budgetData?.reduce((sum, cat) => sum + cat.amount, 0) || 0;
  const totalSpent = budgetData?.reduce((sum, cat) => sum + cat.spent, 0) || 0;
  const totalRemaining = totalBudget - totalSpent;

  // Get top 3 categories for display
  const topCategories = budgetData?.slice(0, 3) || [];
  
  if (budgetLoading) {
    return (
      <Card className="bg-white rounded-xl p-6 shadow-sm mt-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl p-6 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold">Budget Progress</h3>
          <span className="ml-2 text-sm text-gray-500">
            {budgetData?.length || 0} categories
          </span>
        </div>
        <Link href="/budget">
          <Button variant="outline" size="sm" className="flex items-center text-primary-600 hover:bg-primary-50">
            <Edit className="w-4 h-4 mr-1" />
            Edit Budget
          </Button>
        </Link>
      </div>
      
      {/* Budget Summary */}
      {totalBudget > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudget)}</div>
            <div className="text-sm text-gray-500">Total Budget</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</div>
            <div className="text-sm text-gray-500">Total Spent</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(totalRemaining))}
            </div>
            <div className="text-sm text-gray-500">
              {totalRemaining >= 0 ? 'Remaining' : 'Over Budget'}
            </div>
          </div>
        </div>
      )}
      
      {/* Categories */}
      {budgetData && budgetData.length > 0 ? (
        <div className="space-y-4">
          {topCategories.map((category) => {
            const percentage = calculatePercentage(category.spent, category.amount);
            const isOverBudget = category.spent > category.amount;
            
            return (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-xl mr-3">{getCategoryIcon(category.category)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">{category.category}</h4>
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold text-red-600">${category.spent.toFixed(2)}</span>
                        <span className="text-gray-400"> of </span>
                        <span className="text-gray-600">${category.amount.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                      {percentage}%
                    </span>
                    <div className={`text-sm ${category.remaining >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {category.remaining >= 0 ? 'Left: ' : 'Over: '}
                      ${Math.abs(category.remaining).toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isOverBudget ? 'bg-red-500' : 
                      percentage > 75 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
          
          {budgetData.length > 3 && (
            <Link href="/budget">
              <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <span className="text-gray-600 mr-2">View all {budgetData.length} categories</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Budget Set</h4>
          <p className="text-gray-500 mb-4">Connect your accounts and let our AI create a personalized budget for you.</p>
          <Link href="/budget">
            <Button className="bg-primary-600 hover:bg-primary-700">
              <TrendingUp className="w-4 h-4 mr-2" />
              Create Budget
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
