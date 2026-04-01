import { motion } from 'framer-motion';

/**
 * Pantalla de carga mientras se verifica la sesión de auth.
 * Se muestra solo al inicio de la app.
 */
export function SplashScreen() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <motion.div
          className="text-5xl mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          🔥
        </motion.div>
        <h1 className="text-2xl font-bold text-accent">
          Richy's Tracker
        </h1>
        <div className="mt-6 flex justify-center">
          <motion.div
            className="w-8 h-1 rounded-full bg-accent"
            animate={{ scaleX: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
}
