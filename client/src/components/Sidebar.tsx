import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/types';

interface SidebarProps {
  user: UserProfile;
}

export default function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => location === path;
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Accounts', path: '/accounts', icon: 'account_balance_wallet' },
    { name: 'Budget', path: '/budget', icon: 'pie_chart' },
    { name: 'Goals', path: '/goals', icon: 'flag' },
    { name: 'Credit', path: '/credit', icon: 'credit_score' },
  ];
  
  const aiItems = [
    { name: 'Financial Coach', path: '/coach', icon: 'psychology' },
  ];
  
  const profileItems = [
    { name: 'Feedback', path: '/feedback', icon: 'feedback' },
    { name: 'Help', path: '/help', icon: 'help_outline' },
  ];
  
  return (
    <aside className="w-full md:w-auto bg-black border-r border-gray-800 md:min-h-screen flex-shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center">
          <span className="material-icons text-white mr-2">account_balance</span>
          <h1 className="text-xl font-bold text-white">Mind My Money</h1>
        </div>
        <button 
          className="text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="material-icons">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>
      
      <nav className={cn("py-4", mobileMenuOpen ? "block" : "hidden")}>
        <div className="px-4 mb-2 text-sm text-gray-400 uppercase font-semibold">Main</div>
        {navItems.map((item) => (
          <Link 
            key={item.path}
            href={item.path}
            className={cn(
              "flex items-center py-2 px-4 text-gray-300 hover:bg-gray-900",
              isActive(item.path) 
                ? "border-l-3 border-white bg-gray-900 text-white pl-6" 
                : "pl-4"
            )}
          >
            <span className="material-icons mr-3">{item.icon}</span>
            {item.name}
          </Link>
        ))}
        
        <div className="px-4 mt-6 mb-2 text-sm text-gray-400 uppercase font-semibold">AI Insights</div>
        {aiItems.map((item) => (
          <Link 
            key={item.path}
            href={item.path}
            className={cn(
              "flex items-center py-2 px-4 text-gray-300 hover:bg-gray-900",
              isActive(item.path) 
                ? "border-l-3 border-white bg-gray-900 text-white pl-6" 
                : "pl-4"
            )}
          >
            <span className="material-icons mr-3">{item.icon}</span>
            {item.name}
          </Link>
        ))}
        
        <div className="px-4 mt-6 mb-2 text-sm text-gray-400 uppercase font-semibold">Profile</div>
        {profileItems.map((item) => (
          <Link 
            key={item.path}
            href={item.path}
            className={cn(
              "flex items-center py-2 px-4 text-gray-300 hover:bg-gray-900",
              isActive(item.path) 
                ? "border-l-3 border-white bg-gray-900 text-white pl-6" 
                : "pl-4"
            )}
          >
            <span className="material-icons mr-3">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
      
      <div className={cn("mt-auto p-4 border-t border-neutral-100", mobileMenuOpen ? "block" : "hidden md:block")}>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center mr-2">
            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-neutral-500">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
