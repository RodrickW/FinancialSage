import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Load Plaid script dynamically with fallback options
function loadPlaidScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if Plaid is already loaded
    if (window.Plaid) {
      console.log('Plaid already loaded');
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="plaid.com"]');
    if (existingScript) {
      console.log('Plaid script already loading, waiting...');
      const checkPlaid = setInterval(() => {
        if (window.Plaid) {
          clearInterval(checkPlaid);
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkPlaid);
        if (!window.Plaid) {
          reject(new Error('Plaid script timeout'));
        }
      }, 10000);
      return;
    }

    console.log('Loading Plaid script...');
    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      console.log('Plaid script onload event fired');
      // Poll for Plaid to be available
      let attempts = 0;
      const checkPlaid = setInterval(() => {
        attempts++;
        if (window.Plaid) {
          console.log('Plaid is now available after', attempts, 'attempts');
          clearInterval(checkPlaid);
          resolve();
        } else if (attempts > 50) { // 5 seconds max
          clearInterval(checkPlaid);
          reject(new Error('Plaid failed to initialize after loading'));
        }
      }, 100);
    };
    
    script.onerror = (error) => {
      console.error('Script loading error:', error);
      reject(new Error('Failed to load Plaid script from CDN'));
    };
    
    document.head.appendChild(script);
    console.log('Plaid script element added to document');
  });
}

export function usePlaidAuth(onConnectionSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Exchange the public token for an access token
  const exchangePublicToken = useCallback(async (publicToken: string, metadata: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('POST', '/api/plaid/exchange-token', {
        publicToken,
        metadata,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Token exchange failed:', data);
        throw new Error(data.error || 'Failed to exchange token');
      }
      
      // Invalidate accounts query to fetch the new accounts
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      
      toast({
        title: 'Success',
        description: 'Your account has been connected successfully!',
        variant: 'default',
      });
      
      // Call the success callback if provided
      if (onConnectionSuccess) {
        onConnectionSuccess();
      }
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to exchange token';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [queryClient, toast, onConnectionSuccess]);

  const openPlaidLink = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get fresh link token
      const response = await apiRequest('POST', '/api/plaid/create-link-token', {});
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get link token');
      }
      
      const linkToken = data.link_token;
      console.log('Got link token, opening Plaid modal:', linkToken);
      
      // Check if Plaid is available (should be pre-loaded)
      if (!window.Plaid) {
        throw new Error('Plaid SDK not available. Please refresh the page.');
      }
      
      console.log('Creating Plaid handler with token:', linkToken);
      
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: (publicToken: string, metadata: any) => {
          console.log('Plaid connection successful! Public token received, exchanging for access token');
          exchangePublicToken(publicToken, metadata);
        },
        onExit: (err: any, metadata: any) => {
          console.log('Plaid Link exited', { err, metadata });
          if (err) {
            console.error('Plaid Link exit error:', err);
            const errorMessage = err.error_message || 'Connection was cancelled';
            setError(errorMessage);
            
            // Only show toast for actual errors, not user cancellations
            if (err.error_code && err.error_code !== 'USER_CANCELLED') {
              toast({
                title: 'Connection Failed',
                description: errorMessage,
                variant: 'destructive',
              });
            }
          }
          setIsLoading(false);
        },
        onEvent: (eventName: string, metadata: any) => {
          console.log(`Plaid event: ${eventName}`, metadata);
        },
      });
      
      console.log('Opening Plaid Link modal');
      handler.open();
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open Plaid Link';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  }, [exchangePublicToken, toast]);

  return {
    openPlaidLink,
    isLoading,
    error,
    ready: true,
  };
}

// Add Plaid types to window
declare global {
  interface Window {
    Plaid: any;
  }
}