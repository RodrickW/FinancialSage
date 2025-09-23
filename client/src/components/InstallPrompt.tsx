import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Smartphone, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if user previously dismissed or if no prompt available
  if (!showPrompt || !deferredPrompt || localStorage.getItem('installPromptDismissed')) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mr-3">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Install Mind My Money</CardTitle>
              <CardDescription className="text-xs">Add to your home screen for quick access</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          onClick={handleInstallClick}
          className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Add to Home Screen
        </Button>
      </CardContent>
    </Card>
  );
}

export function InstallInstructions() {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Smartphone className="w-5 h-5 mr-2 text-primary" />
          Add to Home Screen
        </CardTitle>
        <CardDescription>
          Install Mind My Money for quick access from your phone's home screen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-2">📱 iPhone/iPad (Safari):</h4>
          <ol className="text-sm text-gray-600 space-y-1 ml-4">
            <li>1. Tap the Share button (square with arrow)</li>
            <li>2. Scroll down and tap "Add to Home Screen"</li>
            <li>3. Tap "Add" to confirm</li>
          </ol>
        </div>
        
        <div>
          <h4 className="font-medium text-sm mb-2">🤖 Android (Chrome):</h4>
          <ol className="text-sm text-gray-600 space-y-1 ml-4">
            <li>1. Tap the menu (three dots) in top right</li>
            <li>2. Select "Add to Home screen"</li>
            <li>3. Tap "Add" to confirm</li>
          </ol>
        </div>

        <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
          <p className="text-xs text-primary/80">
            💡 <strong>Tip:</strong> Once installed, Mind My Money will work like a native app with offline capabilities and push notifications!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}