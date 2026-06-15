"use client";

import { create } from "zustand";
import type { ComposeState } from "@/types";

interface UIStore {
  sidebarOpen: boolean;
  composeOpen: boolean;
  composeState: ComposeState | null;
  selectedEmailId: string | null;
  searchQuery: string;
  mailRefreshKey: number;
  setSidebarOpen: (open: boolean) => void;
  openCompose: (state?: ComposeState | null) => void;
  setComposeOpen: (open: boolean) => void;
  setSelectedEmailId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  refreshMail: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  composeOpen: false,
  composeState: null,
  selectedEmailId: null,
  searchQuery: "",
  mailRefreshKey: 0,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openCompose: (state = null) =>
    set({ composeOpen: true, composeState: state ?? { mode: "new" } }),
  setComposeOpen: (open) =>
    set((s) => ({
      composeOpen: open,
      composeState: open ? s.composeState : null,
    })),
  setSelectedEmailId: (id) => set({ selectedEmailId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  refreshMail: () => set((s) => ({ mailRefreshKey: s.mailRefreshKey + 1 })),
}));
