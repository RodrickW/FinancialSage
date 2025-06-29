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
    console.log('Connect Account button clicked');
    setIsLinking(true);
    try {
      console.log('About to call openPlaidLink');
      await openPlaidLink();
      console.log('openPlaidLink completed');
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

// Simple wrapper to use Plaid directly - no fake flows
interface PlaidBankOptionProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export function PlaidBankOptions({ onSuccess, onClose }: PlaidBankOptionProps) {
  const { openPlaidLink, isLoading } = usePlaidAuth(onSuccess);

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Connect Your Bank Account</h3>
      <p className="text-gray-600 text-sm">
        We use Plaid to securely connect to your bank accounts. Your login credentials are never stored or shared.
      </p>
      
      <PlaidLinkButton
        variant="default"
        className="w-full"
        onSuccess={onSuccess}
      >
        {isLoading ? 'Connecting...' : 'Connect Bank Account'}
      </PlaidLinkButton>
      
      <p className="text-xs text-center text-gray-500">
        Secured by bank-level encryption
      </p>
    </div>
  );
}