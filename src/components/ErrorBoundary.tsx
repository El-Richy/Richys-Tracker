import { Component, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-bg-card rounded-2xl border border-border p-8 max-w-sm w-full text-center"
          >
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-text-primary mb-2">Algo salió mal</h1>
            <p className="text-sm text-text-secondary mb-6">
              {this.state.error?.message || 'Error desconocido'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent/90 transition-all"
            >
              Recargar app
            </button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}