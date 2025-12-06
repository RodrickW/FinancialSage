import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Transaction } from '@/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>(transactions);
  
  // Function to load all transactions when "View All" is clicked
  const loadAllTransactions = async () => {
    try {
      const response = await fetch('/api/transactions?limit=100', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllTransactions(data);
      } else {
        console.error('Failed to load all transactions');
        // If API fails, use the existing transactions
        setAllTransactions(transactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // If API fails, use the existing transactions
      setAllTransactions(transactions);
    }
  };
  
  // Filter transactions based on search query
  const filteredTransactions = allTransactions.filter(transaction => 
    transaction.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
    <>
      <Card className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <Button 
            variant="link" 
            onClick={() => {
              loadAllTransactions();
              setIsDialogOpen(true);
            }}
            className="text-sm text-primary-500 hover:text-primary-600 p-0 h-auto"
          >
            View All
          </Button>
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
      
      {/* "View All Transactions" Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Transactions</DialogTitle>
            <DialogDescription>
              View and search all your transactions
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Search by merchant name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />
            
            <div className="space-y-4 mt-2">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-neutral-100">
                    <div className="flex items-center">
                      <div className={`${getIconBackgroundColor(transaction.category)} p-2 rounded-lg mr-3`}>
                        <span className="material-icons">{transaction.merchantIcon}</span>
                      </div>
                      <div>
                        <p className="font-medium">{transaction.merchantName}</p>
                        <p className="text-xs text-neutral-500">{transaction.date} • {transaction.category}</p>
                        {transaction.description && (
                          <p className="text-xs text-neutral-400 mt-1">{transaction.description}</p>
                        )}
                      </div>
                    </div>
                    <p className={`font-medium tabular-nums ${transaction.amount < 0 ? 'text-error-500' : 'text-success-500'}`}>
                      {transaction.amount < 0 ? '' : '+'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  No transactions found matching your search.
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}