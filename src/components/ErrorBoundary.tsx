// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and display React errors gracefully.
 * Prevents the entire app from crashing when a component error occurs.
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-[#00cc66] font-mono flex items-center justify-center p-4">
          <div className="bg-black border border-red-500 p-6 rounded-lg shadow-[0_0_10px_#ff0000] w-full max-w-2xl">
            <h1 className="text-2xl font-bold mb-4 text-red-500 text-center">
              Something went wrong
            </h1>
            <div className="mb-4 p-4 bg-black border border-red-500/30 rounded">
              <p className="text-red-400 mb-2">
                <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[#00cc66] hover:text-[#00ff88]">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-60 text-red-300">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="border border-[#00cc66] text-[#00cc66] px-6 py-2 rounded hover:bg-[#00cc66] hover:text-black transition font-mono"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="border border-[#00cc66] text-[#00cc66] px-6 py-2 rounded hover:bg-[#00cc66] hover:text-black transition font-mono"
              >
                Reload Page
              </button>
            </div>
            <p className="mt-4 text-center text-sm text-[#00cc66]/70">
              If this issue persists, please refresh the page or check your wallet connection.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
