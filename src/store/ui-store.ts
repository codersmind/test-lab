"use client";

import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  composeOpen: boolean;
  selectedEmailId: string | null;
  searchQuery: string;
  setSidebarOpen: (open: boolean) => void;
  setComposeOpen: (open: boolean) => void;
  setSelectedEmailId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  composeOpen: false,
  selectedEmailId: null,
  searchQuery: "",
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setComposeOpen: (open) => set({ composeOpen: open }),
  setSelectedEmailId: (id) => set({ selectedEmailId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
