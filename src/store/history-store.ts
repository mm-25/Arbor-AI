import { create } from "zustand";
import type { MindMapNode, MindMapEdge } from "./mindmap-store";

const MAX_HISTORY = 50;

export interface GraphSnapshot {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

interface HistoryState {
  past: GraphSnapshot[];
  future: GraphSnapshot[];
  _isDragging: boolean;
  _paused: boolean;

  /**
   * Push a snapshot of the current graph state before a mutation.
   * Clears the future stack (new edit branch).
   */
  pushSnapshot: (snapshot: GraphSnapshot) => void;

  /**
   * Undo: pop the most recent past snapshot and return it.
   * The caller passes the current state so it can be pushed to future.
   */
  undo: (current: GraphSnapshot) => GraphSnapshot | null;

  /**
   * Redo: pop the most recent future snapshot and return it.
   * The caller passes the current state so it can be pushed to past.
   */
  redo: (current: GraphSnapshot) => GraphSnapshot | null;

  /** Clear all history (e.g. on session switch). */
  clear: () => void;

  setDragging: (v: boolean) => void;
  setPaused: (v: boolean) => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  _isDragging: false,
  _paused: false,

  pushSnapshot: (snapshot) => {
    if (get()._paused) return;
    set((state) => ({
      past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
      future: [], // new edit branch — discard redo stack
    }));
  },

  undo: (current) => {
    const { past } = get();
    if (past.length === 0) return null;

    const snapshot = past[past.length - 1];
    set((state) => ({
      past: state.past.slice(0, -1),
      future: [...state.future, current],
    }));
    return snapshot;
  },

  redo: (current) => {
    const { future } = get();
    if (future.length === 0) return null;

    const snapshot = future[future.length - 1];
    set((state) => ({
      past: [...state.past, current],
      future: state.future.slice(0, -1),
    }));
    return snapshot;
  },

  clear: () => {
    set({ past: [], future: [] });
  },

  setDragging: (v) => {
    set({ _isDragging: v });
  },

  setPaused: (v) => {
    set({ _paused: v });
  },
}));
