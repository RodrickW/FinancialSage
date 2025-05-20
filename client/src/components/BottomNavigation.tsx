import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/types';

interface BottomNavigationProps {
  user: UserProfile;
}

export default function BottomNavigation({ user }: BottomNavigationProps) {
  const [location] = useLocation();
  
  const isActive = (path: string) => location === path;
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Accounts', path: '/accounts', icon: 'account_balance_wallet' },
    { name: 'Goals', path: '/goals', icon: 'savings' },
    { name: 'Coach', path: '/coach', icon: 'psychology' },
    { name: 'Profile', path: '/settings', icon: 'person' },
  ];
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 z-50">
      <div className="flex justify-around items-center">
        {navItems.map((item) => (
          <Link 
            key={item.path}
            href={item.path}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-4",
              isActive(item.path) ? "text-primary-600" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <span className="material-icons text-lg mb-1">{item.icon}</span>
            <span className="text-xs">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}