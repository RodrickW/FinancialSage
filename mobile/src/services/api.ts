const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:5000' // Android emulator
  : 'https://your-production-api.com';

export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // Include cookies for session management
    ...options,
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Financial Overview API
export const apiService = {
  getUserProfile: async () => {
    const response = await apiRequest('GET', '/api/users/profile');
    return response.json();
  },

  getFinancialOverview: async () => {
    const response = await apiRequest('GET', '/api/financial-overview');
    return response.json();
  },

  getAccounts: async () => {
    const response = await apiRequest('GET', '/api/accounts');
    return response.json();
  },

  getTransactions: async () => {
    const response = await apiRequest('GET', '/api/transactions');
    return response.json();
  },

  getSpendingTrends: async () => {
    const response = await apiRequest('GET', '/api/spending-trends');
    return response.json();
  },

  getSavingsGoals: async () => {
    const response = await apiRequest('GET', '/api/savings-goals');
    return response.json();
  },

  refreshTransactions: async () => {
    const response = await apiRequest('POST', '/api/plaid/refresh-transactions', {});
    return response.json();
  },

  getSubscriptionStatus: async () => {
    const response = await apiRequest('GET', '/api/subscription/status');
    return response.json();
  },
};