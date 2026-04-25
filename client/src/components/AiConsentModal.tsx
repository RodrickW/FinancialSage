import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, Brain, Lock, ChevronRight } from 'lucide-react';

interface AiConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function AiConsentModal({ open, onAccept, onDecline }: AiConsentModalProps) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    onAccept();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDecline(); }}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-lg font-bold text-gray-900">
              AI Coach — Data Sharing Consent
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-700 font-medium">
            Money Mind AI uses a third-party AI service (OpenAI). Before you use it,
            we need your permission to share your financial data.
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <ChevronRight className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">What data is sent</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Account balances, spending categories, transaction totals, budget amounts, and savings goals. No bank credentials, account numbers, or personally identifiable information.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ChevronRight className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Who receives it</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  <strong>OpenAI (openai.com)</strong> processes your financial summary to generate coaching advice. OpenAI does not use your data to train its models.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ChevronRight className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">How it's used</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Your data is used solely to generate your coaching response and is not sold, shared with advertisers, or used for any other purpose.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Lock className="w-3 h-3 flex-shrink-0" />
            <span>All data transmitted over encrypted HTTPS. See our <a href="/privacy" className="text-emerald-600 underline">Privacy Policy</a> for full details.</span>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button
              onClick={handleAccept}
              disabled={accepted}
              className="w-full bg-gradient-to-r from-emerald-700 to-emerald-500 hover:from-emerald-800 hover:to-emerald-700 text-white font-medium"
            >
              <Shield className="w-4 h-4 mr-2" />
              I Understand &amp; Allow Data Sharing
            </Button>
            <Button
              variant="ghost"
              onClick={onDecline}
              className="w-full text-gray-500 hover:text-gray-700"
            >
              No Thanks
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
