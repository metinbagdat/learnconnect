import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { errorTracker } from "./error-tracker";

// Generate a UUID v4 for request tracking
function generateRequestId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Global connection error handler - can be set by the app
let globalConnectionErrorHandler: ((requestId: string, metadata?: any) => void) | null = null;

export function setConnectionErrorHandler(handler: (requestId: string, metadata?: any) => void) {
  globalConnectionErrorHandler = handler;
}

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
  // Generate request ID for tracking
  const requestId = generateRequestId();
  console.log(`[API] ${method} ${url} [${requestId}]`, data ? { data } : "");
  
  // Get auth token from localStorage if available
  const user = localStorage.getItem('edulearn_user');
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // Add request ID to headers for server-side tracking
  headers['X-Request-Id'] = requestId;
  
  // If we have a user in localStorage, add it as a custom header
  if (user) {
    try {
      const userData = JSON.parse(user);
      headers['X-User-Id'] = userData.id?.toString() || '';
    } catch (e) {
      console.error('Failed to parse user data from localStorage', e);
    }
  }
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    console.log(`[API] Response: ${method} ${url} [${requestId}]`, { status: res.status, ok: res.ok });
    
    if (!res.ok) {
      let errorMessage = `Server error (${res.status})`;
      try {
        const text = await res.text();
        if (text) {
          try {
            const json = JSON.parse(text);
            errorMessage = json.message || json.error || text;
          } catch {
            errorMessage = text || res.statusText || errorMessage;
          }
        }
      } catch (e) {
        console.error(`[API] Error parsing response:`, e);
        errorMessage = res.statusText || errorMessage;
      }
      console.error(`[API] Error response [${requestId}]:`, { status: res.status, message: errorMessage });
      throw new Error(errorMessage);
    }
    return res;
  } catch (error) {
    console.error(`[API] Request failed [${requestId}]:`, error);
    
    // Check if this is a network/connection error
    const isConnectionError = 
      error instanceof TypeError && error.message === 'Failed to fetch' ||
      error instanceof Error && (
        error.message.includes('network') ||
        error.message.includes('connection') ||
        error.message.includes('fetch')
      );
    
    // Track the error
    if (error instanceof Error) {
      errorTracker.track(error, 'network', requestId, url);
    } else {
      errorTracker.track(String(error), 'network', requestId, url);
    }
    
    // Show connection error dialog if handler is set
    if (isConnectionError && globalConnectionErrorHandler) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      globalConnectionErrorHandler(requestId, {
        type: 'network',
        message: errorObj.message,
        stack: errorObj.stack,
        source: url,
      });
    }
    
    // Provide better error messages for common network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the server. Please check your internet connection and ensure the server is running.');
    }
    // Re-throw with the original error message if it's already an Error object
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise, wrap in an Error object
    throw new Error(String(error));
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get auth token from localStorage if available
    const user = localStorage.getItem('edulearn_user');
    const headers: Record<string, string> = {};
    
    // If we have a user in localStorage, add it as a custom header
    if (user) {
      try {
        const userData = JSON.parse(user);
        headers['X-User-Id'] = userData.id?.toString() || '';
      } catch (e) {
        console.error('Failed to parse user data from localStorage', e);
      }
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
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
