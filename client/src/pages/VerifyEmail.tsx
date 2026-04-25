import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck, MailX, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VerifyEmail() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const params = new URLSearchParams(location.split('?')[1] || '');
  const token = params.get('token');
  const email = params.get('email') || '';

  const [verifyState, setVerifyState] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [resendEmail, setResendEmail] = useState(email);

  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (t: string) => {
    setVerifyState('verifying');
    try {
      const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(t)}`);
      const data = await res.json();
      if (res.ok) {
        setVerifyState('success');
      } else {
        setVerifyState('error');
        setErrorMsg(data.message || 'Verification failed. The link may have expired.');
      }
    } catch {
      setVerifyState('error');
      setErrorMsg('Network error. Please check your connection and try again.');
    }
  };

  const handleResend = async () => {
    if (!resendEmail) {
      toast({ title: 'Enter your email', description: 'Please enter your email address.', variant: 'destructive' });
      return;
    }
    setResendState('sending');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      setResendState('sent');
      toast({ title: 'Email sent', description: data.message });
    } catch {
      setResendState('idle');
      toast({ title: 'Error', description: 'Failed to resend. Please try again.', variant: 'destructive' });
    }
  };

  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              {verifyState === 'verifying' && <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />}
              {verifyState === 'success' && <CheckCircle2 className="w-16 h-16 text-emerald-500" />}
              {verifyState === 'error' && <MailX className="w-16 h-16 text-red-400" />}
            </div>
            {verifyState === 'verifying' && (
              <>
                <h1 className="text-2xl font-bold text-gray-900">Verifying your email…</h1>
                <p className="text-gray-500 mt-2">Just a moment.</p>
              </>
            )}
            {verifyState === 'success' && (
              <>
                <h1 className="text-2xl font-bold text-gray-900">Email verified!</h1>
                <p className="text-gray-500 mt-2">Your account is now active. You can log in.</p>
              </>
            )}
            {verifyState === 'error' && (
              <>
                <h1 className="text-2xl font-bold text-gray-900">Link expired</h1>
                <p className="text-gray-500 mt-2">{errorMsg}</p>
              </>
            )}
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {verifyState === 'success' && (
              <Button
                className="w-full bg-gradient-to-r from-emerald-700 to-emerald-500 hover:from-emerald-800 hover:to-emerald-700 text-white"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            )}
            {verifyState === 'error' && (
              <>
                <p className="text-sm text-gray-600 text-center">Need a new link?</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Button
                    onClick={handleResend}
                    disabled={resendState === 'sending' || resendState === 'sent'}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {resendState === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </Button>
                </div>
                {resendState === 'sent' && (
                  <p className="text-sm text-emerald-600 text-center">New link sent — check your inbox!</p>
                )}
              </>
            )}
            <div className="text-center pt-2">
              <Link href="/login" className="text-sm text-emerald-600 hover:underline">
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <MailCheck className="w-16 h-16 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Check your inbox</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            We sent a verification link to{' '}
            {email ? <strong className="text-gray-700">{email}</strong> : 'your email address'}.
            Click it to activate your account.
          </p>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-800">
            <p className="font-medium mb-1">Didn't get the email?</p>
            <ul className="list-disc list-inside space-y-1 text-emerald-700">
              <li>Check your spam or junk folder</li>
              <li>Links expire after 24 hours</li>
            </ul>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2 text-center">Resend the link to:</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Button
                onClick={handleResend}
                disabled={resendState === 'sending' || resendState === 'sent'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {resendState === 'sending' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : resendState === 'sent' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
            {resendState === 'sent' && (
              <p className="text-sm text-emerald-600 text-center mt-2">New link sent!</p>
            )}
          </div>

          <div className="text-center pt-1">
            <Link href="/login" className="text-sm text-emerald-600 hover:underline">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
