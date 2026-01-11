import { Component, type ReactNode } from "react";
import { logger } from "../lib/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic error boundary component that catches rendering errors in child components.
 * Prevents full app crashes by showing a fallback UI instead.
 *
 * Usage:
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <ComponentThatMightFail />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console and any configured error service
    logger.error("Error boundary caught error:", error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // If fallback is a function, call it with error and reset function
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // If custom fallback provided, render it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Default error fallback UI - generic error message
 */
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="text-center">
        <svg
          className="w-12 h-12 text-red-500 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-red-700 dark:text-red-300 mb-4">
          {error.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={resetError}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

/**
 * Map-specific error fallback UI
 */
export function MapErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center w-full h-full bg-surface-secondary border border-border rounded-lg">
      <div className="text-center p-6">
        <svg
          className="w-16 h-16 text-text-muted mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Map failed to load
        </h3>
        <p className="text-sm text-text-muted mb-4 max-w-sm">
          {error.message.includes("token") || error.message.includes("access")
            ? "Map service is unavailable. Please check your connection."
            : "Unable to display map. Please try refreshing."}
        </p>
        <button
          onClick={resetError}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Reload Map
        </button>
      </div>
    </div>
  );
}

/**
 * Image/attachment-specific error fallback UI
 */
export function ImageErrorFallback() {
  return (
    <div className="flex items-center justify-center p-4 bg-surface-secondary border border-border rounded-lg">
      <div className="text-center">
        <svg
          className="w-10 h-10 text-text-muted mx-auto mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-xs text-text-muted">Failed to load image</p>
      </div>
    </div>
  );
}

/**
 * Compact error fallback for list items and small components
 */
export function CompactErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
      <svg
        className="w-4 h-4 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="truncate">{error.message || "Error loading item"}</span>
    </div>
  );
}
