import { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { errorTracker, ErrorType } from "@/lib/error-tracker";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Detect error type
    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';
    
    let errorType: ErrorType = 'runtime';
    
    // Check for SES errors
    if (
      errorMessage.includes('ses') ||
      errorMessage.includes('lockdown') ||
      errorStack.includes('lockdown-install.js') ||
      errorMessage.includes('ses_uncaught_exception')
    ) {
      errorType = 'ses';
    }
    // Check for lexical declaration errors
    else if (
      errorMessage.includes("can't access lexical declaration") ||
      errorMessage.includes('before initialization') ||
      errorMessage.includes('temporal dead zone')
    ) {
      errorType = 'lexical';
    }
    
    // Report to error tracker
    errorTracker.track(error, errorType, undefined, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return <ErrorFallback 
        error={this.state.error} 
        onRetry={this.handleRetry}
        onGoHome={this.handleGoHome}
      />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  onRetry: () => void;
  onGoHome: () => void;
}

function ErrorFallback({ error, onRetry, onGoHome }: ErrorFallbackProps) {
  // Use hardcoded strings to ensure ErrorBoundary never crashes due to context failures
  const strings = {
    unexpectedError: 'Something Went Wrong',
    errorBoundaryDescription: 'An unexpected error occurred. We apologize for the inconvenience.',
    errorDetails: 'Error Details',
    tryAgain: 'Try Again',
    goHome: 'Go Home'
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {strings.unexpectedError}
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            {strings.errorBoundaryDescription}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <details className="text-sm bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <summary className="cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                {strings.errorDetails}
              </summary>
              <code className="mt-2 block text-xs text-slate-600 dark:text-slate-400 overflow-auto">
                {error.message}
              </code>
            </details>
          )}
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={onRetry} 
              className="w-full"
              data-testid="button-retry"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {strings.tryAgain}
            </Button>
            
            <Button 
              onClick={onGoHome} 
              variant="outline" 
              className="w-full"
              data-testid="button-home"
            >
              <Home className="h-4 w-4 mr-2" />
              {strings.goHome}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}