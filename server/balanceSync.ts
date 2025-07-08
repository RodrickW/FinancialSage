import { storage } from './storage';
import { getAccounts } from './plaid';

/**
 * Refresh account balances for all users with connected Plaid accounts
 * This runs periodically to ensure balances are always current
 */
export async function refreshAllAccountBalances() {
  try {
    console.log('Starting automatic balance refresh for all users...');
    
    // Get all users with connected accounts
    const allUsers = await storage.getAllUsers();
    let totalAccountsRefreshed = 0;
    
    for (const user of allUsers) {
      try {
        const accounts = await storage.getAccounts(user.id);
        const plaidAccounts = accounts.filter(account => account.plaidAccessToken);
        
        if (plaidAccounts.length === 0) {
          continue; // Skip users with no connected accounts
        }
        
        console.log(`Refreshing balances for user ${user.id} (${plaidAccounts.length} accounts)`);
        
        for (const account of plaidAccounts) {
          try {
            // Get fresh account data from Plaid using balance endpoint for real-time data
            const plaidData = await getAccounts(account.plaidAccessToken!);
            
            // Find the matching account in Plaid response
            const plaidAccount = plaidData.accounts.find(
              acc => acc.account_id === account.plaidAccountId
            );
            
            if (plaidAccount) {
              const oldBalance = account.balance;
              const currentBalance = plaidAccount.balances.current;
              const availableBalance = plaidAccount.balances.available;
              
              // Log all balance information for debugging
              console.log(`${account.institutionName} - Balance Details:`, {
                current: currentBalance,
                available: availableBalance,
                stored: oldBalance,
                accountId: plaidAccount.account_id
              });
              
              // Use available balance if it exists, otherwise use current balance
              const bestBalance = availableBalance !== null ? availableBalance : currentBalance;
              
              if (bestBalance !== null && oldBalance !== bestBalance) {
                await storage.updateAccount(account.id, {
                  balance: bestBalance
                });
                totalAccountsRefreshed++;
                
                console.log(`${account.institutionName} - Updated balance for ${account.accountName}: $${oldBalance} → $${bestBalance} (using ${availableBalance !== null ? 'available' : 'current'} balance)`);
              }
            }
            
          } catch (accountError: any) {
            console.error(`Error refreshing ${account.institutionName} account ${account.accountName}:`, accountError.message);
            
            // Check for specific Plaid error codes
            if (accountError.response?.data?.error_code === 'ITEM_LOGIN_REQUIRED') {
              console.error(`${account.institutionName} requires user to re-authenticate`);
            }
          }
        }
        
      } catch (userError: any) {
        console.error(`Error refreshing balances for user ${user.id}:`, userError.message);
      }
    }
    
    console.log(`Automatic balance refresh complete. Updated ${totalAccountsRefreshed} accounts.`);
    
  } catch (error) {
    console.error('Error in automatic balance refresh:', error);
  }
}

/**
 * Refresh balances for a specific user
 * Used when user logs in or navigates to accounts page
 */
export async function refreshUserBalances(userId: number) {
  try {
    console.log(`Refreshing balances for user ${userId}...`);
    
    const accounts = await storage.getAccounts(userId);
    const plaidAccounts = accounts.filter(account => account.plaidAccessToken);
    
    if (plaidAccounts.length === 0) {
      console.log(`No connected accounts for user ${userId}`);
      return;
    }
    
    let updatedCount = 0;
    
    for (const account of plaidAccounts) {
      try {
        // Get fresh account data from Plaid using balance endpoint for real-time data
        const plaidData = await getAccounts(account.plaidAccessToken!);
        
        // Find the matching account in Plaid response
        const plaidAccount = plaidData.accounts.find(
          acc => acc.account_id === account.plaidAccountId
        );
        
        if (plaidAccount) {
          const oldBalance = account.balance;
          const currentBalance = plaidAccount.balances.current;
          const availableBalance = plaidAccount.balances.available;
          
          // Log all balance information for debugging
          console.log(`${account.institutionName} - User Balance Details:`, {
            current: currentBalance,
            available: availableBalance,
            stored: oldBalance,
            accountId: plaidAccount.account_id
          });
          
          // Use available balance if it exists, otherwise use current balance
          const bestBalance = availableBalance !== null ? availableBalance : currentBalance;
          
          if (bestBalance !== null) {
            await storage.updateAccount(account.id, {
              balance: bestBalance
            });
            updatedCount++;
            
            console.log(`${account.institutionName} - Updated balance for ${account.accountName}: $${oldBalance} → $${bestBalance} (using ${availableBalance !== null ? 'available' : 'current'} balance)`);
          }
        }
        
      } catch (accountError: any) {
        console.error(`Error refreshing ${account.institutionName} account ${account.accountName}:`, accountError.message);
      }
    }
    
    console.log(`User ${userId} balance refresh complete. Updated ${updatedCount} accounts.`);
    
  } catch (error) {
    console.error(`Error refreshing balances for user ${userId}:`, error);
  }
}