import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

// Configure Plaid client
const configuration = new Configuration({
  basePath: getBasePath(),
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

// Helper function to get the correct Plaid environment
function getBasePath() {
  switch (process.env.PLAID_ENV) {
    case 'sandbox':
      return PlaidEnvironments.sandbox;
    case 'development':
      return PlaidEnvironments.development;
    case 'production':
      return PlaidEnvironments.production;
    default:
      return PlaidEnvironments.sandbox;
  }
}

// Create a link token to initialize Plaid Link
export async function createLinkToken(userId: number, clientUserId: string) {
  try {
    const request = {
      user: {
        client_user_id: clientUserId,
      },
      client_name: 'Mind My Money',
      products: ['auth', 'transactions'] as Products[],
      language: 'en',
      country_codes: ['US'] as CountryCode[],
    };

    const response = await plaidClient.linkTokenCreate(request);
    return response.data;
  } catch (error) {
    console.error('Error creating link token:', error);
    throw error;
  }
}

// Exchange a public token for an access token and item_id
export async function exchangePublicToken(publicToken: string) {
  try {
    // Handle demo tokens for fallback scenarios
    if (publicToken.startsWith('public-sandbox-')) {
      console.log('Processing demo connection token');
      return {
        access_token: `access-sandbox-${publicToken.slice(15)}`,
        item_id: `demo-item-${Math.random().toString(36).substr(2, 9)}`,
        request_id: `demo-request-${Math.random().toString(36).substr(2, 9)}`
      };
    }

    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error exchanging public token:', error);
    if (error.response?.data) {
      console.error('Plaid exchange error details:', error.response.data);
    }
    throw error;
  }
}

// Get user's accounts from Plaid
export async function getAccounts(accessToken: string) {
  try {
    // Handle demo access tokens
    if (accessToken.startsWith('access-sandbox-')) {
      console.log('Processing demo account data');
      return {
        accounts: [{
          account_id: 'demo_checking_001',
          balances: {
            available: 2500.50,
            current: 2750.75,
            iso_currency_code: 'USD',
            limit: null,
            unofficial_currency_code: null
          },
          mask: '0000',
          name: 'Demo Checking Account',
          official_name: 'Demo Primary Checking',
          type: 'depository',
          subtype: 'checking'
        }, {
          account_id: 'demo_savings_001',
          balances: {
            available: 15000.00,
            current: 15000.00,
            iso_currency_code: 'USD',
            limit: null,
            unofficial_currency_code: null
          },
          mask: '1111',
          name: 'Demo Savings Account',
          official_name: 'Demo High-Yield Savings',
          type: 'depository',
          subtype: 'savings'
        }],
        item: {
          available_products: ['assets', 'auth', 'identity', 'transactions'],
          billed_products: ['transactions'],
          consent_expiration_time: null,
          error: null,
          institution_id: 'demo_bank',
          item_id: accessToken.replace('access-sandbox-', 'item-demo-'),
          products: ['transactions'],
          update_type: 'background',
          webhook: null
        },
        request_id: `demo-accounts-${Math.random().toString(36).substr(2, 9)}`
      };
    }

    const response = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting accounts:', error);
    throw error;
  }
}

// Get user's transactions from Plaid
export async function getTransactions(
  accessToken: string,
  startDate: string,
  endDate: string
) {
  try {
    // Handle demo access tokens
    if (accessToken.startsWith('access-sandbox-')) {
      console.log('Processing demo transaction data');
      const today = new Date();
      const transactions = [];
      
      // Generate some realistic demo transactions
      const demoTransactions = [
        { name: 'Starbucks Coffee', amount: 4.95, category: 'Food and Drink', date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000) },
        { name: 'Grocery Store', amount: 127.43, category: 'Groceries', date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000) },
        { name: 'Gas Station', amount: 45.20, category: 'Transportation', date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000) },
        { name: 'Netflix Subscription', amount: 15.99, category: 'Entertainment', date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000) },
        { name: 'Direct Deposit', amount: -2500.00, category: 'Deposit', date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) },
        { name: 'Electric Bill', amount: 89.50, category: 'Utilities', date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000) },
        { name: 'Restaurant', amount: 67.80, category: 'Food and Drink', date: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000) }
      ];
      
      demoTransactions.forEach((tx, index) => {
        transactions.push({
          account_id: 'demo_checking_001',
          account_owner: null,
          amount: tx.amount,
          authorized_date: tx.date.toISOString().split('T')[0],
          authorized_datetime: tx.date.toISOString(),
          category: [tx.category],
          category_id: `demo_cat_${index}`,
          check_number: null,
          date: tx.date.toISOString().split('T')[0],
          datetime: tx.date.toISOString(),
          iso_currency_code: 'USD',
          location: {},
          merchant_name: tx.name,
          name: tx.name,
          payment_channel: 'online',
          pending: false,
          pending_transaction_id: null,
          personal_finance_category: {
            primary: tx.category.toLowerCase().replace(' ', '_'),
            detailed: tx.category.toLowerCase().replace(' ', '_')
          },
          transaction_id: `demo_tx_${index}`,
          transaction_type: tx.amount > 0 ? 'purchase' : 'deposit',
          unofficial_currency_code: null
        });
      });
      
      return {
        accounts: [{
          account_id: 'demo_checking_001',
          balances: {
            available: 2500.50,
            current: 2750.75,
            iso_currency_code: 'USD'
          },
          mask: '0000',
          name: 'Demo Checking Account',
          official_name: 'Demo Primary Checking',
          type: 'depository',
          subtype: 'checking'
        }],
        transactions,
        total_transactions: transactions.length,
        request_id: `demo-transactions-${Math.random().toString(36).substr(2, 9)}`
      };
    }

    const request = {
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    };
    const response = await plaidClient.transactionsGet(request);
    return response.data;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
}

// Helper function to format Plaid account data to our schema
export function formatPlaidAccountData(plaidAccount: any, userId: number, institutionName: string) {
  return {
    userId,
    accountName: plaidAccount.name,
    accountType: plaidAccount.type,
    accountNumber: plaidAccount.mask ? `****${plaidAccount.mask}` : `****${plaidAccount.account_id.slice(-4)}`,
    balance: plaidAccount.balances.current || 0,
    institutionName: institutionName,
    institutionLogo: '',
    isConnected: true
  };
}

// Helper function to format Plaid transaction data to our schema
export function formatPlaidTransactionData(plaidTransaction: any, userId: number, accountId: number) {
  return {
    userId,
    accountId,
    amount: plaidTransaction.amount,
    category: plaidTransaction.category ? plaidTransaction.category[0] : 'Other',
    description: plaidTransaction.name,
    date: new Date(plaidTransaction.date),
    merchantName: plaidTransaction.merchant_name || plaidTransaction.name,
    merchantIcon: getCategoryIcon(plaidTransaction.category ? plaidTransaction.category[0] : 'Other')
  };
}

// Helper function to map transaction categories to icons
function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'Food and Drink': 'restaurant',
    'Restaurants': 'restaurant',
    'Groceries': 'shopping_cart',
    'Transportation': 'directions_car',
    'Travel': 'flight',
    'Payment': 'payments',
    'Recreation': 'sports_basketball',
    'Shopping': 'shopping_bag',
    'Healthcare': 'local_hospital',
    'Entertainment': 'movie',
    'Transfer': 'swap_horiz',
    'Service': 'build',
    'Income': 'attach_money',
  };

  return iconMap[category] || 'receipt';
}