import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ ? 'http://localhost:5000' : 'https://mindmymoneyapp.com';

interface ApiConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

class ApiService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request<T>(endpoint: string, config: ApiConfig = { method: 'GET' }): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    try {
      const response = await fetch(url, {
        ...config,
        headers: {
          ...headers,
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(username: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    });
  }

  async register(userData: any) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: userData,
    });
  }

  async getUserProfile() {
    return this.request('/api/users/profile');
  }

  // Financial data
  async getAccounts() {
    return this.request('/api/accounts');
  }

  async getTransactions() {
    return this.request('/api/transactions');
  }

  async getSpendingTrends() {
    return this.request('/api/spending-trends');
  }

  async getBudget() {
    return this.request('/api/budget');
  }

  async getSavingsGoals() {
    return this.request('/api/savings-goals');
  }

  // AI Coaching
  async getFinancialCoaching(question: string): Promise<{ answer: string }> {
    return this.request('/api/ai/coaching', {
      method: 'POST',
      body: { question },
    });
  }

  // Plaid
  async createLinkToken() {
    return this.request('/api/plaid/link-token', { method: 'POST' });
  }

  async exchangePublicToken(publicToken: string) {
    return this.request('/api/plaid/exchange-public-token', {
      method: 'POST',
      body: { public_token: publicToken },
    });
  }

  // Subscription
  async createSubscription() {
    return this.request('/api/create-subscription', { method: 'POST' });
  }

  async cancelTrial() {
    return this.request('/api/cancel-trial', { method: 'POST' });
  }
}

export const apiService = new ApiService();
export default apiService;