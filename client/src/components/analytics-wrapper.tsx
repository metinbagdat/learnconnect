import React, { useState, useEffect, ErrorInfo, Component } from "react";
import { errorTracker } from "@/lib/error-tracker";

// Track SES warnings instead of just suppressing them
// SES (Secure EcmaScript) is a security mechanism that may cause warnings
// We track them for debugging but suppress console noise
if (typeof window !== "undefined") {
  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args.join(" ");
    // Check if this is a SES-related warning
    const isSESWarning = 
      message.includes("SES") ||
      message.includes("lockdown-install") ||
      message.includes("lockdown") ||
      (message.includes("before initialization") && message.includes("SES"));
    
    if (isSESWarning) {
      // Track SES warnings for debugging (but don't spam console)
      errorTracker.track(
        new Error(`SES Warning: ${message}`),
        'ses',
        undefined,
        'analytics-wrapper'
      );
      // Suppress console output to reduce noise
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}

// Error boundary for Analytics component
class AnalyticsErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error but don't break the app
    console.warn("[Analytics] Error boundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Silently fail - analytics is not critical for app functionality
      return null;
    }

    return this.props.children;
  }
}

// Analytics component wrapper that safely handles import errors
// This allows the build to succeed even if @vercel/analytics is not available
export function SafeAnalytics() {
  const [Analytics, setAnalytics] = useState<React.ComponentType | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    // Only load analytics in production
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    // Dynamically import Analytics at runtime
    // This avoids Vite trying to resolve it during build analysis
    const loadAnalytics = async () => {
      try {
        // @ts-ignore - Dynamic import, types may not be available at build time
        const module = await import("@vercel/analytics/react").catch(() => null);
        if (module?.Analytics) {
          setAnalytics(() => module.Analytics);
        }
      } catch (error) {
        // Silently fail if Analytics can't be loaded
        setLoadError(error as Error);
        console.warn("[Analytics] Failed to load @vercel/analytics/react:", error);
      }
    };

    loadAnalytics();
  }, []);

  // Don't render if there was a load error or Analytics is not available
  if (loadError || !Analytics) {
    return null;
  }

  return (
    <AnalyticsErrorBoundary>
      <Analytics />
    </AnalyticsErrorBoundary>
  );
}

