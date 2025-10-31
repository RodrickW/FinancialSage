import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuthService } from '@/services/auth';
import { apiService } from '@/services/api';

export function useAuth() {
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const isAuthenticated = await AuthService.isAuthenticated();
      if (!isAuthenticated) {
        return null;
      }
      
      try {
        return await apiService.getUserProfile();
      } catch (error) {
        // If API call fails, clear stored auth and return null
        await AuthService.clearAuth();
        return null;
      }
    },
    retry: false,
    enabled: isInitialized,
  });

  useEffect(() => {
    // Initialize auth check on mount
    setIsInitialized(true);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await apiService.login(username, password);
      if (response.success) {
        await AuthService.saveAuthToken(response.token);
        await AuthService.saveUserData(response.user);
        return { success: true, user: response.user };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await apiService.register(userData);
      if (response.success) {
        await AuthService.saveAuthToken(response.token);
        await AuthService.saveUserData(response.user);
        return { success: true, user: response.user };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };

  const logout = async () => {
    await AuthService.clearAuth();
    // Optionally call logout API endpoint
    // await apiService.logout();
  };

  return {
    user,
    isLoading: !isInitialized || isLoading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
  };
}