import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserDTO } from "@acaixinha/shared";
import {
  type TokenSet,
  refreshTokens,
  parseIdToken,
  getLogoutUrl,
} from "../lib/cognito";
import { apiGet, apiPatch } from "../lib/api/client";

interface AuthState {
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: UserDTO | null;
  isAuthenticated: boolean;

  setSession: (tokens: TokenSet) => void;
  setUser: (user: UserDTO) => void;
  refreshAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    avatarUrl?: string;
    description?: string;
  }) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      idToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isAuthenticated: false,

      setSession: (tokens: TokenSet) => {
        const claims = parseIdToken(tokens.idToken);
        set({
          accessToken: tokens.accessToken,
          idToken: tokens.idToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          isAuthenticated: true,
        });

        get().fetchUser();
      },

      setUser: (user: UserDTO) => set({ user }),

      refreshAuth: async () => {
        const state = get();
        if (!state.refreshToken) throw new Error("No refresh token");
        const tokens = await refreshTokens(state.refreshToken);
        set({
          accessToken: tokens.accessToken,
          idToken: tokens.idToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        });
      },

      fetchUser: async () => {
        const state = get();
        if (!state.idToken) return;
        const claims = parseIdToken(state.idToken);
        try {
          const user = await apiGet<UserDTO>(`/users/${claims.sub}`);
          set({ user });
        } catch {
          // User may not exist yet (just registered)
        }
      },

      updateProfile: async (data) => {
        const state = get();
        if (!state.user) return;
        const updated = await apiPatch<UserDTO>(`/users/${state.user.id}`, data);
        set({ user: updated });
      },

      logout: () => {
        set({
          accessToken: null,
          idToken: null,
          refreshToken: null,
          expiresAt: null,
          user: null,
          isAuthenticated: false,
        });
        window.location.href = getLogoutUrl();
      },
    }),
    {
      name: "acaixinha-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        idToken: state.idToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);