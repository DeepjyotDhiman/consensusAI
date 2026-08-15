import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[UI ErrorBoundary caught an exception]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-left space-y-3 shadow-md my-4">
          <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
            <span>⚠️</span>
            <span>{this.props.fallbackTitle || 'Component Error Intercepted'}</span>
          </div>
          <p className="text-xs text-rose-700 font-medium leading-relaxed">
            {this.state.error?.message || 'A runtime rendering error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all"
          >
            🔄 Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
