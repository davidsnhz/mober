import { create } from 'zustand';

export interface ToastOptions {
  message: string;
  /** Texto del botón, por ejemplo "Deshacer". */
  actionLabel?: string;
  onAction?: () => void;
  /** Tiempo en pantalla. Por defecto, 5 segundos. */
  durationMs?: number;
}

export interface Toast extends ToastOptions {
  id: number;
}

interface ToastState {
  toast: Toast | null;
  show: (options: ToastOptions) => void;
  hide: () => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (options) => set({ toast: { ...options, id: nextId++ } }),
  hide: () => set({ toast: null }),
}));

/** Muestra un aviso breve en la parte inferior de la pantalla. */
export function showToast(options: ToastOptions): void {
  useToastStore.getState().show(options);
}
