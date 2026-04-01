import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store';
import { AuthForm } from '../components/AuthForm';

/**
 * Pantalla de autenticación.
 * Toggle entre login y registro con animaciones.
 */
export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { login, register, isLoading, error, clearError } = useAuthStore();

  function handleSubmit(email: string, password: string) {
    if (mode === 'login') {
      login(email, password);
    } else {
      register(email, password);
    }
  }

  function handleToggleMode() {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo + título */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-5xl mb-3">🔥</div>
          <h1 className="text-3xl font-bold text-accent">
            Richy's Tracker
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            {mode === 'login'
              ? 'Bienvenido de vuelta'
              : 'Crea tu cuenta para empezar'}
          </p>
        </motion.div>

        {/* Formulario */}
        <AuthForm
          mode={mode}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
          onClearError={clearError}
          onToggleMode={handleToggleMode}
        />
      </div>
    </div>
  );
}
