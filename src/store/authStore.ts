import { create } from 'zustand';
import type { LocalUser } from '../types';
import { applyAccentColor, DEFAULT_ACCENT } from '../theme/accent';
import { generateId } from '../utils/idUtils';

const STORAGE_KEY = 'richys_local_user';

export const ACCENT_COLORS = [
  { id: 'naranja', label: 'Naranja', value: '#F0611A' },
  { id: 'azul', label: 'Azul', value: '#3B82F6' },
  { id: 'verde', label: 'Verde', value: '#22C55E' },
  { id: 'morado', label: 'Morado', value: '#A855F7' },
  { id: 'rosa', label: 'Rosa', value: '#EC4899' },
] as const;

function loadUser(): LocalUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const user = raw ? JSON.parse(raw) as LocalUser : null;
    applyAccentColor(user?.accentColor);
    return user;
  } catch {
    applyAccentColor(DEFAULT_ACCENT);
    return null;
  }
}

function saveUser(user: LocalUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
}

interface AuthState {
  user: LocalUser | null;
  isLoading: boolean;
  initialize: () => void;
  completeOnboarding: (displayName: string, accentColor: string) => Promise<void>;
  updateProfile: (updates: Partial<LocalUser>) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: loadUser(),
  isLoading: false,

  initialize: () => {
    set({ user: loadUser(), isLoading: false });
  },

  completeOnboarding: async (displayName: string, accentColor: string) => {
    const user: LocalUser = {
      id: generateId(),
      displayName,
      accentColor,
    };
    saveUser(user);
    applyAccentColor(accentColor);
    set({ user });
  },

  updateProfile: async (updates: Partial<LocalUser>) => {
    const current = loadUser();
    if (!current) return;
    const updated = { ...current, ...updates };
    saveUser(updated);
    applyAccentColor(updated.accentColor);
    set({ user: updated });
  },

  logout: () => {
    clearUser();
    applyAccentColor(DEFAULT_ACCENT);
    set({ user: null });
  },
}));
