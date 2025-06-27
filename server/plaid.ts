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