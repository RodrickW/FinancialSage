import { AIRecommendation } from '@/types';
import { apiRequest } from './queryClient';

// Get AI-powered financial insights based on the user's financial data
export async function getFinancialInsights(): Promise<AIRecommendation[]> {
  try {
    const response = await apiRequest('GET', '/api/ai/insights');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching financial insights:', error);
    throw error;
  }
}

// Get personalized financial coaching based on a specific question
export async function getFinancialCoaching(question: string): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/ai/coaching', { question });
    const data = await response.json();
    return data.advice;
  } catch (error) {
    console.error('Error fetching financial coaching:', error);
    throw error;
  }
}

// Get budget recommendations based on spending patterns
export async function getBudgetRecommendations(): Promise<any> {
  try {
    const response = await apiRequest('GET', '/api/ai/budget-recommendations');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching budget recommendations:', error);
    throw error;
  }
}
