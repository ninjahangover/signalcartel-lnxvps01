"use client";

import React from 'react';
import { Alert } from './ui/alert';
import { Button } from './ui/button';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-red-800">Application Error</h2>
                <p className="text-sm text-red-700">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      this.setState({ hasError: false, error: null });
                      window.location.reload();
                    }}
                    variant="destructive"
                    size="sm"
                  >
                    Reload Application
                  </Button>
                </div>
              </div>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
