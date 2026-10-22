import { motion } from 'framer-motion';
import { OnboardingForm } from '../components/OnboardingForm';

/**
 * Pantalla de onboarding (reemplaza a AuthPage).
 * Se muestra si no hay usuario local guardado todavía.
 */
export function OnboardingPage() {
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
          <h1 className="text-3xl font-bold text-accent">Richy's Tracker</h1>
          <p className="text-text-secondary mt-2 text-sm">
            Personaliza tu tracker y empieza a construir hábitos
          </p>
        </motion.div>

        {/* Formulario */}
        <OnboardingForm />
      </div>
    </div>
  );
}