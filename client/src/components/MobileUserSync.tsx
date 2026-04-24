import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  email: string;
  subscriptionTier?: string;
}

export default function MobileUserSync() {
  const queryClient = useQueryClient();
  const syncedTierRef = useRef<string | null>(null);

  const { data: user } = useQuery<User>({
    queryKey: ['/api/users/profile'],
    retry: false,
  });

  useEffect(() => {
    if (user?.id) {
      sessionStorage.setItem('userId', user.id.toString());
      document.body.setAttribute('data-user-id', user.id.toString());
    } else {
      sessionStorage.removeItem('userId');
      document.body.removeAttribute('data-user-id');
    }
  }, [user]);

  // Watch for native mobile tier injected after Apple IAP purchase and sync to backend
  useEffect(() => {
    if (!user?.id) return;

    const checkNativeTier = async () => {
      const nativeTier = (window as any).mobileSubscriptionTier as 'plus' | 'pro' | null;
      if (!nativeTier || !['plus', 'pro'].includes(nativeTier)) return;
      if (syncedTierRef.current === nativeTier) return;
      if (user.subscriptionTier === nativeTier) {
        syncedTierRef.current = nativeTier;
        return;
      }

      try {
        syncedTierRef.current = nativeTier;
        await apiRequest('POST', '/api/mobile/sync-subscription', { tier: nativeTier });
        queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
        queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      } catch (err) {
        syncedTierRef.current = null;
        console.warn('Mobile subscription sync failed:', err);
      }
    };

    checkNativeTier();

    const interval = setInterval(checkNativeTier, 3000);
    return () => clearInterval(interval);
  }, [user?.id, user?.subscriptionTier, queryClient]);

  return null;
}
