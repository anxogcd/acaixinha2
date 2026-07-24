import { create } from "zustand";
import type { MemoryDTO } from "@acaixinha/shared";
import type { PaginatedResponse } from "@acaixinha/shared";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/api/client";

interface MemoryFilters {
  text?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

interface MemoryState {
  memories: MemoryDTO[];
  currentMemory: MemoryDTO | null;
  isLoading: boolean;
  error: string | null;
  filters: MemoryFilters;

  fetchMemories: () => Promise<void>;
  fetchMemory: (id: string) => Promise<void>;
  createMemory: (data: {
    title: string;
    description: string;
    memoryDate: string;
    locationName?: string;
    coordinates?: { lat: number; lng: number };
    tags?: string[];
  }) => Promise<MemoryDTO>;
  updateMemory: (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      memoryDate: string;
      locationName: string | null;
      coordinates: { lat: number; lng: number } | null;
      tags: string[];
    }>,
  ) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  searchMemories: (filters: MemoryFilters) => Promise<void>;
  shareMemory: (memoryId: string, targetUserId: string) => Promise<void>;
  unshareMemory: (memoryId: string, targetUserId: string) => Promise<void>;
  setFilters: (filters: MemoryFilters) => void;
  clearError: () => void;
}

export const useMemoryStore = create<MemoryState>()((set, get) => ({
  memories: [],
  currentMemory: null,
  isLoading: false,
  error: null,
  filters: {},

  fetchMemories: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<MemoryDTO[]>("/memories");
      set({ memories: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchMemory: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<MemoryDTO>(`/memories/${id}`);
      set({ currentMemory: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createMemory: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const memory = await apiPost<MemoryDTO>("/memories", data);
      set((s) => ({ memories: [memory, ...s.memories], isLoading: false }));
      return memory;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  updateMemory: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiPatch<MemoryDTO>(`/memories/${id}`, data);
      set((s) => ({
        memories: s.memories.map((m) => (m.id === id ? updated : m)),
        currentMemory: s.currentMemory?.id === id ? updated : s.currentMemory,
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  deleteMemory: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiDelete(`/memories/${id}`);
      set((s) => ({
        memories: s.memories.filter((m) => m.id !== id),
        currentMemory: s.currentMemory?.id === id ? null : s.currentMemory,
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  searchMemories: async (filters: MemoryFilters) => {
    set({ isLoading: true, error: null, filters });
    try {
      const params = new URLSearchParams();
      if (filters.text) params.set("text", filters.text);
      if (filters.tags?.length) params.set("tags", filters.tags.join(","));
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      const data = await apiGet<MemoryDTO[]>(`/memories/search?${params}`);
      set({ memories: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  shareMemory: async (memoryId: string, targetUserId: string) => {
    await apiPost(`/memories/${memoryId}/share`, { targetUserId });
    get().fetchMemory(memoryId);
  },

  unshareMemory: async (memoryId: string, targetUserId: string) => {
    await apiDelete(`/memories/${memoryId}/share/${targetUserId}`);
    get().fetchMemory(memoryId);
  },

  setFilters: (filters: MemoryFilters) => set({ filters }),

  clearError: () => set({ error: null }),
}));