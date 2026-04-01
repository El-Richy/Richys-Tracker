import { motion } from 'framer-motion';

interface SubtaskItemProps {
  nombre: string;
  isCompleted: boolean;
  onToggle: () => void;
}

export function SubtaskItem({ nombre, isCompleted, onToggle }: SubtaskItemProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-3 w-full py-2 px-1 rounded-md hover:bg-bg-elevated/50 transition-colors text-left"
      whileTap={{ scale: 0.98 }}
    >
      {/* Checkbox visual */}
      <div
        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          isCompleted
            ? 'bg-accent border-accent'
            : 'border-text-secondary/40 bg-transparent'
        }`}
      >
        {isCompleted && (
          <motion.svg
            viewBox="0 0 12 12"
            className="w-2.5 h-2.5 text-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <path
              d="M2 6L5 9L10 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </div>

      {/* Nombre */}
      <span
        className={`text-sm transition-colors ${
          isCompleted ? 'text-text-secondary line-through' : 'text-text-primary'
        }`}
      >
        {nombre}
      </span>
    </motion.button>
  );
}
