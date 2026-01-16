import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser, selectUserSchema } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AuthUtils } from "@/lib/utils";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
};
type RegisterData = InsertUser;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [localUser, setLocalUser] = useState<SelectUser | null>(null);
  
  // Load user from localStorage if available
  useEffect(() => {
    const storedUser = AuthUtils.getStoredUser();
    if (storedUser) {
      setLocalUser(storedUser);
      // Pre-populate the query cache with the stored user
      queryClient.setQueryData(["/api/user"], storedUser);
    }
  }, []);
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async ({ queryKey }) => {
      const baseQueryFn = getQueryFn({ on401: "returnNull" });
      const result = await baseQueryFn({ queryKey } as any);
      
      // If result is null (401), return null
      if (result === null) {
        return null;
      }
      
      // Validate and parse the user data with selectUserSchema
      // This prevents "Unrecognized key: createdAt" errors
      try {
        const validatedUser = selectUserSchema.parse(result);
        return validatedUser as SelectUser;
      } catch (validationError) {
        console.error('User data validation error:', validationError);
        // If validation fails, return the data as-is to prevent breaking the app
        // The passthrough() in selectUserSchema should prevent most errors
        return result as SelectUser;
      }
    },
    // Skip the API call if we already have a user from localStorage
    enabled: !localUser,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("[MUTATION] Login mutation starting", credentials);
      const res = await apiRequest("POST", "/api/login", credentials);
      const json = await res.json();
      console.log("[MUTATION] Login mutation response", json);
      return json;
    },
    onSuccess: (user: SelectUser) => {
      console.log("[MUTATION] Login success", user);
      // Store user in localStorage as fallback mechanism
      localStorage.setItem('edulearn_user', JSON.stringify(user));
      
      // Update query cache with user data
      queryClient.setQueryData(["/api/user"], user);
      
      // Force cache invalidation of other queries after login
      queryClient.invalidateQueries({ queryKey: ["/api/user/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      
      // Show success toast
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.displayName}`,
      });
      
      // Redirect admin users to admin panel, others to dashboard
      window.location.href = user.role === 'admin' ? '/admin' : '/';
    },
    onError: (error: Error) => {
      console.error("[MUTATION] Login error", error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Store user in localStorage as fallback mechanism
      localStorage.setItem('edulearn_user', JSON.stringify(user));
      
      // Update query cache with user data
      queryClient.setQueryData(["/api/user"], user);
      
      // Force cache invalidation of other queries after registration
      queryClient.invalidateQueries({ queryKey: ["/api/user/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      
      toast({
        title: "Registration successful",
        description: `Welcome to EduLearn, ${user.displayName}`,
      });
      
      // Redirect admin users to admin panel, others to dashboard
      window.location.href = user.role === 'admin' ? '/admin' : '/';
    },
    onError: (error: Error) => {
      console.error("[MUTATION] Registration error", error);
      // Extract a user-friendly error message
      let errorMessage = error.message;
      
      // Handle network errors more gracefully
      if (error.message.includes('Unable to connect') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and ensure the server is running.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Invalid registration data. Please check your information and try again.';
      } else if (error.message.includes('409') || error.message.includes('already exists')) {
        errorMessage = 'Username already exists. Please choose a different username.';
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Remove user from local storage
      localStorage.removeItem('edulearn_user');
      
      // Clear query cache
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/user/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Redirect to auth page
      window.location.href = '/auth';
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Use local user as fallback if API user is not available
  const effectiveUser = user || localUser;

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        isLoading: isLoading && !localUser,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Return safe default instead of throwing - allows graceful fallback
    console.warn("useAuth called outside AuthProvider - returning stub mutations");
    return {
      user: null,
      isLoading: false,
      error: null,
      loginMutation: {
        mutate: () => console.error("Auth context not available"),
        isPending: false,
      } as any,
      logoutMutation: {
        mutate: () => console.error("Auth context not available"),
        isPending: false,
      } as any,
      registerMutation: {
        mutate: () => console.error("Auth context not available"),
        isPending: false,
      } as any,
    };
  }
  return context;
}
