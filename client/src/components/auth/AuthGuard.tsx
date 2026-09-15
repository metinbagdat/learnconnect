import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  /** When set, only users with one of these roles can access. Others redirect to fallbackRedirect. */
  allowedRoles?: string[];
  /** Where to redirect when role check fails. Default: /dashboard */
  fallbackRedirect?: string;
}

export default function AuthGuard({ children, redirectTo = "/login", allowedRoles, fallbackRedirect = "/dashboard" }: AuthGuardProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  const hasAllowedRole = !allowedRoles || allowedRoles.length === 0 || (user?.role && allowedRoles.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      setLocation(redirectTo);
      return;
    }
    if (allowedRoles && allowedRoles.length > 0 && !hasAllowedRole) {
      setLocation(fallbackRedirect);
    }
  }, [isAuthenticated, loading, redirectTo, setLocation, allowedRoles, hasAllowedRole, fallbackRedirect]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated || (allowedRoles && allowedRoles.length > 0 && !hasAllowedRole)) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
