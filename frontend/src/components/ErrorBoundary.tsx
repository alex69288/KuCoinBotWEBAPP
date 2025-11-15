import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // eslint-disable-next-line no-console
    console.error('Uncaught error in component tree:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full rounded-lg shadow p-6 text-center">
            <h2 className="text-2xl font-semibold mb-2">Произошла ошибка</h2>
            <p className="text-sm text-gray-600 mb-4">Пожалуйста, откройте консоль разработчика для деталей или перезапустите приложение.</p>
            <pre className="text-xs text-left overflow-auto max-h-40 bg-gray-50 p-2 rounded">{this.state.error?.message}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
