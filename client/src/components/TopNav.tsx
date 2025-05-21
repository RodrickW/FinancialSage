import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { logout, redirectToLogin } from '@/lib/auth';

interface TopNavProps {
  title: string;
  isPremium?: boolean;
}

export default function TopNav({ title, isPremium = false }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <header className="bg-white border-b border-neutral-100 py-4 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="mr-3 text-neutral-700"
          >
            <span className="material-icons">{menuOpen ? 'close' : 'menu'}</span>
          </button>
          <h2 className="text-lg font-semibold">{title}</h2>
          {isPremium && (
            <span className="ml-2 text-sm bg-primary-50 text-primary-500 py-1 px-2 rounded-full">Premium</span>
          )}
        </div>
      
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-neutral-50">
            <span className="material-icons">notifications</span>
          </button>
          <button className="p-2 rounded-full hover:bg-neutral-50">
            <span className="material-icons">help_outline</span>
          </button>
          <div className="hidden md:block relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="material-icons text-neutral-400 text-sm">search</span>
            </span>
            <Input
              type="text"
              placeholder="Search transactions..."
              className="pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className="flex items-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            onClick={async () => {
              const success = await logout();
              if (success) {
                redirectToLogin();
              }
            }}
          >
            <span className="material-icons text-sm mr-1">logout</span>
            Logout
          </button>
        </div>
      </div>
      
      {/* Expandable menu */}
      {menuOpen && (
        <div className="mt-4 py-4 border-t border-neutral-100">
          <nav className="space-y-1">
            <a href="/" className="flex items-center px-4 py-2 text-neutral-700 hover:bg-neutral-50 rounded-md">
              <span className="material-icons mr-3">dashboard</span>
              Dashboard
            </a>
            <a href="/accounts" className="flex items-center px-4 py-2 text-neutral-700 hover:bg-neutral-50 rounded-md">
              <span className="material-icons mr-3">account_balance_wallet</span>
              Accounts
            </a>
            <a href="/credit" className="flex items-center px-4 py-2 text-neutral-700 hover:bg-neutral-50 rounded-md">
              <span className="material-icons mr-3">credit_score</span>
              Credit
            </a>
            <a href="/goals" className="flex items-center px-4 py-2 text-neutral-700 hover:bg-neutral-50 rounded-md">
              <span className="material-icons mr-3">savings</span>
              Goals
            </a>
            <a href="/coach" className="flex items-center px-4 py-2 text-neutral-700 hover:bg-neutral-50 rounded-md">
              <span className="material-icons mr-3">psychology</span>
              Coach
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
