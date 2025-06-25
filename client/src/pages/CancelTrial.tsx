import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import BottomNavigation from '@/components/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, AlertTriangle, CheckCircle, X, ArrowLeft } from 'lucide-react';
// Removed mock data import - using real API data only

export default function CancelTrial() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users/profile']
  });

  // Get subscription status
  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/subscription/status']
  });

  const user = userData;

  // Cancel trial mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/cancel-trial');
      if (!response.ok) {
        throw new Error('Failed to cancel trial');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Trial Cancelled",
        description: data.message,
        duration: 5000,
      });
      // Refresh subscription status
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      // Redirect to dashboard after a short delay
      setTimeout(() => setLocation('/dashboard'), 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel trial. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (userLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleCancel = () => {
    cancelMutation.mutate();
  };

  const isAlreadyCancelled = subscriptionStatus?.subscriptionStatus === 'cancelled';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="lg:flex">
        <div className="hidden lg:block lg:w-64 lg:fixed lg:inset-y-0">
          <Sidebar user={user} />
        </div>
        
        <div className="lg:pl-64 flex-1">
          <TopNav title="Cancel Trial" />
          
          <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/dashboard')}
              className="mb-6 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            {/* Status Card */}
            {subscriptionStatus?.isOnFreeTrial && (
              <Card className="mb-6 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">
                        Your trial has {subscriptionStatus.trialDaysLeft} days remaining
                      </p>
                      <p className="text-sm text-blue-700">
                        You currently have access to all premium features
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Cancellation Card */}
            <Card className="border-red-200">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl text-red-900">
                  {isAlreadyCancelled ? 'Trial Already Cancelled' : 'Cancel Your Free Trial'}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {isAlreadyCancelled ? (
                  <div className="text-center space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <X className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Trial Cancelled</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-2">
                        Your trial has been cancelled. You can continue using the service until it expires.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => setLocation('/dashboard')}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      Return to Dashboard
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Before you cancel, consider:</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">You'll lose access to all premium features when your trial expires</span>
                        </li>
                        <li className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Your financial insights and AI coaching will be limited</span>
                        </li>
                        <li className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">You can reactivate anytime by starting a new subscription</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">What happens when you cancel:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Your trial will end as scheduled, but you won't be charged</li>
                        <li>• You'll continue to have access until your trial expires</li>
                        <li>• You can re-subscribe at any time in the future</li>
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setLocation('/dashboard')}
                        className="flex-1"
                      >
                        Keep My Trial
                      </Button>
                      <Button 
                        onClick={handleCancel}
                        disabled={cancelMutation.isPending}
                        variant="destructive"
                        className="flex-1"
                      >
                        {cancelMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          'Cancel Trial'
                        )}
                      </Button>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        Need help? <a href="/feedback" className="text-blue-600 hover:underline">Contact support</a>
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      
      <div className="lg:hidden">
        <BottomNavigation user={user} />
      </div>
    </div>
  );
}