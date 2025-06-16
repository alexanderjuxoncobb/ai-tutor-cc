/**
 * Error boundary component for catching and handling React errors gracefully
 */

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from './ui';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console and call onError callback
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary__container">
            <h2 className="error-boundary__title">
              ⚠️ Something went wrong
            </h2>
            
            <p className="error-boundary__message">
              An unexpected error occurred in the application. This has been logged for investigation.
            </p>

            <div className="error-boundary__actions">
              <Button
                variant="primary"
                onClick={this.handleReset}
              >
                🔄 Try Again
              </Button>
              
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
              >
                🔃 Reload Page
              </Button>
            </div>

            {/* Show error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary__details">
                <summary className="error-boundary__details-summary">
                  🔍 Error Details (Development Only)
                </summary>
                <div className="error-boundary__error-content">
                  <h4>Error:</h4>
                  <pre className="error-boundary__error-text">
                    {this.state.error.toString()}
                  </pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre className="error-boundary__error-text">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for hooks support
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  name?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export const ErrorBoundaryWrapper: React.FC<ErrorBoundaryWrapperProps> = ({
  children,
  name = 'Component',
  onError
}) => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Enhanced logging with component name
    console.error(`ErrorBoundary in ${name} caught an error:`, error, errorInfo);
    
    if (onError) {
      onError(error, errorInfo);
    }
  };

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};