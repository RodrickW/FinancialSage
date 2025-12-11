import { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChessCrownLogo } from '@/components/Logo';

const forgotUsernameSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
});

type ForgotUsernameFormData = z.infer<typeof forgotUsernameSchema>;

export default function ForgotUsername() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<ForgotUsernameFormData>({
    resolver: zodResolver(forgotUsernameSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotUsernameFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email
        }),
        credentials: 'include'
      });
      
      if (response.ok) {
        setEmailSent(true);
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to send username reminder',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Forgot username error:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-gradient p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-white/20 border border-white/30 rounded-full flex items-center justify-center mr-3">
                <ChessCrownLogo className="w-7 h-7" color="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Mind My Money</h1>
            </div>
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              We've sent your username(s) to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Mail className="w-5 h-5 text-emerald-700 mr-2" />
                <p className="text-sm text-blue-800 font-semibold">What to do next:</p>
              </div>
              <p className="text-xs text-emerald-800">
                Check your email inbox for your username(s). Use any of them to log in to your account.
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
              >
                Back to Login
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-app-gradient p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-white/20 border border-white/30 rounded-full flex items-center justify-center mr-3">
              <ChessCrownLogo className="w-7 h-7" color="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Mind My Money</h1>
          </div>
          <CardTitle className="text-xl text-center">Forgot Username?</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you your username(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="material-icons animate-spin mr-2">refresh</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Username(s)
                  </>
                )}
              </Button>
            </form>
          </Form>
          <div className="flex items-center justify-center mt-6">
            <Link href="/login" className="flex items-center text-sm text-primary-600 hover:underline">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}