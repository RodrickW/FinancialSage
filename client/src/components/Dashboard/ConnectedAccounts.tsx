import { Card } from '@/components/ui/card';
import { ConnectedAccount } from '@/types';

interface ConnectedAccountsProps {
  accounts: ConnectedAccount[];
}

export default function ConnectedAccounts({ accounts }: ConnectedAccountsProps) {
  
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
            <div className="flex items-center gap-2">
              <p className={`font-medium tabular-nums ${account.balance < 0 ? 'text-error-500' : ''}`}>
                {formatCurrency(account.balance)}
              </p>
              <button 
                className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-2 py-1 rounded"
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/plaid/sync-transactions`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ accountId: account.id, days: 30 })
                    });
                    
                    if (response.ok) {
                      const data = await response.json();
                      alert(`Synced ${data.newTransactions} new transactions`);
                      window.location.reload(); // Refresh to show new transactions
                    } else {
                      alert('Sync failed - transactions may not be ready yet');
                    }
                  } catch (error) {
                    alert('Sync failed - please try again later');
                  }
                }}
              >
                Sync
              </button>
            </div>
          </div>
        ))}
        

      </div>
      

    </Card>
  );
}
