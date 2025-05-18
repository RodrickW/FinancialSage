import { Card } from '@/components/ui/card';
import { BudgetItem } from '@/types';

interface BudgetProgressProps {
  budgets: BudgetItem[];
}

export default function BudgetProgress({ budgets }: BudgetProgressProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const calculatePercentage = (spent: number, limit: number) => {
    return Math.round((spent / limit) * 100);
  };
  
  return (
    <Card className="bg-white rounded-xl p-6 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Budget Progress</h3>
        <button className="text-sm flex items-center text-primary-500">
          <span className="material-icons text-sm mr-1">edit</span>
          Edit Budgets
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {budgets.map((budget) => {
          const percentage = calculatePercentage(budget.spent, budget.limit);
          
          return (
            <div key={budget.id} className="border border-neutral-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="material-icons text-primary-500 mr-2">{budget.icon}</span>
                  <h4 className="font-medium">{budget.category}</h4>
                </div>
                <span className="text-xs text-neutral-500">{budget.daysLeft} days left</span>
              </div>
              
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-2xl font-bold tabular-nums">
                  {formatCurrency(budget.spent)}
                  <span className="text-sm text-neutral-500 font-normal">/{formatCurrency(budget.limit)}</span>
                </p>
                <span className={`text-sm ${
                  percentage > 90 ? 'text-error-500' : 
                  percentage > 75 ? 'text-secondary-500' : 
                  'text-success-500'
                }`}>
                  {percentage}%
                </span>
              </div>
              
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div 
                  className={`${budget.color} h-2 rounded-full transition-all duration-500`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
