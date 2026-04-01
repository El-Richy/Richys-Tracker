import { motion } from 'framer-motion';
import type { Reward } from '../types';

interface RewardCardProps {
  reward: Reward;
  onCanjear: () => void;
  onDelete: () => void;
  canCanjear: boolean;
  estaDisponible: boolean;
}

export function RewardCard({ reward, onCanjear, onDelete, canCanjear, estaDisponible }: RewardCardProps) {
  const diff = reward.ultimoCanjeo ? new Date().getTime() - new Date(reward.ultimoCanjeo).getTime() : 0;
  const diasDesdeUltimo = Math.floor(diff / (1000 * 60 * 60 * 24));
  const diasRestantes = 7 - diasDesdeUltimo;

  const isLockedRecurrent = reward.esRecurrente && !estaDisponible;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative p-4 rounded-2xl border transition-all ${
        !estaDisponible 
          ? 'bg-bg-elevated/40 border-border opacity-70' 
          : 'bg-bg-card border-border shadow-sm'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
          !estaDisponible ? 'bg-bg-primary grayscale' : 'bg-accent/10'
        }`}>
          {reward.icono}
          {reward.esRecurrente && <span className="absolute -top-1 -right-1 text-[10px] bg-accent text-white px-1.5 rounded-full border border-bg-card">∞</span>}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-text-primary truncate">{reward.nombre}</h4>
            {estaDisponible && (
              <button 
                onClick={onDelete}
                className="text-text-secondary hover:text-danger p-2 text-xs -mt-2 -mr-2"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-xs text-text-secondary line-clamp-2 mt-0.5">
            {reward.esRecurrente ? '🔁 Recompensa semanal • ' : ''}
            {reward.descripcion || 'Sin descripción'}
          </p>
          
          <div className="mt-3 flex items-center justify-between">
            <span className={`text-sm font-extrabold ${!estaDisponible ? 'text-text-secondary' : 'text-accent'}`}>
              {reward.precioPuntos} puntos
            </span>
            
            {isLockedRecurrent ? (
              <span className="text-[10px] font-bold text-text-secondary italic">
                Disponible en {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'}
              </span>
            ) : reward.canjeada ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-success">✓ Canjeada</span>
            ) : (
              <button
                onClick={onCanjear}
                disabled={!canCanjear || !estaDisponible}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  canCanjear && estaDisponible
                    ? 'bg-accent text-white hover:bg-accent/90' 
                    : 'bg-bg-elevated text-text-secondary cursor-not-allowed'
                }`}
              >
                {reward.esRecurrente && reward.ultimoCanjeo ? 'Volver a canjear' : 'Canjear'}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
