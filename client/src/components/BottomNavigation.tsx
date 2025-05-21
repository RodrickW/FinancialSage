import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/types';
import { Menu, ChevronUp } from 'lucide-react';

interface BottomNavigationProps {
  user: UserProfile;
}

export default function BottomNavigation({ user }: BottomNavigationProps) {
  const [location] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isActive = (path: string) => location === path;
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Accounts', path: '/accounts', icon: 'account_balance_wallet' },
    { name: 'Credit', path: '/credit', icon: 'credit_score' },
    { name: 'Goals', path: '/goals', icon: 'savings' },
    { name: 'Coach', path: '/coach', icon: 'psychology' },
  ];
  
  // Mobile navigation (always visible)
  const mobileNavigation = (
    <div className="md:hidden flex justify-around items-center">
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
  );
  
  // Desktop popup navigation
  const desktopNavigation = (
    <div className="hidden md:block">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center p-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
      >
        {isExpanded ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>
      
      {isExpanded && (
        <div className="flex justify-around items-center bg-white border-t border-neutral-100">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center py-3 px-6",
                isActive(item.path) ? "text-primary-600" : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              <span className="material-icons text-lg mb-1">{item.icon}</span>
              <span className="text-sm">{item.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 z-50">
      {mobileNavigation}
      {desktopNavigation}
    </nav>
  );
}