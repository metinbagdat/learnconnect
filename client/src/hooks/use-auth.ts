import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface User {
  id: number;
  username: string;
  displayName: string;
  role: string;
  profile?: {
    grade?: string;
  };
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/user", {
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setUser(null);
        setLocation("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout fails, clear local state and redirect
      setUser(null);
      setLocation("/login");
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    checkAuth,
  };
}
