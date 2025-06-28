import { useState, useCallback } from 'react';
import { usePlaidLink, PlaidLinkOptions } from 'react-plaid-link';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function usePlaidAuth() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get a link token from the API
  const getLinkToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('POST', '/api/plaid/create-link-token', {});
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get link token');
      }
      
      setLinkToken(data.link_token);
      return data.link_token;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get link token';
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
  }, [toast]);

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
  }, [queryClient, toast]);

  // Configure Plaid Link
  const config: PlaidLinkOptions = {
    token: linkToken || '',
    onSuccess: (publicToken, metadata) => {
      exchangePublicToken(publicToken, metadata);
    },
    onExit: (err, metadata) => {
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
      } else {
        console.log('User cancelled Plaid Link');
      }
    },
    onEvent: (eventName, metadata) => {
      // Optional: Track events
      console.log(`Plaid event: ${eventName}`, metadata);
    },
  };

  const { open, ready } = usePlaidLink(config);

  const openPlaidLink = useCallback(async () => {
    console.log('openPlaidLink called', { ready, linkToken });
    if (ready && linkToken) {
      console.log('Opening Plaid Link with existing token');
      open();
    } else {
      console.log('Getting a new link token');
      try {
        const token = await getLinkToken();
        console.log('Received token:', token);
        if (token) {
          // Force a re-render with the new token
          setTimeout(() => {
            if (token) {
              open();
            }
          }, 100);
        }
      } catch (err) {
        console.error('Error opening Plaid Link:', err);
      }
    }
  }, [ready, linkToken, open, getLinkToken]);

  return {
    openPlaidLink,
    getLinkToken,
    exchangePublicToken,
    isLoading,
    error,
    ready,
  };
}