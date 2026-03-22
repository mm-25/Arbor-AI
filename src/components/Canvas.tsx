"use client";

import React, { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  SelectionMode,
  useReactFlow,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useMindMapStore, type NodeType, type MindMapNode, type MindMapEdge } from "@/store/mindmap-store";
import { useChatStore } from "@/store/chat-store";
import { useHistoryStore } from "@/store/history-store";
import { useWireframeStore } from "@/store/wireframe-store";
import MindMapNodeComponent from "./nodes/MindMapNode";
import { NODE_TYPE_CONFIGS } from "./nodes/node-config";
import Sidebar from "./Sidebar";
import ChatPanel from "./ChatPanel";
import EditableEdge from "./edges/EditableEdge";
import NodeContextMenu from "./NodeContextMenu";
import CanvasContextMenu from "./CanvasContextMenu";
import DesignView from "./DesignView";

const nodeTypes = {
  mindMapNode: MindMapNodeComponent,
};

const edgeTypes = {
  editable: EditableEdge,
};

let nodeIdCounter = 0;
function getNextNodeId() {
  return `node_${Date.now()}_${nodeIdCounter++}`;
}

// Generic node labels that need clarifying questions before wireframe generation
const GENERIC_LABELS = new Set([
  "Actor", "Process", "Decision", "Outcome", "Problem",
  "actor", "process", "decision", "outcome", "problem",
  "New Node", "Untitled",
]);

// Paste offset when using keyboard shortcut (stacks nicely on repeat paste)
const PASTE_OFFSET = 20;

