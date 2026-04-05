import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected application error.' };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-xl w-full rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            <p className="font-bold mb-2">App failed to render.</p>
            <p className="text-sm">{this.state.message}</p>
            <p className="text-xs mt-3">Open browser console for stack trace details.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
