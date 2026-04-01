import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabitStore } from '../store';
import { useRewards } from '../hooks';
import { RewardCard } from '../components/RewardCard';
import { RewardForm } from '../components/RewardForm';

interface RewardsPageProps {
  onBack: () => void;
}

export function RewardsPage({ onBack }: RewardsPageProps) {
  const { totalPoints } = useHabitStore();
  const { rewards, canjearReward, deleteReward, createReward, estaDisponible } = useRewards();
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [mostrarCanjeadas, setMostrarCanjeadas] = useState(false);

  const recompensasDisponibles = rewards.filter(r => estaDisponible(r));
  const recompensasCanjeadas = rewards.filter(r => !estaDisponible(r));

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="pb-20"
    >
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-6">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-accent font-bold mb-4 hover:bg-accent/10 px-3 py-2 rounded-lg transition-colors"
        >
          ← Volver
        </button>

        <div className="flex justify-between items-end bg-bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Mis Recompensas</h1>
            <p className="text-sm text-text-secondary mt-1">Canjea tus puntos por premios</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-1">Puntos Disponibles</span>
            <span className="text-3xl font-black text-accent drop-shadow-[0_0_10px_rgba(240,97,26,0.2)]">⭐ {totalPoints}</span>
          </div>
        </div>

        {/* Disponibles */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {recompensasDisponibles.map(reward => (
              <RewardCard 
                key={reward.id} 
                reward={reward} 
                estaDisponible={true}
                onCanjear={() => canjearReward(reward.id)}
                onDelete={() => deleteReward(reward.id)}
                canCanjear={totalPoints >= reward.precioPuntos}
              />
            ))}
            
            <button
              onClick={() => setShowRewardForm(true)}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-border text-text-secondary hover:border-accent hover:text-accent hover:bg-accent/5 transition-all font-bold text-sm"
            >
              + Crear recompensa personalizada
            </button>
          </div>
        </div>

        {/* Canjeadas / Bloqueadas (Colapsable - Mejora 4) */}
        {recompensasCanjeadas.length > 0 && (
          <div className="pt-2">
            <button 
              onClick={() => setMostrarCanjeadas(!mostrarCanjeadas)}
              className="w-full flex justify-between items-center py-3 px-4 bg-bg-elevated/30 border border-border rounded-xl hover:bg-bg-elevated/50 transition-colors"
            >
              <span className="text-text-secondary text-sm font-bold flex items-center gap-2">
                Canjeadas / En espera ({recompensasCanjeadas.length})
              </span>
              <span className="text-text-secondary text-xs">{mostrarCanjeadas ? '▲ Ocultar' : '▼ Mostrar'}</span>
            </button>

            <AnimatePresence>
              {mostrarCanjeadas && (
                <motion.div 
                  className="space-y-3 mt-3 overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="grid grid-cols-1 gap-3">
                    {recompensasCanjeadas.map(reward => (
                      <RewardCard 
                        key={reward.id} 
                        reward={reward} 
                        estaDisponible={false}
                        onCanjear={() => canjearReward(reward.id)}
                        onDelete={() => deleteReward(reward.id)}
                        canCanjear={false}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Form Reward */}
      {showRewardForm && (
        <RewardForm 
          onSubmit={(data) => {
            createReward(data);
            setShowRewardForm(false);
          }} 
          onClose={() => setShowRewardForm(false)} 
        />
      )}
    </motion.div>
  );
}
