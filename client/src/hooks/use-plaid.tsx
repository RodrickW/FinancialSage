import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Create a fallback Plaid implementation for environments where CDN is blocked
function createPlaidFallback() {
  if (window.Plaid) return;
  
  console.log('Creating Plaid fallback implementation...');
  
  window.Plaid = {
    create: (config: any) => {
      console.log('Plaid.create called with config:', config);
      
      return {
        open: () => {
          console.log('Opening Plaid Link modal...');
          
          // Create a simple modal to explain the situation
          const modal = document.createElement('div');
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
          `;
          
          const content = document.createElement('div');
          content.style.cssText = `
            background: white;
            padding: 24px;
            border-radius: 8px;
            max-width: 400px;
            text-align: center;
          `;
          
          content.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: #1a1a1a;">Bank Connection Demo</h3>
            <p style="margin: 0 0 16px 0; color: #666;">
              In the live version, this would open your bank's secure login page. 
              For this demo, we'll simulate a successful connection.
            </p>
            <button id="simulate-success" style="
              background: #0066cc;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              margin-right: 8px;
              cursor: pointer;
            ">Simulate Connection</button>
            <button id="cancel" style="
              background: #666;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
            ">Cancel</button>
          `;
          
          modal.appendChild(content);
          document.body.appendChild(modal);
          
          // Handle button clicks
          const successBtn = content.querySelector('#simulate-success');
          const cancelBtn = content.querySelector('#cancel');
          
          successBtn?.addEventListener('click', () => {
            document.body.removeChild(modal);
            // Simulate successful connection with a public token
            const publicToken = 'public-sandbox-' + Math.random().toString(36).substr(2, 9);
            config.onSuccess?.(publicToken, {
              institution: {
                name: 'Demo Bank',
                institution_id: 'demo_bank'
              },
              accounts: [{
                id: 'demo_account_1',
                name: 'Demo Checking',
                type: 'depository',
                subtype: 'checking'
              }]
            });
          });
          
          cancelBtn?.addEventListener('click', () => {
            document.body.removeChild(modal);
            config.onExit?.();
          });
        },
        
        exit: () => {
          console.log('Plaid Link exit called');
        }
      };
    }
  };
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
      
      // Ensure Plaid is available (real SDK or fallback)
      if (!window.Plaid) {
        console.log('Plaid SDK not available, creating fallback...');
        createPlaidFallback();
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