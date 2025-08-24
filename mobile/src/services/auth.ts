import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

export class AuthService {
  private static readonly AUTH_TOKEN_KEY = 'authToken';
  private static readonly USER_DATA_KEY = 'userData';

  static async saveAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.AUTH_TOKEN_KEY, token);
      await Keychain.setInternetCredentials('mindmymoney', 'user', token);
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  static async getAuthToken(): Promise<string | null> {
    try {
      // Try AsyncStorage first
      const token = await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
      if (token) return token;

      // Fallback to Keychain
      const credentials = await Keychain.getInternetCredentials('mindmymoney');
      if (credentials) {
        return credentials.password;
      }

      // Temporary: Return a default token for testing with user 17 (Mr.Waddle)
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
      await Keychain.resetInternetCredentials('mindmymoney');
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }
}