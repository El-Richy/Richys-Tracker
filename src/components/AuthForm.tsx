import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (email: string, password: string) => void;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
  onToggleMode: () => void;
}

export function AuthForm({
  mode,
  onSubmit,
  isLoading,
  error,
  onClearError,
  onToggleMode,
}: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    onClearError();

    // Validaciones locales
    if (!email.trim() || !password.trim()) {
      setLocalError('Email y contraseña son obligatorios');
      return;
    }

    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    onSubmit(email.trim(), password);
  }

  function handleToggle() {
    setLocalError(null);
    onClearError();
    setConfirmPassword('');
    onToggleMode();
  }

  const displayError = localError || error;

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      key={mode} // Re-render animación al cambiar modo
    >
      {/* Email */}
      <div>
        <label htmlFor="auth-email" className="block text-sm text-text-secondary mb-1.5">
          Email
        </label>
        <input
          id="auth-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          autoComplete="email"
          className="w-full px-4 py-3 rounded-lg bg-bg-card border border-border text-text-primary placeholder-text-secondary/50 focus:border-accent focus:outline-none transition-colors"
        />
      </div>

      {/* Contraseña */}
      <div>
        <label htmlFor="auth-password" className="block text-sm text-text-secondary mb-1.5">
          Contraseña
        </label>
        <input
          id="auth-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          className="w-full px-4 py-3 rounded-lg bg-bg-card border border-border text-text-primary placeholder-text-secondary/50 focus:border-accent focus:outline-none transition-colors"
        />
      </div>

      {/* Confirmar contraseña (solo en registro) */}
      {isRegister && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <label htmlFor="auth-confirm" className="block text-sm text-text-secondary mb-1.5">
            Confirmar contraseña
          </label>
          <input
            id="auth-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-lg bg-bg-card border border-border text-text-primary placeholder-text-secondary/50 focus:border-accent focus:outline-none transition-colors"
          />
        </motion.div>
      )}

      {/* Error */}
      {displayError && (
        <motion.p
          className="text-danger text-sm text-center py-2 px-3 rounded-lg bg-danger/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {displayError}
        </motion.p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading
          ? 'Cargando...'
          : isRegister
            ? 'Crear cuenta'
            : 'Iniciar sesión'}
      </button>

      {/* Toggle mode */}
      <p className="text-center text-sm text-text-secondary">
        {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
        <button
          type="button"
          onClick={handleToggle}
          className="text-accent hover:underline font-medium"
        >
          {isRegister ? 'Inicia sesión' : 'Regístrate'}
        </button>
      </p>
    </motion.form>
  );
}
