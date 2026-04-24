"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  darkMode: boolean;
  notifications: boolean;
  reminders: boolean;
  checkedItems: Record<string, string[]>; // weekStart → item names
  setDarkMode: (v: boolean) => void;
  setNotifications: (v: boolean) => void;
  setReminders: (v: boolean) => void;
  toggleChecked: (weekStart: string, name: string) => void;
  resetChecked: (weekStart: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      darkMode: false,
      notifications: true,
      reminders: true,
      checkedItems: {},
      setDarkMode: (v) => set({ darkMode: v }),
      setNotifications: (v) => set({ notifications: v }),
      setReminders: (v) => set({ reminders: v }),
      toggleChecked: (weekStart, name) =>
        set((s) => {
          const current = s.checkedItems[weekStart] ?? [];
          const has = current.includes(name);
          return {
            checkedItems: {
              ...s.checkedItems,
              [weekStart]: has ? current.filter((n) => n !== name) : [...current, name],
            },
          };
        }),
      resetChecked: (weekStart) =>
        set((s) => ({
          checkedItems: { ...s.checkedItems, [weekStart]: [] },
        })),
    }),
    { name: "weekeat-ui" }
  )
);
