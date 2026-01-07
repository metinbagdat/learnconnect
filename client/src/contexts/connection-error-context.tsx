import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { ErrorType } from "@/lib/error-tracker";

export interface ErrorMetadata {
  type: ErrorType;
  message: string;
  stack?: string;
  source?: string;
  line?: number;
  column?: number;
}

interface ConnectionErrorContextType {
  showError: (requestId?: string, metadata?: ErrorMetadata) => void;
  hideError: () => void;
  isOpen: boolean;
  requestId: string | undefined;
  errorMetadata: ErrorMetadata | undefined;
  retry: () => void;
  setRetryCallback: (callback: () => void) => void;
  retryLoading: boolean;
  setRetryLoading: (loading: boolean) => void;
}

const ConnectionErrorContext = createContext<ConnectionErrorContextType | undefined>(undefined);

export function ConnectionErrorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [requestId, setRequestId] = useState<string | undefined>();
  const [errorMetadata, setErrorMetadata] = useState<ErrorMetadata | undefined>();
  const [retryCallback, setRetryCallbackState] = useState<(() => void) | undefined>();
  const [retryLoading, setRetryLoading] = useState(false);

  const showError = useCallback((id?: string, metadata?: ErrorMetadata) => {
    setRequestId(id);
    setErrorMetadata(metadata);
    setIsOpen(true);
  }, []);

  const hideError = useCallback(() => {
    setIsOpen(false);
    setRequestId(undefined);
    setErrorMetadata(undefined);
    setRetryCallbackState(undefined);
  }, []);

  const retry = useCallback(() => {
    if (retryCallback) {
      setRetryLoading(true);
      try {
        retryCallback();
      } finally {
        // Reset loading after a delay to allow the request to complete
        setTimeout(() => setRetryLoading(false), 1000);
      }
    } else {
      // Default: reload the page
      window.location.reload();
    }
  }, [retryCallback]);

  const setRetryCallback = useCallback((callback: () => void) => {
    setRetryCallbackState(() => callback);
  }, []);

  return (
    <ConnectionErrorContext.Provider
      value={{
        showError,
        hideError,
        isOpen,
        requestId,
        errorMetadata,
        retry,
        setRetryCallback,
        retryLoading,
        setRetryLoading,
      }}
    >
      {children}
    </ConnectionErrorContext.Provider>
  );
}

export function useConnectionError() {
  const context = useContext(ConnectionErrorContext);
  if (!context) {
    throw new Error("useConnectionError must be used within ConnectionErrorProvider");
  }
  return context;
}

