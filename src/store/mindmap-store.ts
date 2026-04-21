import { create } from "zustand";
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Connection,
  type NodeChange,
} from "@xyflow/react";
import type { Proposal } from "./proposal-store";
import { useHistoryStore } from "./history-store";
import { placeNewNodesIncrementally } from "@/lib/incremental-layout";

export type NodeType = "rectangle" | "rounded-rect" | "circle" | "diamond";

export interface MindMapNodeData {
  label: string;
  type: NodeType;
  source: "manual" | "text" | "voice";
  icon?: string;
  color?: string;
  [key: string]: unknown;
}

export type MindMapNode = Node<MindMapNodeData>;
export type MindMapEdge = Edge;

interface MindMapState {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  onNodesChange: OnNodesChange<MindMapNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: MindMapNode) => void;
  addNodesAndEdges: (nodes: MindMapNode[], edges: MindMapEdge[]) => void;
  setNodesAndEdges: (nodes: MindMapNode[], edges: MindMapEdge[], skipHistory?: boolean) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeStyle: (nodeId: string, style: { icon?: string; color?: string; type?: NodeType }) => void;
  updateEdgeLabel: (edgeId: string, label: string) => void;
  deleteSelected: () => void;
  clear: () => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
  setNodeHighlights: (highlights: Map<string, "update" | "remove">) => void;
  setEdgeHighlights: (highlights: Map<string, "update" | "remove">) => void;
  clearAllHighlights: () => void;
  applyProposal: (proposal: Proposal) => void;
  performUndo: () => void;
  performRedo: () => void;
}

const STORAGE_KEY = "mindmap-data";

/**
 * Capture a clean snapshot of the current graph state and push it to the
 * undo history. Strips out transient `proposalHighlight` data so snapshots
 * only contain real graph content.
 */
function pushUndo() {
  const historyStore = useHistoryStore.getState();
  if (historyStore._paused) return;

  const { nodes, edges } = useMindMapStore.getState();

  // Strip proposalHighlight from node data for clean snapshots
  const cleanNodes = nodes.map((n) => {
    if (n.data.proposalHighlight) {
      const { proposalHighlight: _, ...rest } = n.data;
      return { ...n, data: rest as MindMapNodeData };
    }
    return n;
  });

  // Strip proposalHighlight from edge data
  const cleanEdges = edges.map((e) => {
    if ((e.data as Record<string, unknown>)?.proposalHighlight) {
      const { proposalHighlight: _, ...rest } = e.data as Record<string, unknown>;
      return { ...e, data: rest };
    }
    return e;
  });

  historyStore.pushSnapshot({ nodes: cleanNodes, edges: cleanEdges });
}

