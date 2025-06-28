import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Load Plaid script dynamically
function loadPlaidScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Plaid) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async = true;
    
    script.onload = () => {
      // Give a small delay for Plaid to initialize
      setTimeout(() => {
        if (window.Plaid) {
          console.log('Plaid script loaded successfully');
          resolve();
        } else {
          reject(new Error('Plaid failed to initialize'));
        }
      }, 100);
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Plaid script'));
    };
    
    document.head.appendChild(script);
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
      
      // Load Plaid script first
      try {
        await loadPlaidScript();
      } catch (loadError) {
        const errorMsg = loadError instanceof Error ? loadError.message : 'Unknown error';
        throw new Error('Failed to load Plaid: ' + errorMsg);
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