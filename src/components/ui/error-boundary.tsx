"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center p-8 gap-3" role="alert">
          <div className="size-12 rounded-2xl glass flex items-center justify-center">
            <AlertTriangle size={22} className="text-neon-pink" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">Something went wrong</h3>
          <p className="text-[11px] text-text-tertiary text-center max-w-xs">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass text-text-primary text-[11px] font-medium hover:bg-glass-medium transition-all"
          >
            <RefreshCw size={13} />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
