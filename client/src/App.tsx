import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import FloatingCoach from "@/components/FloatingCoach";
import { SubscriptionBanner } from "@/components/ui/subscription-banner";

// Import pages
import Landing from "@/pages/Landing";
import Privacy from "@/pages/Privacy";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Accounts from "@/pages/Accounts";
import FinancialCoach from "@/pages/Coach";
import CoachInterview from "@/pages/CoachInterview";
import SimpleGoals from "@/pages/SimpleGoals";
import Goals from "@/pages/Goals";
import Credit from "@/pages/Credit";
import Budget from "@/pages/Budget";
import Subscribe from "@/pages/Subscribe";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import SubscriptionCancel from "@/pages/SubscriptionCancel";
import NotFound from "@/pages/not-found";

// Protected route component
function ProtectedRoute({ component: Component, ...rest }: any) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/profile', {
          credentials: 'include',
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setLocation('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setLocation('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return isAuthenticated ? <Component {...rest} /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/landing" component={Landing} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/dashboard">
        {(params) => <ProtectedRoute component={Dashboard} params={params} />}
      </Route>
      <Route path="/accounts">
        {(params) => <ProtectedRoute component={Accounts} params={params} />}
      </Route>
      <Route path="/coach">
        {(params) => <ProtectedRoute component={FinancialCoach} params={params} />}
      </Route>
      <Route path="/coach/interview">
        {(params) => <ProtectedRoute component={CoachInterview} params={params} />}
      </Route>
      <Route path="/goals">
        {(params) => <ProtectedRoute component={Goals} params={params} />}
      </Route>
      <Route path="/credit">
        {(params) => <ProtectedRoute component={Credit} params={params} />}
      </Route>
      <Route path="/budget">
        {(params) => <ProtectedRoute component={Budget} params={params} />}
      </Route>
      <Route path="/subscribe">
        {(params) => <ProtectedRoute component={Subscribe} params={params} />}
      </Route>
      <Route path="/subscription/success">
        {(params) => <ProtectedRoute component={SubscriptionSuccess} params={params} />}
      </Route>
      <Route path="/subscription/cancel">
        {(params) => <ProtectedRoute component={SubscriptionCancel} params={params} />}
      </Route>
      <Route path="/" component={Landing} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Modified App component to only show FloatingCoach when logged in
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Check if the user is logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch('/api/users/profile', {
          credentials: 'include',
        });
        setIsLoggedIn(response.ok);
      } catch (error) {
        console.error('Login check failed:', error);
        setIsLoggedIn(false);
      }
    };
    
    checkLoginStatus();
    
    // Set up an interval to periodically check login status
    const interval = setInterval(checkLoginStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {isLoggedIn && <SubscriptionBanner />}
        <Router />
        {isLoggedIn && <FloatingCoach />}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;