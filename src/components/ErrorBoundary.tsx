import React from 'react';

interface ErrorBoundaryProps {
  name?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error(`[ErrorBoundary:${this.props.name || 'Unnamed'}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 border rounded-md bg-destructive/10 text-destructive text-sm">
          Something went wrong loading this section.
        </div>
      );
    }
    return this.props.children;
  }
}
