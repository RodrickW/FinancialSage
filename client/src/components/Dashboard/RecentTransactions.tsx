import { Card } from '@/components/ui/card';
import { Transaction } from '@/types';
import { Link } from 'wouter';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  const getIconBackgroundColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      'Coffee Shop': 'bg-primary-50 text-primary-500',
      'Groceries': 'bg-secondary-50 text-secondary-500',
      'Income': 'bg-accent-50 text-accent-500',
      'Entertainment': 'bg-error-50 text-error-500',
      'Transportation': 'bg-primary-50 text-primary-500'
    };
    
    return categoryColors[category] || 'bg-neutral-50 text-neutral-500';
  };
  
  return (
    <Card className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>
        <Link href="/transactions" className="text-sm text-primary-500 hover:text-primary-600">
          View All
        </Link>
      </div>
      
      <div className="space-y-4">
        {transactions.map((transaction, index) => (
          <div key={transaction.id} className={`flex items-center justify-between py-3 ${index < transactions.length - 1 ? 'border-b border-neutral-100' : ''}`}>
            <div className="flex items-center">
              <div className={`${getIconBackgroundColor(transaction.category)} p-2 rounded-lg mr-3`}>
                <span className="material-icons">{transaction.merchantIcon}</span>
              </div>
              <div>
                <p className="font-medium">{transaction.merchantName}</p>
                <p className="text-xs text-neutral-500">{transaction.date} • {transaction.category}</p>
              </div>
            </div>
            <p className={`font-medium tabular-nums ${transaction.amount < 0 ? 'text-error-500' : 'text-success-500'}`}>
              {transaction.amount < 0 ? '' : '+'}{formatCurrency(transaction.amount)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
