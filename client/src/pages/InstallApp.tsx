import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import BottomNavigation from '@/components/BottomNavigation';
import { InstallInstructions } from '@/components/InstallPrompt';
import { useQuery } from '@tanstack/react-query';
// Removed mock data imports - using real API data only

export default function InstallApp() {
  // Get the user data
  const { data: userData } = useQuery({
    queryKey: ['/api/users/profile']
  });

  const user = userData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50">
      <div className="lg:flex">
        <div className="hidden lg:block lg:w-64 lg:fixed lg:inset-y-0">
          <Sidebar user={user} />
        </div>
        
        <div className="lg:pl-64 flex-1">
          <TopNav title="Install App" />
          
          <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                Install Mind My Money
              </h1>
              <p className="text-gray-600">
                Add Mind My Money to your home screen for instant access to your financial dashboard
              </p>
            </div>

            <InstallInstructions />
          </main>
        </div>
      </div>
      
      <div className="lg:hidden">
        <BottomNavigation user={user} />
      </div>
    </div>
  );
}