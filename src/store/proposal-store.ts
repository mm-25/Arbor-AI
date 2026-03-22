import { create } from "zustand";

export interface ProposalUpdateNode {
  id: string;
  label?: string;
  type?: string;
}

export interface ProposalRemoveEdge {
  source: string;
  target: string;
}

export interface Proposal {
  id: string;
  add_nodes: { id: string; label: string; type: string }[];
  add_edges: { source: string; target: string; label?: string }[];
  update_nodes: ProposalUpdateNode[];
  remove_nodes: string[];
  remove_edges: ProposalRemoveEdge[];
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
