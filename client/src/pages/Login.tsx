import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ChessCrownLogo } from '@/components/Logo';

const loginSchema = z.object({
  username: z.string().min(1, {
    message: 'Username is required',
  }),
  password: z.string().min(1, {
    message: 'Password is required',
  }),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  // Load saved username on component mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('mindMyMoney_savedUsername');
    if (savedUsername) {
      form.setValue('username', savedUsername);
      form.setValue('rememberMe', true);
    }
  }, [form]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password
        }),
        credentials: 'include'
      });
      
      if (response.ok) {
        // Handle remember me functionality
        if (data.rememberMe) {
          localStorage.setItem('mindMyMoney_savedUsername', data.username);
        } else {
          localStorage.removeItem('mindMyMoney_savedUsername');
        }

        toast({
          title: 'Login successful',
          description: 'Welcome to Money Mind!',
          variant: 'default',
        });
        
        // Force page reload to ensure authentication state is properly updated
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } else {
        const errorData = await response.json();
        toast({
          title: 'Login failed',
          description: errorData.message || 'Invalid username or password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
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
          <CardTitle className="text-xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Log in to access Money Mind, your AI financial coach
          </CardDescription>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-center mb-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs font-bold">?</span>
              </div>
              <p className="text-sm text-blue-800 font-semibold">Try the Demo</p>
            </div>
            <p className="text-xs text-blue-700 mb-2">
              Experience all features with our demo account:
            </p>
            <div className="bg-white/60 rounded px-3 py-2 text-xs text-blue-800 font-mono">
              Username: <span className="font-bold">demo</span><br/>
              Password: <span className="font-bold">demo123</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link href="/forgot-password" className="text-sm text-primary-600 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Remember my username
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="material-icons animate-spin mr-2">refresh</span>
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-sm text-center text-neutral-500">
            <p>Use the demo account to experience Money Mind AI</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-neutral-500 text-center">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary-600 hover:underline">
              Register here
            </Link>
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-2 border-gray-300 text-gray-600 hover:bg-gray-50"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}