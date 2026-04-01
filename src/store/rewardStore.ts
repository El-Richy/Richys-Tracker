import { create } from 'zustand';
import type { Reward } from '../types';

interface RewardState {
  rewards: Reward[];
  isLoading: boolean;
  
  setRewards: (rewards: Reward[]) => void;
  addReward: (reward: Reward) => void;
  updateReward: (id: string, diff: Partial<Reward>) => void;
  removeReward: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useRewardStore = create<RewardState>((set) => ({
  rewards: [],
  isLoading: true,

  setRewards: (rewards) => set({ rewards }),
  
  addReward: (reward) =>
    set((state) => ({
      rewards: [reward, ...state.rewards],
    })),
    
  updateReward: (id, diff) =>
    set((state) => ({
      rewards: state.rewards.map((r) => (r.id === id ? { ...r, ...diff } : r)),
    })),
    
  removeReward: (id) =>
    set((state) => ({
      rewards: state.rewards.filter((r) => r.id !== id),
    })),
    
  setLoading: (loading) => set({ isLoading: loading }),
}));
