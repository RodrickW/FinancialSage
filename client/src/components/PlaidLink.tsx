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
  const { openPlaidLink, isLoading } = usePlaidAuth();
  const [isLinking, setIsLinking] = useState(false);

  const handleClick = async () => {
    setIsLinking(true);
    await openPlaidLink();
    setIsLinking(false);
    if (onSuccess) onSuccess();
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
  const { openPlaidLink, isLoading } = usePlaidAuth();
  
  const popularBanks = [
    { name: 'Chase', logo: 'bank' },
    { name: 'Bank of America', logo: 'bank' },
    { name: 'Wells Fargo', logo: 'bank' },
    { name: 'Citi', logo: 'bank' },
    { name: 'Capital One', logo: 'bank' },
    { name: 'Other Banks', logo: 'search' }
  ];
  
  const handleBankClick = async () => {
    await openPlaidLink();
    if (onSuccess) onSuccess();
  };
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Select your bank</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {popularBanks.map((bank) => (
          <Button
            key={bank.name}
            variant="outline"
            className="flex items-center justify-start h-auto py-3 px-4"
            onClick={handleBankClick}
            disabled={isLoading}
          >
            <span className="material-icons mr-2 text-primary-500">{bank.logo}</span>
            <span className="text-sm">{bank.name}</span>
            {bank.name === 'Other Banks' && <span className="material-icons ml-auto text-sm">chevron_right</span>}
          </Button>
        ))}
      </div>
      
      {isLoading && (
        <div className="flex items-center justify-center my-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="ml-2">Connecting to bank...</p>
        </div>
      )}
    </div>
  );
}