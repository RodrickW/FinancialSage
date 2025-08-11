import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure the base API URL
const BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:5000' // Android emulator
  : 'https://your-production-domain.com'; // Replace with your production URL

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      await AsyncStorage.removeItem('authToken');
      // You might want to redirect to login screen here
    }
    return Promise.reject(error);
  }
);

export const apiRequest = async (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  data?: any
) => {
  try {
    const response = await api.request({
      method,
      url,
      data,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // Server responded with an error status
      throw new Error(error.response.data?.message || 'Request failed');
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      throw new Error('An unexpected error occurred');
    }
  }
};

export default api;