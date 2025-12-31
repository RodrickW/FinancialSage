import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { UserProfile } from '@/types';
import { AlertTriangle, Trash2, User, ArrowLeft } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import BottomNavigation from '@/components/BottomNavigation';

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: user } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile'],
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/users/account');
    },
    onSuccess: () => {
      setIsDeleting(false);
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      // Clear any cached data and redirect
      window.location.href = '/landing';
    },
    onError: (error: any) => {
      setIsDeleting(false);
      setConfirmText('');
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = () => {
    if (isDeleting || deleteAccountMutation.isPending) {
      return; // Prevent double submission
    }
    if (confirmText !== 'DELETE') {
      toast({
        title: "Confirmation Required",
        description: "Please type DELETE to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }
    setIsDeleting(true);
    deleteAccountMutation.mutate();
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <Sidebar user={user} />
      
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-500">Name</Label>
                <p className="text-gray-900 font-medium" data-testid="text-username">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Email</Label>
                <p className="text-gray-900 font-medium" data-testid="text-email">
                  {user?.email}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Username</Label>
                <p className="text-gray-900 font-medium" data-testid="text-user-username">
                  {user?.username}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-red-600">
                Irreversible actions that permanently affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Delete Account</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                    All your financial data, goals, budgets, and transaction history will be permanently removed.
                  </p>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full sm:w-auto"
                        data-testid="button-delete-account"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete My Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Delete Account Permanently?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                          <p>
                            This will permanently delete your account and all associated data including:
                          </p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            <li>All connected bank accounts</li>
                            <li>Transaction history</li>
                            <li>Budget configurations</li>
                            <li>Savings goals and progress</li>
                            <li>AI coaching history</li>
                            <li>Daily check-ins and challenge progress</li>
                          </ul>
                          <p className="font-semibold text-red-600">
                            This action cannot be undone.
                          </p>
                          <div className="mt-4">
                            <Label htmlFor="confirm-delete" className="text-sm font-medium">
                              Type DELETE to confirm:
                            </Label>
                            <Input
                              id="confirm-delete"
                              value={confirmText}
                              onChange={(e) => setConfirmText(e.target.value)}
                              placeholder="DELETE"
                              className="mt-1"
                              data-testid="input-confirm-delete"
                            />
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          onClick={() => setConfirmText('')}
                          data-testid="button-cancel-delete"
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={confirmText !== 'DELETE' || isDeleting}
                          className="bg-red-600 hover:bg-red-700"
                          data-testid="button-confirm-delete"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete Account'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {user && <BottomNavigation user={user} />}
    </div>
  );
}
