import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import FloatingCoach from "@/components/FloatingCoach";

// Import pages
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Accounts from "@/pages/Accounts";
import FinancialCoach from "@/pages/Coach";
import SimpleGoals from "@/pages/SimpleGoals";
import Goals from "@/pages/Goals";
import Credit from "@/pages/Credit";
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
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard">
        {(params) => <ProtectedRoute component={Dashboard} params={params} />}
      </Route>
      <Route path="/accounts">
        {(params) => <ProtectedRoute component={Accounts} params={params} />}
      </Route>
      <Route path="/coach">
        {(params) => <ProtectedRoute component={FinancialCoach} params={params} />}
      </Route>
      <Route path="/goals">
        {(params) => <ProtectedRoute component={SimpleGoals} params={params} />}
      </Route>
      <Route path="/">
        {(params) => <ProtectedRoute component={Dashboard} params={params} />}
      </Route>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <FloatingCoach />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;