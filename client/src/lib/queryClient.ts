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
    console.log('Making API request with question:', question);
    const response = await fetch('/api/ai/coaching', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ question }),
    });
    
    console.log('Raw fetch response:', response);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Parsed JSON data:', data);
    
    return data.answer || "Sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('Error in getFinancialCoaching:', error);
    return "Sorry, I couldn't generate a response. Please try again.";
  }
};
