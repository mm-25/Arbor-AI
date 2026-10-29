import { create } from "zustand";

export interface ProposalUpdateNode {
  id: string;
  label?: string;
  type?: string;
}

export interface ProposalRemoveEdge {
  id?: string;
  source: string;
  target: string;
}

export interface Proposal {
  id: string;
  add_nodes: {
    id: string;
    label: string;
    type: string;
    role?: "concept" | "question" | "suggestion";
  }[];
  add_edges: {
    source: string;
    target: string;
    label?: string;
    relation?: string;
  }[];
  update_nodes: ProposalUpdateNode[];
  remove_nodes: string[];
  remove_edges: ProposalRemoveEdge[];
  update_edges?: { id: string; label?: string; relation?: string }[];
  layout?: import("@/lib/layout-command").LayoutCommand;
  layoutNodeIds?: string[];
  origin?: { sessionId: string | null; epoch: number; graph: string };
  status: "pending" | "accepted" | "rejected";
}

interface ProposalState {
  pending: Proposal | null;
  setPending: (proposal: Proposal) => void;
  clearPending: () => void;
  resolveProposal: (status: "accepted" | "rejected") => void;
}

export const useProposalStore = create<ProposalState>((set, get) => ({
  pending: null,

  setPending: (proposal) => set({ pending: proposal }),

  clearPending: () => set({ pending: null }),

  resolveProposal: (status) => {
    const current = get().pending;
    if (current) {
      set({ pending: { ...current, status } });
    }
  },
}));
