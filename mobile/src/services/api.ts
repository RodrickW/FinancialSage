// Force production URL for mobile builds
const API_BASE_URL = 'https://mindmymoney.replit.app';

import { AuthService } from './auth';

export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Always get fresh auth token for mobile authentication
  const authToken = await AuthService.getAuthToken();
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`, // Always send token
      ...options?.headers,
    },
    credentials: 'include', // Include cookies for session management
    ...options,
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  try {
    console.log(`📱 API Request: ${method} ${endpoint} with token: ${authToken?.substring(0, 10)}...`);
    const response = await fetch(url, config);
    
    // Log response status for debugging
    console.log(`📱 API Response: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.error('Authentication failed - token may be invalid');
    }
    
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