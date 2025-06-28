import { Card } from '@/components/ui/card';
import { ConnectedAccount } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useState } from 'react';
import { PlaidLinkButton } from '@/components/PlaidLink';
import { useQueryClient } from '@tanstack/react-query';
import TrialGate from '@/components/TrialGate';

interface ConnectedAccountsProps {
  accounts: ConnectedAccount[];
}

export default function ConnectedAccounts({ accounts }: ConnectedAccountsProps) {
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  const getAccountLogoInitial = (institutionName: string) => {
    return institutionName.charAt(0).toUpperCase();
  };
  
  return (
    <Card className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Connected Accounts</h3>
        <button 
          className="text-sm text-primary-500 flex items-center"
          onClick={() => setAddAccountOpen(true)}
        >
          <span className="material-icons text-sm mr-1">add_circle</span>
          Add
        </button>
      </div>
      
      <div className="space-y-4">
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center justify-between p-3 border border-neutral-100 rounded-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-50 text-primary-500 rounded flex items-center justify-center mr-3">
                {account.institutionLogo ? (
                  <img src={account.institutionLogo} alt={`${account.institutionName} logo`} className="w-6 h-6" />
                ) : (
                  <span>{getAccountLogoInitial(account.institutionName)}</span>
                )}
              </div>
              <div>
                <p className="font-medium">{account.accountName}</p>
                <p className="text-xs text-neutral-500">{account.accountNumber}</p>
              </div>
            </div>
            <p className={`font-medium tabular-nums ${account.balance < 0 ? 'text-error-500' : ''}`}>
              {formatCurrency(account.balance)}
            </p>
          </div>
        ))}
        
        {/* Add Account Button */}
        <button 
          className="w-full flex items-center justify-center bg-neutral-50 py-3 rounded-lg border border-dashed border-neutral-300 text-neutral-500 hover:bg-neutral-100 transition-colors"
          onClick={() => setAddAccountOpen(true)}
        >
          <span className="material-icons text-sm mr-2">add</span>
          Connect New Account
        </button>
      </div>
      
      {/* Add Account Dialog */}
      <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Connect a new account</DialogTitle>
            <DialogDescription>
              Link your bank, credit card, or investment accounts securely through Plaid.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <PlaidLinkButton 
              className="w-full"
              onSuccess={() => {
                setAddAccountOpen(false);
                // Refresh the accounts list after successful connection
                queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
              }} 
              onClose={() => setAddAccountOpen(false)} 
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAccountOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