export const useMindMapStore = create<MindMapState>((set, get) => ({
  nodes: [],
  edges: [],

  onNodesChange: (changes) => {
    const historyStore = useHistoryStore.getState();

    // Detect drag start / end for debouncing position history
    const hasPositionDrag = changes.some(
      (c: NodeChange<MindMapNode>) =>
        c.type === "position" && "dragging" in c && c.dragging === true
    );
    const hasDragEnd = changes.some(
      (c: NodeChange<MindMapNode>) =>
        c.type === "position" && "dragging" in c && c.dragging === false
    );
    const hasRemove = changes.some(
      (c: NodeChange<MindMapNode>) => c.type === "remove"
    );

    // Push undo on drag START only (not during continuous drag)
    if (hasPositionDrag && !historyStore._isDragging) {
      pushUndo();
      historyStore.setDragging(true);
    }
    if (hasDragEnd) {
      historyStore.setDragging(false);
    }

    // Push undo for node removals via ReactFlow delete key
    if (hasRemove && !historyStore._isDragging) {
      pushUndo();
    }

    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    const hasRemove = changes.some((c) => c.type === "remove");
    if (hasRemove) {
      pushUndo();
    }
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection: Connection) => {
    pushUndo();
    set({
      edges: addEdge(
        {
          ...connection,
          type: "editable",
          label: "",
        },
        get().edges
      ),
    });
  },

  addNode: (node) => {
    pushUndo();
    set({ nodes: [...get().nodes, node] });
  },

  addNodesAndEdges: (newNodes, newEdges) => {
    pushUndo();
    set({
      nodes: [...get().nodes, ...newNodes],
      edges: [...get().edges, ...newEdges],
    });
  },

  setNodesAndEdges: (nodes, edges, skipHistory) => {
    if (!skipHistory) pushUndo();
    set({ nodes, edges });
  },

  updateNodeLabel: (nodeId, label) => {
    pushUndo();
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, label } } : n
      ),
    });
  },

  updateNodeStyle: (nodeId, style) => {
    pushUndo();
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                ...(style.icon !== undefined && { icon: style.icon }),
                ...(style.color !== undefined && { color: style.color }),
                ...(style.type !== undefined && { type: style.type }),
              },
            }
          : n
      ),
    });
  },

  updateEdgeLabel: (edgeId, label) => {
    pushUndo();
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId ? { ...e, label } : e
      ),
    });
  },

  deleteSelected: () => {
    pushUndo();
    set({
      nodes: get().nodes.filter((n) => !n.selected),
      edges: get().edges.filter((e) => !e.selected),
    });
  },

  clear: () => {
    pushUndo();
    set({ nodes: [], edges: [] });
  },

  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const { nodes, edges } = JSON.parse(raw);
        set({ nodes: nodes || [], edges: edges || [] });
      } catch {
        // ignore corrupt data
      }
    }
  },

  saveToStorage: () => {
    if (typeof window === "undefined") return;
    const { nodes, edges } = get();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  },

  setNodeHighlights: (highlights) => {
    set({
      nodes: get().nodes.map((n) => {
        const highlight = highlights.get(n.id);
        if (highlight) {
          return { ...n, data: { ...n.data, proposalHighlight: highlight } };
        }
        // Clear any previous highlight
        if (n.data.proposalHighlight) {
          const { proposalHighlight: _, ...rest } = n.data;
          return { ...n, data: rest as MindMapNodeData };
        }
        return n;
      }),
    });
  },

  setEdgeHighlights: (highlights) => {
    set({
      edges: get().edges.map((e) => {
        const key = `${e.source}->${e.target}`;
        const highlight = highlights.get(key) || highlights.get(e.id);
        if (highlight) {
          return { ...e, data: { ...e.data, proposalHighlight: highlight } };
        }
        if ((e.data as Record<string, unknown>)?.proposalHighlight) {
          const { proposalHighlight: _, ...rest } = e.data as Record<string, unknown>;
          return { ...e, data: rest };
        }
        return e;
      }),
    });
  },

  clearAllHighlights: () => {
    set({
      nodes: get().nodes.map((n) => {
        if (n.data.proposalHighlight) {
          const { proposalHighlight: _, ...rest } = n.data;
          return { ...n, data: rest as MindMapNodeData };
        }
        return n;
      }),
      edges: get().edges.map((e) => {
        if ((e.data as Record<string, unknown>)?.proposalHighlight) {
          const { proposalHighlight: _, ...rest } = e.data as Record<string, unknown>;
          return { ...e, data: rest };
        }
        return e;
      }),
    });
  },

  applyProposal: (proposal) => {
    pushUndo();

    const { nodes, edges } = get();

    // 1. Remove nodes
    const removeNodeIds = new Set(proposal.remove_nodes);
    let updatedNodes = nodes.filter((n) => !removeNodeIds.has(n.id));

    // 2. Update existing nodes
    for (const update of proposal.update_nodes) {
      updatedNodes = updatedNodes.map((n) => {
        if (n.id !== update.id) return n;
        return {
          ...n,
          data: {
            ...n.data,
            ...(update.label !== undefined && { label: update.label }),
            ...(update.type !== undefined && { type: update.type as NodeType }),
          },
        };
      });
    }

    // 3. Add new nodes using incremental placement — existing node positions
    // are preserved exactly; each new node lands next to an anchor it's
    // connected to via the proposal's edges, nudged to avoid overlap.
    const placedNewNodes = placeNewNodesIncrementally(
      updatedNodes,
      proposal.add_nodes.map((n) => ({
        id: n.id,
        label: n.label,
        type: n.type as NodeType,
      })),
      proposal.add_edges.map((e) => ({ source: e.source, target: e.target })),
      "LR"
    );
    const newNodes: MindMapNode[] = placedNewNodes.map((n) => ({
      id: n.id,
      type: "mindMapNode",
      position: n.position,
      data: {
        label: n.label,
        type: n.type,
        source: "text" as const,
      },
    }));
    updatedNodes = [...updatedNodes, ...newNodes];

    // 4. Remove edges (by source+target match, and edges connected to removed nodes)
    const removeEdgeKeys = new Set(
      proposal.remove_edges.map((e) => `${e.source}->${e.target}`)
    );
    let updatedEdges = edges.filter((e) => {
      if (removeNodeIds.has(e.source) || removeNodeIds.has(e.target)) return false;
      const key = `${e.source}->${e.target}`;
      return !removeEdgeKeys.has(key);
    });

    // 5. Add new edges
    const newEdges: MindMapEdge[] = proposal.add_edges.map((e) => ({
      id: `edge_${e.source}_${e.target}_${Date.now()}`,
      source: e.source,
      target: e.target,
      type: "editable",
      label: e.label || "",
    }));
    updatedEdges = [...updatedEdges, ...newEdges];

    // 6. Clear any highlights from nodes and edges
    updatedNodes = updatedNodes.map((n) => {
      if (n.data.proposalHighlight) {
        const { proposalHighlight: _, ...rest } = n.data;
        return { ...n, data: rest as MindMapNodeData };
      }
      return n;
    });
    updatedEdges = updatedEdges.map((e) => {
      if ((e.data as Record<string, unknown>)?.proposalHighlight) {
        const { proposalHighlight: _, ...rest } = e.data as Record<string, unknown>;
        return { ...e, data: rest };
      }
      return e;
    });

    set({ nodes: updatedNodes, edges: updatedEdges });
  },

  performUndo: () => {
    const histStore = useHistoryStore.getState();
    if (histStore.past.length === 0) return;

    const current = { nodes: get().nodes, edges: get().edges };
    const snapshot = histStore.undo(current);
    if (!snapshot) return;

    histStore.setPaused(true);
    set({ nodes: snapshot.nodes, edges: snapshot.edges });
    histStore.setPaused(false);
  },

  performRedo: () => {
    const histStore = useHistoryStore.getState();
    if (histStore.future.length === 0) return;

    const current = { nodes: get().nodes, edges: get().edges };
    const snapshot = histStore.redo(current);
    if (!snapshot) return;

    histStore.setPaused(true);
    set({ nodes: snapshot.nodes, edges: snapshot.edges });
    histStore.setPaused(false);
  },
}));
