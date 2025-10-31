import AsyncStorage from '@react-native-async-storage/async-storage';

export class AuthService {
  private static readonly AUTH_TOKEN_KEY = 'authToken';
  private static readonly USER_DATA_KEY = 'userData';

  static async saveAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  static async getAuthToken(): Promise<string | null> {
    try {
      // Temporary: Always return the test token for user 17 (Mr.Waddle)
      console.log('🔑 Getting auth token: mobile-user-17-token');
      return 'mobile-user-17-token';
    } catch (error) {
      console.error('Failed to get auth token:', error);
      // Temporary: Return a default token for testing
      return 'mobile-user-17-token';
    }
  }

  static async saveUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }

  static async getUserData(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  static async clearAuth(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(this.USER_DATA_KEY);
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }
}