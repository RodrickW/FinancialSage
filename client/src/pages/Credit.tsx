import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import BottomNavigation from '@/components/BottomNavigation';
import { useQuery } from '@tanstack/react-query';
import { UserProfile } from '@/types';
import TrialGate from '@/components/TrialGate';

export default function Credit() {
  // Get user profile for sidebar
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile']
  });

  return (
    <TrialGate>
      <div className="flex flex-col md:flex-row min-h-screen bg-neutral-50">
        <Sidebar user={user} />
        
        <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
          <BottomNavigation user={user} />
          <TopNav title="Credit Monitoring" />
          
          <div className="p-6">
            <div className="max-w-2xl mx-auto text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white text-3xl">📊</span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Credit Monitoring & Tips
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Coming Soon
              </p>
              
              <p className="text-gray-500 max-w-md mx-auto">
                We're working on bringing you comprehensive credit monitoring, 
                score tracking, and personalized improvement tips. Stay tuned!
              </p>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>What's coming:</strong> Real-time credit score monitoring, 
                  factor analysis, improvement recommendations, and credit history tracking.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </TrialGate>
  );
}