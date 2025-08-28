import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { logout, redirectToLogin } from '@/lib/auth';
import { ChessCrownLogo } from '@/components/Logo';
import { NotificationDrawer } from '@/components/ui/notification-drawer';
import { useQuery } from '@tanstack/react-query';

interface TopNavProps {
  title: string;
  isPremium?: boolean;
}

export default function TopNav({ title, isPremium = false }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Get user profile to check admin status
  const { data: user } = useQuery({
    queryKey: ['/api/users/profile'],
    retry: false,
  });
  
  return (
    <header className="bg-white border-b border-gray-200 text-black py-4 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="mr-3 text-black"
          >
            <span className="material-icons">{menuOpen ? 'close' : 'menu'}</span>
          </button>
          <div className="flex items-center">
            <ChessCrownLogo className="w-7 h-7 mr-2" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          {isPremium && (
            <span className="ml-2 text-sm bg-black text-white py-1 px-2 rounded-full border border-gray-300">Premium</span>
          )}
        </div>
      
        <div className="flex items-center space-x-4">
          <NotificationDrawer />
          <div className="hidden md:block relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="material-icons text-gray-500 text-sm">search</span>
            </span>
            <Input
              type="text"
              placeholder="Search transactions..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent placeholder:text-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className="flex items-center px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors border border-gray-300"
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
        <div className="mt-4 py-4 border-t border-gray-200 bg-white">
          <nav className="space-y-1">
            <a href="/" className="flex items-center px-4 py-2 text-black hover:bg-gray-100 rounded-md">
              <span className="material-icons mr-3">dashboard</span>
              Dashboard
            </a>
            <a href="/budget" className="flex items-center px-4 py-2 text-black hover:bg-gray-100 rounded-md">
              <span className="material-icons mr-3">pie_chart</span>
              Budget
            </a>
            <a href="/credit" className="flex items-center px-4 py-2 text-black hover:bg-gray-100 rounded-md">
              <span className="material-icons mr-3">credit_score</span>
              Credit
            </a>
            <a href="/goals" className="flex items-center px-4 py-2 text-black hover:bg-gray-100 rounded-md">
              <span className="material-icons mr-3">savings</span>
              Goals
            </a>
            <a href="/coach" className="flex items-center px-4 py-2 text-black hover:bg-gray-100 rounded-md">
              <span className="material-icons mr-3">psychology</span>
              Coach
            </a>
            <a href="/feedback" className="flex items-center px-4 py-2 text-black hover:bg-gray-100 rounded-md">
              <span className="material-icons mr-3">feedback</span>
              Feedback
            </a>
            {user?.isAdmin && (
              <a href="/admin" className="flex items-center px-4 py-2 text-black hover:bg-gray-100 rounded-md">
                <span className="material-icons mr-3">admin_panel_settings</span>
                Admin
              </a>
            )}
            <a href="/cancel-trial" className="flex items-center px-4 py-2 text-black hover:bg-gray-100 rounded-md">
              <span className="material-icons mr-3">cancel</span>
              Manage Subscription
            </a>
            <a href="/install" className="flex items-center px-4 py-2 text-black hover:bg-gray-100 rounded-md">
              <span className="material-icons mr-3">get_app</span>
              Install App
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
