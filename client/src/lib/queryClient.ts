import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  // Always include Content-Type for all requests except GET
  if (method !== 'GET') {
    headers["Content-Type"] = "application/json";
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data !== null && data !== undefined ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Handle trial expiration (403 errors)
  if (res.status === 403) {
    const errorData = await res.json().catch(() => ({ message: 'Access denied' }));
    if (errorData.message?.includes('trial') || errorData.message?.includes('subscription')) {
      // Redirect to subscription page for trial-related access issues
      window.location.href = '/subscribe';
      return res; // Return without throwing to prevent error toast
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // Handle trial expiration for queries
    if (res.status === 403) {
      const errorData = await res.json().catch(() => ({ message: 'Access denied' }));
      if (errorData.message?.includes('trial') || errorData.message?.includes('subscription')) {
        // For queries, return null instead of redirecting to prevent loops
        return null;
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Helper function for AI coaching that uses user's actual financial data
export const getFinancialCoaching = async (question: string): Promise<string> => {
  try {
    const response = await fetch('/api/ai/coaching', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ question }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.answer || "Sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('Error in getFinancialCoaching:', error);
    return "Sorry, I couldn't generate a response. Please try again.";
  }
};
