import { Button } from '@/components/ui/button';
import { usePlaidAuth } from '@/hooks/use-plaid';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PlaidLinkButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function PlaidLinkButton({
  variant = 'default',
  className,
  children,
  onSuccess,
}: PlaidLinkButtonProps) {
  const { openPlaidLink, isLoading } = usePlaidAuth(onSuccess);
  const [isLinking, setIsLinking] = useState(false);

  const handleClick = async () => {
    setIsLinking(true);
    try {
      await openPlaidLink();
      // onSuccess will be called by the Plaid hook's exchangePublicToken function
      // after a real successful connection, not here
    } catch (error) {
      console.error('Plaid Link error:', error);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleClick}
      disabled={isLoading || isLinking}
    >
      {isLoading || isLinking ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        children || 'Connect Account'
      )}
    </Button>
  );
}

// A more detailed component that displays banks
interface PlaidBankOptionProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export function PlaidBankOptions({ onSuccess, onClose }: PlaidBankOptionProps) {
  const [step, setStep] = useState<'select-bank' | 'login' | 'accounts' | 'success'>('select-bank');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const popularBanks = [
    { name: 'Chase', logo: '🏦' },
    { name: 'Bank of America', logo: '🏦' },
    { name: 'Wells Fargo', logo: '🏦' },
    { name: 'Citi', logo: '🏦' },
    { name: 'Capital One', logo: '🏦' },
    { name: 'Other Banks', logo: '🔍' }
  ];
  
  const handleBankClick = (bankName: string) => {
    setSelectedBank(bankName);
    setStep('login');
  };
  
  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setStep('accounts');
      setIsLoading(false);
    }, 1500);
  };
  
  const handleAccountSelection = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call your backend API
      // which would then exchange the public token with Plaid
      const response = await fetch('/api/plaid/mock-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bankName: selectedBank,
        }),
      });
      
      setStep('success');
      
      // Wait a moment before closing and triggering success
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
      
    } catch (error) {
      console.error('Error connecting bank account:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (step === 'select-bank') {
    return (
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Select your bank</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
          {popularBanks.map((bank) => (
            <Button
              key={bank.name}
              variant="outline"
              className="flex items-center justify-start h-auto py-3 px-4 w-full"
              onClick={() => handleBankClick(bank.name)}
            >
              <span className="mr-2 text-primary-500">{bank.logo}</span>
              <span className="text-sm">{bank.name}</span>
              {bank.name === 'Other Banks' && <span className="ml-auto text-sm">→</span>}
            </Button>
          ))}
        </div>
      </div>
    );
  }
  
  if (step === 'login') {
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-auto" 
            onClick={() => setStep('select-bank')}
          >
            ← Back
          </Button>
          <h3 className="font-medium text-lg ml-2">Log in to {selectedBank}</h3>
        </div>
        
        <form onSubmit={handleSubmitCredentials} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username (use 'user_good')"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input 
              type="password" 
              className="w-full p-2 border border-gray-300 rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (use 'pass_good')"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Continue'
            )}
          </Button>
          
          <p className="text-xs text-center text-gray-500">
            This is a sandbox environment. Use username 'user_good' and password 'pass_good'.
          </p>
        </form>
      </div>
    );
  }
  
  if (step === 'accounts') {
    const mockAccounts = [
      { id: 1, name: 'Checking', type: 'checking', mask: '1234', balance: 2543.21 },
      { id: 2, name: 'Savings', type: 'savings', mask: '5678', balance: 12750.83 },
      { id: 3, name: 'Credit Card', type: 'credit', mask: '9012', balance: -430.15 }
    ];
    
    return (
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Select accounts to connect</h3>
        
        <div className="space-y-2">
          {mockAccounts.map(account => (
            <div 
              key={account.id} 
              className="p-3 border border-gray-200 rounded-md flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{account.name}</p>
                <p className="text-xs text-gray-500">••••{account.mask}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">${Math.abs(account.balance).toFixed(2)}</p>
                <p className="text-xs text-gray-500">{account.type}</p>
              </div>
            </div>
          ))}
        </div>
        
        <Button 
          onClick={handleAccountSelection}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting accounts...
            </>
          ) : (
            'Connect Accounts'
          )}
        </Button>
      </div>
    );
  }
  
  if (step === 'success') {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium">Account Connected!</h3>
        <p className="text-gray-500">Your {selectedBank} accounts have been successfully connected.</p>
      </div>
    );
  }
  
  return null;
}