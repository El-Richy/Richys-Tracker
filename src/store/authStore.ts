import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  isLoading: true, // true al inicio mientras se verifica sesión
  error: null,

  initialize: async () => {
    try {
      // Recuperar sesión existente
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      set({
        session: data.session,
        user: data.session?.user ?? null,
        isLoading: false,
      });

      // Listener para cambios de autenticación (login, logout, token refresh)
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al inicializar sesión';
      console.error('Auth init error:', message);
      set({ isLoading: false, error: message });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // onAuthStateChange se encarga de actualizar user/session
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      // onAuthStateChange se encarga de actualizar user/session
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al registrarse';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
      // Aún así limpiamos el estado local
    }
    set({ user: null, session: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
