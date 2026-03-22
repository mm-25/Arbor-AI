import { create } from "zustand";

export interface Wireframe {
  id: string;
  title: string;
  sourceNodeIds: string[];
  html: string;
  createdAt: number;
}

interface WireframeState {
  wireframes: Wireframe[];
  isGenerating: boolean;

  addWireframe: (wireframe: Wireframe) => void;
  removeWireframe: (id: string) => void;
  setGenerating: (v: boolean) => void;
  clear: () => void;
  loadWireframes: (wireframes: Wireframe[]) => void;
}

export const useWireframeStore = create<WireframeState>((set, get) => ({
  wireframes: [],
  isGenerating: false,

  addWireframe: (wireframe) => {
    set({ wireframes: [...get().wireframes, wireframe] });
  },

  removeWireframe: (id) => {
    set({ wireframes: get().wireframes.filter((w) => w.id !== id) });
  },

  setGenerating: (isGenerating) => {
    set({ isGenerating });
  },

  clear: () => {
    set({ wireframes: [] });
  },

  loadWireframes: (wireframes) => {
    set({ wireframes });
  },
}));
