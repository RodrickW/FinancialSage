import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface TopNavProps {
  title: string;
  isPremium?: boolean;
}

export default function TopNav({ title, isPremium = false }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <header className="bg-white border-b border-neutral-100 py-4 px-6 flex items-center justify-between">
      <div className="flex items-center">
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
      </div>
    </header>
  );
}
