import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/types';
import { LayoutDashboard, PieChart, BookOpen, Target } from 'lucide-react';

interface BottomNavigationProps {
  user: UserProfile;
}

export default function BottomNavigation({ user }: BottomNavigationProps) {
  const [location] = useLocation();
  
  const isActive = (path: string) => location === path;
  
  const navItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Budget', path: '/budget', icon: PieChart },
    { name: 'Playbook', path: '/money-playbook', icon: BookOpen },
    { name: 'Goals', path: '/goals', icon: Target },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-nav border-t border-gray-200/50 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link 
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 min-w-[64px]",
                active 
                  ? "text-emerald-600" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200",
                active && "bg-emerald-100"
              )}>
                <item.icon className={cn("w-[18px] h-[18px]", active && "stroke-[2.5px]")} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                active && "font-semibold"
              )}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
