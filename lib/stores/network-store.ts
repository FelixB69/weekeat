"use client";

import { create } from "zustand";

interface NetworkState {
  online: boolean;
  queueSize: number;
  setOnline: (online: boolean) => void;
  setQueueSize: (n: number) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  online: typeof navigator !== "undefined" ? navigator.onLine : true,
  queueSize: 0,
  setOnline: (online) => set({ online }),
  setQueueSize: (queueSize) => set({ queueSize }),
}));
