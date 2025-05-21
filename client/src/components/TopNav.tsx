import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { logout, redirectToLogin } from '@/lib/auth';
import { ChessCrownLogo } from '@/components/Logo';
import { NotificationDrawer } from '@/components/ui/notification-drawer';

interface TopNavProps {
  title: string;
  isPremium?: boolean;
}

export default function TopNav({ title, isPremium = false }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <header className="bg-app-gradient text-white py-4 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="mr-3 text-white"
          >
            <span className="material-icons">{menuOpen ? 'close' : 'menu'}</span>
          </button>
          <div className="flex items-center">
            <ChessCrownLogo className="w-7 h-7 mr-2" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          {isPremium && (
            <span className="ml-2 text-sm bg-white/20 text-white py-1 px-2 rounded-full border border-white/30">Premium</span>
          )}
        </div>
      
        <div className="flex items-center space-x-4">
          <NotificationDrawer />
          <div className="hidden md:block relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="material-icons text-white/70 text-sm">search</span>
            </span>
            <Input
              type="text"
              placeholder="Search transactions..."
              className="pl-10 pr-4 py-2 bg-white/20 border border-white/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent placeholder:text-white/70"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className="flex items-center px-3 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors border border-white/30"
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
        <div className="mt-4 py-4 border-t border-white/20">
          <nav className="space-y-1">
            <a href="/" className="flex items-center px-4 py-2 text-white hover:bg-white/10 rounded-md">
              <span className="material-icons mr-3">dashboard</span>
              Dashboard
            </a>
            <a href="/accounts" className="flex items-center px-4 py-2 text-white hover:bg-white/10 rounded-md">
              <span className="material-icons mr-3">account_balance_wallet</span>
              Accounts
            </a>
            <a href="/credit" className="flex items-center px-4 py-2 text-white hover:bg-white/10 rounded-md">
              <span className="material-icons mr-3">credit_score</span>
              Credit
            </a>
            <a href="/goals" className="flex items-center px-4 py-2 text-white hover:bg-white/10 rounded-md">
              <span className="material-icons mr-3">savings</span>
              Goals
            </a>
            <a href="/coach" className="flex items-center px-4 py-2 text-white hover:bg-white/10 rounded-md">
              <span className="material-icons mr-3">psychology</span>
              Coach
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
