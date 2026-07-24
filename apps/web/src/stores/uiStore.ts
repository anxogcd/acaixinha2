import { create } from "zustand";
import { persist } from "zustand/middleware";

type Language = "es" | "gl";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface UiState {
  language: Language;
  sidebarOpen: boolean;
  toasts: Toast[];

  setLanguage: (lang: Language) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      language: "gl",
      sidebarOpen: true,
      toasts: [],

      setLanguage: (language: Language) => set({ language }),

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      setSidebarOpen: (sidebarOpen: boolean) => set({ sidebarOpen }),

      addToast: (toast) =>
        set((s) => ({
          toasts: [
            ...s.toasts,
            { ...toast, id: Math.random().toString(36).slice(2) },
          ],
        })),

      removeToast: (id: string) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: "acaixinha-ui",
      partialize: (state) => ({ language: state.language }),
    },
  ),
);