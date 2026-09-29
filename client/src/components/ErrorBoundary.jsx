import React, { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Exception caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 text-center text-slate-800">
          <div className="max-w-md w-full bg-slate-200/60 border border-slate-300/80 p-8 rounded-2xl shadow-xl">
            <h1 className="text-xl font-bold text-rose-600 mb-3">Something went wrong</h1>
            <p className="text-sm text-slate-600 mb-6">
              An unexpected application error occurred. Please refresh the page or return home.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
