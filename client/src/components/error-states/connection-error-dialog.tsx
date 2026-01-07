import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Copy, Check, Bug, WifiOff, Code } from "lucide-react";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { ErrorType } from "@/lib/error-tracker";
import { ErrorMetadata } from "@/contexts/connection-error-context";
import { errorTracker } from "@/lib/error-tracker";

export interface ConnectionErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry?: () => void;
  requestId?: string;
  retryLoading?: boolean;
  errorMetadata?: ErrorMetadata;
}

export function ConnectionErrorDialog({
  open,
  onOpenChange,
  onRetry,
  requestId,
  retryLoading = false,
  errorMetadata
}: ConnectionErrorDialogProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const errorType = errorMetadata?.type || 'network';

  const getErrorConfig = () => {
    switch (errorType) {
      case 'ses':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          title: t('sesError', 'Security Error'),
          description: t('sesErrorDesc', 'A security restriction (SES) is preventing the application from running. This may be caused by a browser extension or proxy. Please try disabling extensions or using a different browser.'),
        };
      case 'lexical':
        return {
          icon: Code,
          iconColor: 'text-red-600 dark:text-red-400',
          title: t('lexicalError', 'Initialization Error'),
          description: t('lexicalErrorDesc', 'A code initialization error occurred. This may be a temporary issue. Please try refreshing the page.'),
        };
      case 'runtime':
        return {
          icon: Bug,
          iconColor: 'text-red-600 dark:text-red-400',
          title: t('runtimeError', 'Runtime Error'),
          description: t('runtimeErrorDesc', 'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.'),
        };
      default:
        return {
          icon: WifiOff,
          iconColor: 'text-orange-600 dark:text-orange-400',
          title: t('connectionError', 'Connection Error'),
          description: t('connectionFailedMessage', 'Connection failed. If the problem persists, please check your internet connection or VPN'),
        };
    }
  };

  const errorConfig = getErrorConfig();
  const Icon = errorConfig.icon;

  const handleCopyRequestDetails = async () => {
    const textToCopy = requestId 
      ? `${requestId}${errorMetadata?.message ? `\n\nError: ${errorMetadata.message}` : ''}`
      : errorMetadata?.message || '';
    
    if (!textToCopy) return;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy request ID:', err);
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry: reload the page
      window.location.reload();
    }
  };

  const handleReportError = () => {
    if (errorMetadata) {
      // Error is already tracked, but we can show a confirmation
      errorTracker.track(
        new Error(errorMetadata.message),
        errorMetadata.type,
        requestId,
        errorMetadata.source,
        errorMetadata.line,
        errorMetadata.column
      );
      alert(t('errorReported', 'Error has been reported. Thank you for your feedback!'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${errorConfig.iconColor}`} />
            <DialogTitle className="text-lg font-semibold">
              {errorConfig.title}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            {errorConfig.description}
          </p>
          
          {(requestId || errorMetadata) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleCopyRequestDetails}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t('copied', 'Copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {t('copyRequestDetails', 'Copy Request Details')}
                    </>
                  )}
                </button>
                {requestId && (
                  <span className="text-xs text-muted-foreground font-mono">
                    ({requestId})
                  </span>
                )}
              </div>
              
              {errorMetadata && (errorType === 'ses' || errorType === 'lexical') && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    {showDetails ? t('hideDetails', 'Hide Details') : t('showDetails', 'Show Details')}
                  </button>
                  
                  {showDetails && (
                    <div className="text-xs bg-slate-50 dark:bg-slate-800 rounded p-2 font-mono break-all">
                      <div className="font-semibold mb-1">{t('errorType', 'Error Type')}: {errorType}</div>
                      {errorMetadata.message && (
                        <div className="mb-1">{t('message', 'Message')}: {errorMetadata.message}</div>
                      )}
                      {errorMetadata.source && (
                        <div className="mb-1">{t('source', 'Source')}: {errorMetadata.source}</div>
                      )}
                      {(errorMetadata.line || errorMetadata.column) && (
                        <div className="mb-1">
                          {t('location', 'Location')}: {errorMetadata.line}:{errorMetadata.column}
                        </div>
                      )}
                      {errorMetadata.stack && process.env.NODE_ENV === 'development' && (
                        <details className="mt-2">
                          <summary className="cursor-pointer">{t('stackTrace', 'Stack Trace')}</summary>
                          <pre className="mt-1 text-[10px] overflow-auto max-h-32">
                            {errorMetadata.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={handleRetry}
              disabled={retryLoading}
              className="flex-1"
              variant="default"
            >
              {retryLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('retrying', 'Retrying...')}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('tryAgain', 'Try Again')}
                </>
              )}
            </Button>
            
            {(errorType === 'ses' || errorType === 'lexical') && errorMetadata && (
              <Button
                onClick={handleReportError}
                variant="outline"
                className="flex-shrink-0"
              >
                <Bug className="h-4 w-4 mr-2" />
                {t('reportError', 'Report')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

