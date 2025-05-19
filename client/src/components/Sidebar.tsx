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
    { name: 'Transactions', path: '/transactions', icon: 'trending_up' },
    { name: 'Budgets', path: '/budgets', icon: 'pie_chart' },
    { name: 'Goals', path: '/goals', icon: 'insights' },
  ];
  
  const aiItems = [
    { name: 'Financial Coach', path: '/coach', icon: 'psychology' },
    { name: 'Analysis', path: '/analysis', icon: 'auto_graph' },
  ];
  
  const profileItems = [
    { name: 'Settings', path: '/settings', icon: 'settings' },
    { name: 'Help', path: '/help', icon: 'help_outline' },
  ];
  
  return (
    <aside className="w-full md:w-64 bg-white border-r border-neutral-100 md:min-h-screen">
      <div className="flex items-center justify-between md:justify-center p-4 border-b border-neutral-100">
        <div className="flex items-center">
          <span className="material-icons text-primary-500 mr-2">account_balance</span>
          <h1 className="text-xl font-bold text-primary-700">Mind My Money</h1>
        </div>
        <button 
          className="md:hidden text-neutral-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="material-icons">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>
      
      <nav className={cn("py-4", mobileMenuOpen ? "block" : "hidden md:block")}>
        <div className="px-4 mb-2 text-sm text-neutral-300 uppercase font-semibold">Main</div>
        {navItems.map((item) => (
          <Link 
            key={item.path}
            href={item.path}
            className={cn(
              "flex items-center py-2 px-4 text-neutral-700 hover:bg-neutral-50",
              isActive(item.path) 
                ? "border-l-3 border-primary-500 bg-neutral-50 text-primary-500 pl-6" 
                : "pl-4"
            )}
          >
            <span className="material-icons mr-3">{item.icon}</span>
            {item.name}
          </Link>
        ))}
        
        <div className="px-4 mt-6 mb-2 text-sm text-neutral-300 uppercase font-semibold">AI Insights</div>
        {aiItems.map((item) => (
          <Link 
            key={item.path}
            href={item.path}
            className={cn(
              "flex items-center py-2 px-4 text-neutral-700 hover:bg-neutral-50",
              isActive(item.path) 
                ? "border-l-3 border-primary-500 bg-neutral-50 text-primary-500 pl-6" 
                : "pl-4"
            )}
          >
            <span className="material-icons mr-3">{item.icon}</span>
            {item.name}
          </Link>
        ))}
        
        <div className="px-4 mt-6 mb-2 text-sm text-neutral-300 uppercase font-semibold">Profile</div>
        {profileItems.map((item) => (
          <Link 
            key={item.path}
            href={item.path}
            className={cn(
              "flex items-center py-2 px-4 text-neutral-700 hover:bg-neutral-50",
              isActive(item.path) 
                ? "border-l-3 border-primary-500 bg-neutral-50 text-primary-500 pl-6" 
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
