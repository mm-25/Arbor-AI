import { create } from "zustand";

export type CanvasTool = "select" | "hand" | "connect";

/** View and gesture state is transient; it never belongs in graph history. */
export const useEditorStore = create<{
  fitRequest: number;
  requestFit: () => void;
  tool: CanvasTool;
  direction: "AUTO" | "LR" | "TB";
  setDirection: (direction: "AUTO" | "LR" | "TB") => void;
  setTool: (tool: CanvasTool) => void;
}>((set) => ({
  fitRequest: 0,
  requestFit: () => set((s) => ({ fitRequest: s.fitRequest + 1 })),
  tool: "select",
  direction: "AUTO",
  setDirection: (direction) => set({ direction }),
  setTool: (tool) => set({ tool }),
}));
