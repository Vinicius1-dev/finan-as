import { create } from "zustand";

export type ViewKey =
  | "dashboard"
  | "transactions"
  | "accounts"
  | "categories"
  | "budgets"
  | "goals"
  | "reports";

interface FinProState {
  activeView: ViewKey;
  setActiveView: (view: ViewKey) => void;
  // evento global para forçar refresh do dashboard quando algo muda
  refreshKey: number;
  triggerRefresh: () => void;
}

export const useFinProStore = create<FinProState>((set) => ({
  activeView: "dashboard",
  setActiveView: (view) => set({ activeView: view }),
  refreshKey: 0,
  triggerRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
}));
