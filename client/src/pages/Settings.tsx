import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { AlertTriangle, Trash2, User, Lock, Bell, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';
import TopNav from '@/components/TopNav';

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isMobileApp = typeof window !== 'undefined' && (
    localStorage.getItem('isMobileApp') === 'true' ||
    sessionStorage.getItem('isMobileApp') === 'true' ||
    (window as any).isMobileApp === true ||
    (window as any).ReactNativeWebView !== undefined
  );

  const { data: user } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile'],
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => apiRequest('DELETE', '/api/users/account'),
    onSuccess: () => {
      setIsDeleting(false);
      toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
      window.location.href = '/landing';
    },
    onError: (error: any) => {
      setIsDeleting(false);
      setConfirmText('');
      toast({ title: 'Error', description: error.message || 'Failed to delete account.', variant: 'destructive' });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/users/change-password', { currentPassword, newPassword });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update password');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const notificationMutation = useMutation({
    mutationFn: async (prefs: { emailNotifications?: boolean; marketingEmails?: boolean }) => {
      const res = await apiRequest('POST', '/api/users/notification-preferences', prefs);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      toast({ title: 'Preferences saved' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save preferences.', variant: 'destructive' });
    },
  });

  const handleDeleteAccount = () => {
    if (isDeleting || deleteAccountMutation.isPending) return;
    if (confirmText !== 'DELETE') {
      toast({ title: 'Confirmation Required', description: 'Please type DELETE to confirm.', variant: 'destructive' });
      return;
    }
    setIsDeleting(true);
    deleteAccountMutation.mutate();
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please make sure both passwords match.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'Password too short', description: 'New password must be at least 8 characters.', variant: 'destructive' });
      return;
    }
    changePasswordMutation.mutate();
  };

  const userAny = user as any;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <TopNav title="Settings" />

      <main className="flex-1 pb-24">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

          {/* Mobile delete banner */}
          {isMobileApp && (
            <Card className="border-2 border-red-500 bg-red-50" id="delete-account-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 text-lg">
                  <Trash2 className="w-5 h-5" />
                  Delete Your Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="lg" className="w-full" data-testid="button-delete-account-mobile">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete My Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> Delete Account Permanently?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>This will permanently delete your account and all data. This action cannot be undone.</p>
                        <div className="mt-3">
                          <Label htmlFor="confirm-delete-mobile">Type DELETE to confirm:</Label>
                          <Input id="confirm-delete-mobile" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" className="mt-1" />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} disabled={confirmText !== 'DELETE' || isDeleting} className="bg-red-600 hover:bg-red-700">
                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}

          {/* Profile Info */}
          <Card className="section-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4 text-emerald-600" />
                Profile Information
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Name', value: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() },
                { label: 'Email', value: user?.email ?? '' },
                { label: 'Username', value: (user as any)?.username ?? '' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="section-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="w-4 h-4 text-emerald-600" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowCurrent(!showCurrent)}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword && (
                  <p className={`text-xs flex items-center gap-1 mt-1 ${newPassword === confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                    <CheckCircle className="w-3 h-3" />
                    {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
                className="w-full bg-emerald-600 hover:bg-emerald-700 h-10 rounded-xl font-semibold"
              >
                {changePasswordMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
                ) : 'Update Password'}
              </Button>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="section-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="w-4 h-4 text-emerald-600" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Control what emails you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Financial summaries</p>
                  <p className="text-xs text-gray-500">Weekly spending recaps and budget alerts</p>
                </div>
                <Switch
                  checked={userAny?.emailNotifications ?? true}
                  onCheckedChange={(checked) => notificationMutation.mutate({ emailNotifications: checked })}
                  disabled={notificationMutation.isPending}
                />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">Tips & offers</p>
                  <p className="text-xs text-gray-500">Financial tips, product updates, and offers</p>
                </div>
                <Switch
                  checked={userAny?.marketingEmails ?? false}
                  onCheckedChange={(checked) => notificationMutation.mutate({ marketingEmails: checked })}
                  disabled={notificationMutation.isPending}
                />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border border-red-200 bg-red-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-red-700">
                <AlertTriangle className="w-4 h-4" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-red-600">Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Permanently delete your account and all data — bank connections, transactions, budgets, goals, and coaching history. This cannot be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto" data-testid="button-delete-account">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Delete Account Permanently?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p>This will permanently delete your account and all associated data. This action cannot be undone.</p>
                      <div className="mt-3">
                        <Label htmlFor="confirm-delete">Type DELETE to confirm:</Label>
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
                    <AlertDialogCancel onClick={() => setConfirmText('')} data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
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
            </CardContent>
          </Card>
        </div>
      </main>

      {user && <BottomNavigation user={user} />}
    </div>
  );
}
