import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { logout, redirectToLogin } from '@/lib/auth';
import { ChessCrownLogo } from '@/components/Logo';
import { NotificationDrawer } from '@/components/ui/notification-drawer';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Search, Menu, X, LayoutDashboard, PieChart, Target, MessageSquare, Settings, Download, CreditCard, Shield } from 'lucide-react';

interface TopNavProps {
  title: string;
  isPremium?: boolean;
}

export default function TopNav({ title, isPremium = false }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  
  const { data: user } = useQuery({
    queryKey: ['/api/users/profile'],
    retry: false,
  });
  
  const menuItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/budget', icon: PieChart, label: 'Budget' },
    { href: '/goals', icon: Target, label: 'Goals' },
    { href: '/feedback', icon: MessageSquare, label: 'Feedback' },
    ...((user as any)?.isAdmin ? [{ href: '/admin', icon: Shield, label: 'Admin' }] : []),
    { href: '/cancel-trial', icon: CreditCard, label: 'Manage Subscription' },
    { href: '/settings', icon: Settings, label: 'Settings' },
    { href: '/install', icon: Download, label: 'Install App' },
  ];

  return (
    <header className="sticky top-0 z-40 glass-nav border-b border-gray-200/50">
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
          </button>
          <div className="flex items-center gap-2">
            <ChessCrownLogo className="w-6 h-6" />
            <span className="text-base font-semibold text-gray-900 tracking-tight">{title}</span>
          </div>
          {isPremium && (
            <span className="text-[10px] font-semibold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Pro</span>
          )}
        </div>
      
        <div className="flex items-center gap-2">
          <NotificationDrawer />
          <div className="hidden md:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-1.5 h-9 w-48 bg-gray-50 border-gray-200 text-sm rounded-lg focus:bg-white transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={async () => {
              const success = await logout();
              if (success) {
                redirectToLogin();
              }
            }}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
      
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 fade-in">
            <nav className="max-w-lg mx-auto py-2 px-2">
              {menuItems.map((item) => (
                <a 
                  key={item.href}
                  href={item.href} 
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
