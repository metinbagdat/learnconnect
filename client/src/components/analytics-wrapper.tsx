import React, { useState, useEffect } from "react";

// Analytics component wrapper that safely handles import errors
// This allows the build to succeed even if @vercel/analytics is not available
export function SafeAnalytics() {
  const [Analytics, setAnalytics] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Dynamically import Analytics at runtime
    // This avoids Vite trying to resolve it during build analysis
    const loadAnalytics = async () => {
      try {
        const module = await import("@vercel/analytics/react");
        if (module?.Analytics) {
          setAnalytics(() => module.Analytics);
        }
      } catch (error) {
        // Silently fail if Analytics can't be loaded
        console.warn("[Analytics] Failed to load @vercel/analytics/react:", error);
      }
    };

    loadAnalytics();
  }, []);

  if (!Analytics) {
    return null;
  }

  return <Analytics />;
}

