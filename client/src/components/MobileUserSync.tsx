import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  username: string;
  email: string;
}

export default function MobileUserSync() {
  const { data: user } = useQuery<User>({
    queryKey: ['/api/users/profile'],
    retry: false,
  });

  useEffect(() => {
    if (user?.id) {
      // Store user ID in sessionStorage for mobile app detection
      sessionStorage.setItem('userId', user.id.toString());
      
      // Also add data attribute to body for mobile app JavaScript injection
      document.body.setAttribute('data-user-id', user.id.toString());
      
      console.log('User ID synced for mobile detection:', user.id);
    } else {
      // Clear user ID if logged out
      sessionStorage.removeItem('userId');
      document.body.removeAttribute('data-user-id');
    }
  }, [user]);

  return null;
}
