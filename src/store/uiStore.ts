import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export type QuickAction = 'note' | 'journal' | 'photo';

interface UiState {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  quickAction: QuickAction | null;
  openQuickAction: (action: QuickAction) => void;
  clearQuickAction: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  toasts: [],
  showToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  quickAction: null,
  openQuickAction: (action) => set({ quickAction: action }),
  clearQuickAction: () => set({ quickAction: null }),
}));
