import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore, ACCENT_COLORS } from '../store';
import { applyAccentColor } from '../theme/accent';
import { useFormField } from '../hooks/useFormField';

export function OnboardingForm() {
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(ACCENT_COLORS[0].value);
  const { error, requireField, clearOnChange } = useFormField();

  useEffect(() => {
    applyAccentColor(color);
  }, [color]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!requireField(name, 'Pon tu nombre o apodo para continuar')) return;
    void completeOnboarding(name.trim(), color);
  }

  function handleBlur() {
    requireField(name, 'Pon tu nombre o apodo para continuar');
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Nombre */}
      <div>
        <label
          htmlFor="onboarding-name"
          className="block text-sm text-text-secondary mb-1.5"
        >
          ¿Cómo te llamas?
        </label>
        <input
          id="onboarding-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); clearOnChange(); }}
          onBlur={handleBlur}
          placeholder="Tu nombre o apodo"
          autoComplete="off"
          autoFocus
          maxLength={24}
          aria-describedby="onboarding-name-error"
          className="w-full px-4 py-3 rounded-lg bg-bg-card border border-border text-text-primary placeholder-text-secondary/50 focus:border-accent focus:outline-none transition-colors"
        />
      </div>

      {/* Color */}
      <div>
        <span className="block text-sm text-text-secondary mb-2">
          Elige tu color favorito
        </span>
        <div className="flex justify-between gap-2">
          {ACCENT_COLORS.map((c) => {
            const selected = color === c.value;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.value)}
                aria-label={c.label}
                aria-pressed={selected}
                className={`relative flex-1 aspect-square rounded-full transition-all ${
                  selected
                    ? 'ring-2 ring-offset-2 ring-offset-bg-primary scale-110'
                    : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: c.value,
                  // El ring dinámico solo se aplica cuando está seleccionado.
                  ...(selected ? { ['--tw-ring-color' as string]: c.value } : {}),
                }}
              >
                {selected && (
                  <span className="absolute inset-0 flex items-center justify-center text-white text-lg">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.p
          id="onboarding-name-error"
          className="text-danger text-sm text-center py-2 px-3 rounded-lg bg-danger/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="alert"
        >
          {error}
        </motion.p>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-3 rounded-lg font-semibold text-white hover:active:scale-[0.98] transition-all"
        style={{ backgroundColor: color }}
      >
        Empezar →
      </button>

      <p className="text-center text-[10px] text-text-secondary/70 italic">
        Tus datos se guardan solo en este dispositivo 🔒
      </p>
    </motion.form>
  );
}