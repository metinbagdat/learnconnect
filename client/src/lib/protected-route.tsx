import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect, useState, ComponentType, LazyExoticComponent } from "react";
import { AuthUtils } from "@/lib/utils";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: ComponentType | LazyExoticComponent<ComponentType>;
}) {
  const { user, isLoading } = useAuth();
  const [localUser, setLocalUser] = useState(AuthUtils.getStoredUser());
  
  // Check localStorage for user data as a fallback
  useEffect(() => {
    const storedUser = AuthUtils.getStoredUser();
    setLocalUser(storedUser);
  }, []);
  
  const effectiveUser = user || localUser;

  if (isLoading && !localUser) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!effectiveUser) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
