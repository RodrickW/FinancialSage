import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ChessCrownLogo } from '@/components/Logo';
import { Loader2 } from 'lucide-react';

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
          password: data.password,
          rememberMe: data.rememberMe
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
        
        // Navigate to dashboard after successful login
        setTimeout(() => {
          navigate('/');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-50 p-4">
      <Card className="w-full max-w-sm rounded-2xl shadow-lg border border-gray-100">
        <CardHeader className="space-y-4 pb-2">
          <div className="flex items-center justify-center gap-2">
            <ChessCrownLogo className="w-7 h-7" color="text-emerald-600" />
            <span className="text-lg font-semibold tracking-tight text-gray-900">Mind My Money</span>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Welcome back</h1>
            <p className="text-sm text-gray-500">
              Log in to access Money Mind, your AI financial coach
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-600 mb-1.5">Try the demo</p>
            <div className="bg-white rounded px-2.5 py-1.5 text-xs text-gray-700 font-mono border border-gray-100">
              Username: <span className="font-semibold">demo</span>
              <span className="mx-1.5 text-gray-300">|</span>
              Password: <span className="font-semibold">demo123</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
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
                      <div className="flex flex-col items-end text-xs space-y-1">
                        <Link href="/forgot-password" className="text-emerald-600 hover:underline">
                          Forgot password?
                        </Link>
                        <Link href="/forgot-username" className="text-emerald-600 hover:underline">
                          Forgot username?
                        </Link>
                      </div>
                    </div>
                    <FormControl>
                      <PasswordInput placeholder="Enter password" {...field} />
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
                        Keep me signed in
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center pb-6">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/register" className="text-emerald-600 font-medium hover:underline">
              Register here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
