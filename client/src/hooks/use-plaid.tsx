import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Load Plaid SDK dynamically if not available
function loadPlaidSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Plaid) {
      resolve();
      return;
    }

    console.log('Loading Plaid SDK from proxy...');
    
    // Remove any existing Plaid scripts first
    const existingScripts = document.querySelectorAll('script[src*="plaid"]');
    existingScripts.forEach(script => script.remove());
    
    // Create script element
    const script = document.createElement('script');
    script.src = '/api/plaid-sdk.js';
    script.async = false; // Load synchronously to ensure proper initialization
    script.defer = false;
    
    script.onload = () => {
      console.log('Plaid SDK script loaded');
      // Wait for Plaid to be available
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkPlaid = setInterval(() => {
        attempts++;
        if (window.Plaid) {
          clearInterval(checkPlaid);
          console.log('Plaid SDK ready');
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkPlaid);
          reject(new Error('Plaid SDK not initialized after loading'));
        }
      }, 100);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Plaid SDK:', error);
      reject(new Error('Failed to load Plaid SDK from server'));
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
      
      // Load Plaid SDK
      console.log('Loading Plaid SDK...');
      try {
        await loadPlaidSDK();
        console.log('Plaid SDK ready');
      } catch (error) {
        console.error('Plaid SDK loading failed:', error);
        toast({
          title: "Connection Error", 
          description: "Unable to load bank connection service. Please refresh and try again.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Creating Plaid handler with token:', linkToken);
      
      // Ensure Plaid is properly initialized before creating handler
      if (!window.Plaid || !window.Plaid.create) {
        throw new Error('Plaid SDK not properly initialized');
      }
      
      try {
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
          onLoad: () => {
            console.log('Plaid Link loaded successfully');
          },
        });
        
        console.log('Opening Plaid Link modal');
        handler.open();
        
      } catch (createError) {
        console.error('Error creating Plaid handler:', createError);
        const errorMessage = createError instanceof Error ? createError.message : 'Unknown error';
        throw new Error(`Failed to initialize Plaid Link: ${errorMessage}`);
      }
      
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