export default function Canvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    addNodesAndEdges,
    setNodesAndEdges,
    performUndo,
    performRedo,
  } = useMindMapStore();

  const {
    activeSessionId,
    getActiveSessionGraph,
    getActiveSessionWireframes,
    loadSessions,
    saveGraphToSession,
    saveWireframesToSession,
    addUserMessage,
    addAssistantMessage,
    getConversationForAPI,
  } = useChatStore();

  const clearHistory = useHistoryStore((s) => s.clear);
  const wireframeStore = useWireframeStore();

  // View mode: "system" (mind map) or "design" (wireframes)
  const [viewMode, setViewMode] = useState<"system" | "design">("system");

  // Node right-click context menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
    nodeLabel: string;
  } | null>(null);

  // Canvas (pane) right-click context menu
  const [canvasContextMenu, setCanvasContextMenu] = useState<{
    x: number;
    y: number;
    flowX: number;
    flowY: number;
  } | null>(null);

  // In-memory clipboard — not persisted across page reloads intentionally
  const clipboard = useRef<{ nodes: MindMapNode[]; edges: MindMapEdge[] } | null>(null);
  // Track whether clipboard has content for re-render
  const [hasClipboard, setHasClipboard] = useState(false);

  // Alt+drag: maps nodeId → original position captured at drag start
  const altDragRef = useRef<Map<string, { x: number; y: number }> | null>(null);

  // ── Session restore ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadSessions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeSessionId) return;
    clearHistory();

    const graph = getActiveSessionGraph();
    if (graph && (graph.nodes.length > 0 || graph.edges.length > 0)) {
      setNodesAndEdges(graph.nodes, graph.edges, true);
    } else {
      setNodesAndEdges([], [], true);
    }

    wireframeStore.loadWireframes(getActiveSessionWireframes());
  }, [activeSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Undo / Redo ──────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    performUndo();
    const { nodes: n, edges: e } = useMindMapStore.getState();
    saveGraphToSession(n, e);
  }, [performUndo, saveGraphToSession]);

  const handleRedo = useCallback(() => {
    performRedo();
    const { nodes: n, edges: e } = useMindMapStore.getState();
    saveGraphToSession(n, e);
  }, [performRedo, saveGraphToSession]);

  // ── Copy ─────────────────────────────────────────────────────────────────────
  // specificNodeId: when triggered from right-click menu, copy that node
  // (+ other selected nodes if it's part of the selection)
  const handleCopy = useCallback((specificNodeId?: string) => {
    const { nodes: currentNodes, edges: currentEdges } = useMindMapStore.getState();

    let toCopy: MindMapNode[];
    if (specificNodeId) {
      const clicked = currentNodes.find((n) => n.id === specificNodeId);
      if (!clicked) return;
      // If the right-clicked node is selected, copy entire selection; else just it
      toCopy = clicked.selected
        ? currentNodes.filter((n) => n.selected)
        : [clicked];
    } else {
      toCopy = currentNodes.filter((n) => n.selected);
    }

    if (toCopy.length === 0) return;

    const selectedIds = new Set(toCopy.map((n) => n.id));
    const internalEdges = currentEdges.filter(
      (e) => selectedIds.has(e.source) && selectedIds.has(e.target)
    );

    clipboard.current = { nodes: toCopy, edges: internalEdges };
    setHasClipboard(true);
  }, []);

  // ── Paste ────────────────────────────────────────────────────────────────────
  // pasteAtFlowPos: optional flow-space position for right-click paste;
  // if omitted, pastes with a fixed PASTE_OFFSET from the originals.
  const handlePaste = useCallback((pasteAtFlowPos?: { x: number; y: number }) => {
    if (!clipboard.current) return;
    const { nodes: copiedNodes, edges: copiedEdges } = clipboard.current;

    const { nodes: currentNodes, edges: currentEdges } = useMindMapStore.getState();

    const idMap = new Map<string, string>();

    // Bounding-box top-left — used to anchor right-click paste at cursor
    const minX = Math.min(...copiedNodes.map((n) => n.position.x));
    const minY = Math.min(...copiedNodes.map((n) => n.position.y));

    const newNodes: MindMapNode[] = copiedNodes.map((n) => {
      const newId = getNextNodeId();
      idMap.set(n.id, newId);

      const pos = pasteAtFlowPos
        ? {
            x: pasteAtFlowPos.x + (n.position.x - minX),
            y: pasteAtFlowPos.y + (n.position.y - minY),
          }
        : {
            x: n.position.x + PASTE_OFFSET,
            y: n.position.y + PASTE_OFFSET,
          };

      return { ...n, id: newId, position: pos, selected: true, data: { ...n.data } };
    });

    // Deselect original nodes so pasted ones get visual focus
    const deselectedOriginals = currentNodes.map((n) =>
      n.selected ? { ...n, selected: false } : n
    );

    const newEdges: MindMapEdge[] = copiedEdges.map((e) => ({
      ...e,
      id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      source: idMap.get(e.source) ?? e.source,
      target: idMap.get(e.target) ?? e.target,
      selected: false,
    }));

    setNodesAndEdges(
      [...deselectedOriginals, ...newNodes],
      [...currentEdges, ...newEdges]
    );

    // Persist
    const { nodes: n, edges: e } = useMindMapStore.getState();
    saveGraphToSession(n, e);
  }, [setNodesAndEdges, saveGraphToSession]);

  // ── Alt/Option + drag to duplicate ──────────────────────────────────────────
  // Strategy: at drag START, create stay-copies at the current positions AND
  // transfer external edges to the stay-copies. ReactFlow then drags the
  // original nodes (now free-floating) to wherever the user drops them.
  // Result: originals stay in place with all connections, copies follow cursor.
  const onNodeDragStart = useCallback(
    (event: React.MouseEvent, _node: MindMapNode, draggedNodes: MindMapNode[]) => {
      if (!event.altKey) {
        altDragRef.current = null;
        return;
      }

      altDragRef.current = new Map(
        draggedNodes.map((n) => [n.id, { x: n.position.x, y: n.position.y }])
      );

      const draggedIds = new Set(draggedNodes.map((n) => n.id));
      const { nodes: currentNodes, edges: currentEdges } = useMindMapStore.getState();
      const idMap = new Map<string, string>();

      // 1. Create stay-copies at the current (pre-drag) positions
      const stayCopies: MindMapNode[] = draggedNodes.map((n) => {
        const newId = getNextNodeId();
        idMap.set(n.id, newId);
        return {
          ...n,
          id: newId,
          position: { x: n.position.x, y: n.position.y },
          selected: false,
          data: { ...n.data },
        };
      });

      // 2. Re-wire edges so stay-copies inherit ALL connections:
      //    - Edge between two dragged nodes → duplicate for stay-copies, keep original
      //    - Edge from dragged → non-dragged → re-point source to stay-copy
      //    - Edge from non-dragged → dragged → re-point target to stay-copy
      //    - Edge between non-dragged → leave as is
      const extraEdges: MindMapEdge[] = [];
      const updatedEdges = currentEdges.map((e) => {
        const srcDragged = draggedIds.has(e.source);
        const tgtDragged = draggedIds.has(e.target);

        if (srcDragged && tgtDragged) {
          // Internal: duplicate for stay-copies, keep original between dragged nodes
          extraEdges.push({
            ...e,
            id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            source: idMap.get(e.source)!,
            target: idMap.get(e.target)!,
          });
          return e;
        }
        if (srcDragged) {
          // Transfer: external edge stays with the stay-copy (original stays connected)
          return { ...e, source: idMap.get(e.source)! };
        }
        if (tgtDragged) {
          return { ...e, target: idMap.get(e.target)! };
        }
        return e;
      });

      // 3. Atomic update — full replace so edge re-pointing takes effect
      setNodesAndEdges(
        [...currentNodes, ...stayCopies],
        [...updatedEdges, ...extraEdges]
      );
    },
    [setNodesAndEdges]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, _node: MindMapNode, _draggedNodes: MindMapNode[]) => {
      if (!altDragRef.current) return;
      altDragRef.current = null;
      // Stay-copies were already created at drag start — just persist final state
      const { nodes: n, edges: e } = useMindMapStore.getState();
      saveGraphToSession(n, e);
    },
    [saveGraphToSession]
  );

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const inText = tag === "INPUT" || tag === "TEXTAREA";

      // Undo / Redo (always active)
      if (mod && e.key === "z" && !e.shiftKey) { e.preventDefault(); handleUndo(); return; }
      if ((mod && e.key === "z" && e.shiftKey) || (e.ctrlKey && e.key === "y")) {
        e.preventDefault(); handleRedo(); return;
      }

      // Copy / Paste — skip when user is typing in an input
      if (inText) return;

      if (mod && e.key === "c") {
        const selected = useMindMapStore.getState().nodes.filter((n) => n.selected);
        if (selected.length > 0) {
          e.preventDefault();
          handleCopy();
        }
      }

      if (mod && e.key === "v") {
        if (clipboard.current) {
          e.preventDefault();
          handlePaste();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo, handleCopy, handlePaste]);

  // ── Drag-and-drop from sidebar ───────────────────────────────────────────────
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/mindmap-node-type") as NodeType;
      if (!type || !NODE_TYPE_CONFIGS[type]) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNode({
        id: getNextNodeId(),
        type: "mindMapNode",
        position,
        data: { label: NODE_TYPE_CONFIGS[type].label, type, source: "manual" },
      });
    },
    [screenToFlowPosition, addNode]
  );

  // ── Node right-click context menu ────────────────────────────────────────────
  const onNodeContextMenu: NodeMouseHandler<MindMapNode> = useCallback(
    (event, node) => {
      event.preventDefault();
      setCanvasContextMenu(null);
      setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id, nodeLabel: node.data.label });
    },
    []
  );

  // ── Canvas (pane) right-click context menu ───────────────────────────────────
  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      (event as React.MouseEvent).preventDefault?.();
      setContextMenu(null);
      const flowPos = screenToFlowPosition({
        x: (event as MouseEvent).clientX,
        y: (event as MouseEvent).clientY,
      });
      setCanvasContextMenu({
        x: (event as MouseEvent).clientX,
        y: (event as MouseEvent).clientY,
        flowX: flowPos.x,
        flowY: flowPos.y,
      });
    },
    [screenToFlowPosition]
  );

  // ── Wireframe generation ─────────────────────────────────────────────────────
  const handleGenerateWireframe = useCallback(async () => {
    if (!contextMenu) return;

    const rightClickedNode = nodes.find((n) => n.id === contextMenu.nodeId);
    if (!rightClickedNode) return;

    const selectedNodes = nodes.filter((n) => n.selected && n.id !== contextMenu.nodeId);
    const targetNodes = [rightClickedNode, ...selectedNodes];
    const allGeneric = targetNodes.every((n) => GENERIC_LABELS.has(n.data.label));

    if (targetNodes.length === 1 && allGeneric) {
      // Ask clarifying questions before generating
      addUserMessage(
        `I'd like to generate a wireframe for "${rightClickedNode.data.label}". What should this screen include?`
      );
      addAssistantMessage(
        `Great choice! To create a useful wireframe for **"${rightClickedNode.data.label}"**, I need a bit more context:\n\n` +
        `- What type of screen is this? (e.g., login page, dashboard, settings panel)\n` +
        `- What are the key UI elements it should have? (forms, tables, cards, navigation)\n` +
        `- Any specific sections or features to include?\n\n` +
        `Tell me more and then click **"Generate Wireframe"** when you're ready!`
      );
      window.dispatchEvent(
        new CustomEvent("pending-wireframe", {
          detail: { nodeIds: targetNodes.map((n) => n.id) },
        })
      );
      return;
    }

    wireframeStore.setGenerating(true);
    setViewMode("design");

    try {
      const response = await fetch("/api/wireframe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetNodes: targetNodes.map((n) => ({ id: n.id, label: n.data.label, type: n.data.type })),
          allNodes: nodes,
          allEdges: edges,
          conversation: getConversationForAPI(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const { html, title } = await response.json();

      const wireframe = {
        id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title,
        sourceNodeIds: targetNodes.map((n) => n.id),
        html,
        createdAt: Date.now(),
      };

      wireframeStore.addWireframe(wireframe);
      saveWireframesToSession(useWireframeStore.getState().wireframes);
      addAssistantMessage(`Wireframe **"${title}"** generated! Switch to the **Design** tab to view it.`);
    } catch (err) {
      console.error("Wireframe generation failed:", err);
      addAssistantMessage(
        `Failed to generate wireframe: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      wireframeStore.setGenerating(false);
    }
  }, [
    contextMenu, nodes, edges, wireframeStore,
    addUserMessage, addAssistantMessage, getConversationForAPI, saveWireframesToSession,
  ]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-screen relative">
      <Sidebar />
      <ChatPanel />

      {/* System view */}
      <div className="w-full h-full" style={{ display: viewMode === "system" ? "block" : "none" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          fitView
          panOnDrag={[1, 2]}
          panOnScroll
          zoomOnScroll={false}
          zoomOnPinch
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          deleteKeyCode={["Backspace", "Delete"]}
          className="bg-gray-50"
          defaultEdgeOptions={{ type: "editable" }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as unknown as { type: NodeType };
              return NODE_TYPE_CONFIGS[data.type]?.color || "#6b7280";
            }}
            maskColor="rgba(0,0,0,0.1)"
          />
        </ReactFlow>
      </div>

      {/* Design view — hidden while automotive vertical is in development */}
      {/* {viewMode === "design" && <DesignView />} */}

      {/* View mode toggle — hidden while automotive vertical is in development */}
      {/* <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-white/95 backdrop-blur-sm border rounded-full shadow-lg p-1 flex items-center gap-0.5">
          <button onClick={() => setViewMode("system")} ...>System</button>
          <button onClick={() => setViewMode("design")} ...>Design</button>
        </div>
      </div> */}

      {/* Node context menu */}
      {contextMenu && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          nodeLabel={contextMenu.nodeLabel}
          onCopy={() => handleCopy(contextMenu.nodeId)}
          onGenerateWireframe={handleGenerateWireframe}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Canvas context menu */}
      {canvasContextMenu && (
        <CanvasContextMenu
          x={canvasContextMenu.x}
          y={canvasContextMenu.y}
          canPaste={hasClipboard}
          onPaste={() => handlePaste({ x: canvasContextMenu.flowX, y: canvasContextMenu.flowY })}
          onClose={() => setCanvasContextMenu(null)}
        />
      )}
    </div>
  );
}
