import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Heart, BookOpen, HandHeart, Sparkles } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: number;
  faithModeEnabled?: boolean;
}

export default function FaithModeToggle() {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: user } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile'],
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest('POST', '/api/users/toggle-faith-mode', { enabled });
      return res.json();
    },
    onMutate: () => {
      setIsUpdating(true);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      toast({
        title: data.faithModeEnabled ? '✝️ Faith Mode Enabled' : 'Faith Mode Disabled',
        description: data.faithModeEnabled 
          ? 'Biblical stewardship principles are now active'
          : 'Standard financial guidance restored'
      });
      setIsUpdating(false);
    },
    onError: () => {
      setIsUpdating(false);
      toast({
        title: 'Error',
        description: 'Failed to update Faith Mode',
        variant: 'destructive'
      });
    }
  });

  const faithModeEnabled = user?.faithModeEnabled ?? false;

  return (
    <Card className={`border-2 transition-all duration-300 ${
      faithModeEnabled 
        ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50' 
        : 'border-gray-200 bg-white'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              faithModeEnabled ? 'bg-amber-500' : 'bg-gray-200'
            }`}>
              {faithModeEnabled ? (
                <Heart className="w-5 h-5 text-white" />
              ) : (
                <Heart className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="faith-mode" className="text-base font-semibold text-gray-900 cursor-pointer">
                Faith Mode
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                {faithModeEnabled 
                  ? 'Biblical stewardship & scripture-based guidance'
                  : 'Enable for faith-based financial wisdom'
                }
              </p>
            </div>
          </div>
          
          <Switch
            id="faith-mode"
            checked={faithModeEnabled}
            disabled={isUpdating}
            onCheckedChange={(checked) => toggleMutation.mutate(checked)}
            className="data-[state=checked]:bg-amber-500"
            data-testid="switch-faith-mode"
          />
        </div>

        {faithModeEnabled && (
          <div className="mt-4 pt-4 border-t border-amber-200">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center gap-1">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-amber-700">Scripture</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <HandHeart className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-amber-700">Stewardship</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-amber-700">Giving</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
