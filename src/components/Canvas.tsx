"use client";

import { initializeWorkspace } from "@/lib/workspace";
import { connectEndpoints } from "@/lib/connector";
import { translateEdgeGeometry } from "@/lib/edge-routing";
import { useEditorStore } from "@/store/editor-store";
import React, {
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
  type DragEvent,
} from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionMode,
  SelectionMode,
  useReactFlow,
  useStoreApi,
  useViewport,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  useMindMapStore,
  type NodeType,
  type MindMapNode,
  type MindMapEdge,
} from "@/store/mindmap-store";
import { useChatStore } from "@/store/chat-store";
import { useHistoryStore } from "@/store/history-store";
import MindMapNodeComponent from "./nodes/MindMapNode";
import { NODE_TYPE_CONFIGS } from "./nodes/node-config";
import Sidebar from "./Sidebar";
import ChatPanel from "./ChatPanel";
import EditableEdge from "./edges/EditableEdge";
import ConnectorAnchor from "./nodes/ConnectorAnchor";
import {
  connectorView,
  documentBounds,
  connectionFromEndpoints,
  type ConnectorEndpoint,
} from "@/lib/connector-endpoints";
import { connectorGeometry } from "@/lib/connector-geometry";
import { roundedPath } from "@/lib/edge-routing";
import type { Point } from "@/lib/canvas-geometry";
import NodeContextMenu from "./NodeContextMenu";
import CanvasContextMenu from "./CanvasContextMenu";
import CanvasNavigation from "./CanvasNavigation";

const nodeTypes = {
  mindMapNode: MindMapNodeComponent,
  connectorAnchor: ConnectorAnchor,
};

const edgeTypes = {
  editable: EditableEdge,
};

let nodeIdCounter = 0;
function getNextNodeId() {
  return `node_${Date.now()}_${nodeIdCounter++}`;
}

// Paste offset when using keyboard shortcut (stacks nicely on repeat paste)
const PASTE_OFFSET = 20;

export default function Canvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const flowStore = useStoreApi();
  const { zoom, x: viewportX, y: viewportY } = useViewport();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setNodesAndEdges,
    performUndo,
    performRedo,
  } = useMindMapStore();

  const { activeSessionId, loadSessions, saveGraphToSession, storageError } =
    useChatStore();
  const isAnimatingLayout = useHistoryStore((s) => s._isAnimatingLayout);

  // Shared connection tool: button, C shortcut or legacy toolbar drop.
  const tool = useEditorStore((s) => s.tool);
  const setTool = useEditorStore((s) => s.setTool);
  const connectingMode = tool === "connect";
  const setConnectingMode = useCallback(
    (enabled: boolean) => setTool(enabled ? "connect" : "select"),
    [setTool],
  );
  const [connectSource, setConnectSource] = useState<ConnectorEndpoint | null>(
    null,
  );
  const [connectCursor, setConnectCursor] = useState<Point | null>(null);
  const connectorEpoch = useRef<number | null>(null);
  const directConnectEpoch = useRef<number | null>(null);

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
  const clipboard = useRef<{
    nodes: MindMapNode[];
    edges: MindMapEdge[];
  } | null>(null);
  // Track whether clipboard has content for re-render
  const [hasClipboard, setHasClipboard] = useState(false);

  // Alt+drag: maps nodeId → original position captured at drag start
  const altDragRef = useRef<Map<string, { x: number; y: number }> | null>(null);

  useEffect(
    () =>
      useChatStore.subscribe((state, previous) => {
        if (state.sessionEpoch === previous.sessionEpoch) return;
        connectorEpoch.current = null;
        directConnectEpoch.current = null;
        flowStore.getState().cancelConnection();
        useEditorStore.getState().setTool("select");
        useEditorStore.getState().requestFit();
        setConnectSource(null);
        setContextMenu(null);
        setCanvasContextMenu(null);
      }),
    [flowStore],
  );

  // The workspace bridge restores and saves synchronously at map boundaries.
  useEffect(() => {
    const stop = initializeWorkspace();
    loadSessions();
    return stop;
  }, [loadSessions]);

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
    const { nodes: currentNodes, edges: currentEdges } =
      useMindMapStore.getState();

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

    const selectedIds = new Set(toCopy.map((n) => n.id));
    const internalEdges = currentEdges.filter(
      (e) =>
        (!specificNodeId && e.selected) ||
        (selectedIds.has(e.source) && selectedIds.has(e.target)),
    );

    if (!toCopy.length && !internalEdges.length) return;
    // An attached node outside the copied selection must not become a dangling
    // reference when this clipboard is pasted into another map.
    const copiedEdges = internalEdges.map((edge) => {
      const geometry = connectorGeometry(edge, currentNodes);
      const copy = { ...edge, data: { ...edge.data } };
      for (const end of ["source", "target"] as const) {
        if (edge[end] && !selectedIds.has(edge[end]) && geometry) {
          copy[end] = "";
          copy[`${end}Handle`] = null;
          copy.data[`${end}Point`] = {
            ...(end === "source" ? geometry.a : geometry.b),
          };
        }
      }
      return copy;
    });
    clipboard.current = { nodes: toCopy, edges: copiedEdges };
    setHasClipboard(true);
  }, []);

  // ── Paste ────────────────────────────────────────────────────────────────────
  // pasteAtFlowPos: optional flow-space position for right-click paste;
  // if omitted, pastes with a fixed PASTE_OFFSET from the originals.
  const handlePaste = useCallback(
    (pasteAtFlowPos?: { x: number; y: number }) => {
      if (!clipboard.current) return;
      const { nodes: copiedNodes, edges: copiedEdges } = clipboard.current;

      const { nodes: currentNodes, edges: currentEdges } =
        useMindMapStore.getState();

      const idMap = new Map<string, string>();

      // Bounding-box top-left — used to anchor right-click paste at cursor
      const bounds = documentBounds(copiedNodes, copiedEdges, currentNodes);
      const minX = bounds.x,
        minY = bounds.y;

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

        return {
          ...n,
          id: newId,
          position: pos,
          selected: true,
          data: { ...n.data },
        };
      });

      // Deselect original nodes so pasted ones get visual focus
      const deselectedOriginals = currentNodes.map((n) =>
        n.selected ? { ...n, selected: false } : n,
      );

      const newEdges: MindMapEdge[] = copiedEdges.map((e) => ({
        ...translateEdgeGeometry(
          e,
          pasteAtFlowPos ? pasteAtFlowPos.x - minX : PASTE_OFFSET,
          pasteAtFlowPos ? pasteAtFlowPos.y - minY : PASTE_OFFSET,
        ),
        id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        source: idMap.get(e.source) ?? e.source,
        target: idMap.get(e.target) ?? e.target,
        selected: true,
      }));

      setNodesAndEdges(
        [...deselectedOriginals, ...newNodes],
        [...currentEdges.map((e) => ({ ...e, selected: false })), ...newEdges],
      );

      // Persist
      const { nodes: n, edges: e } = useMindMapStore.getState();
      saveGraphToSession(n, e);
    },
    [setNodesAndEdges, saveGraphToSession],
  );

  // ── Alt/Option + drag to duplicate ──────────────────────────────────────────
  // Strategy: at drag START, create stay-copies at the current positions AND
  // transfer external edges to the stay-copies. ReactFlow then drags the
  // original nodes (now free-floating) to wherever the user drops them.
  // Result: originals stay in place with all connections, copies follow cursor.
  const onNodeDragStart = useCallback(
    (
      event: React.MouseEvent,
      _node: MindMapNode,
      draggedNodes: MindMapNode[],
    ) => {
      if (!event.altKey) {
        altDragRef.current = null;
        return;
      }

      altDragRef.current = new Map(
        draggedNodes.map((n) => [n.id, { x: n.position.x, y: n.position.y }]),
      );

      const draggedIds = new Set(draggedNodes.map((n) => n.id));
      const { nodes: currentNodes, edges: currentEdges } =
        useMindMapStore.getState();
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
        [...updatedEdges, ...extraEdges],
        useHistoryStore.getState()._isDragging,
      );
      useHistoryStore.getState().setDragging(true);
    },
    [setNodesAndEdges],
  );

  const onNodeDragStop = useCallback(() => {
    if (!altDragRef.current) return;
    altDragRef.current = null;
    // Stay-copies were already created at drag start — just persist final state
    const { nodes: n, edges: e } = useMindMapStore.getState();
    saveGraphToSession(n, e);
  }, [saveGraphToSession]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        directConnectEpoch.current = null;
        flowStore.getState().cancelConnection();
      }
      const mod = e.metaKey || e.ctrlKey;
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const inText =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable;
      if (inText) return;

      // Undo / Redo (always active)
      const key = e.key.toLowerCase();
      if (mod && key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((mod && key === "z" && e.shiftKey) || (e.ctrlKey && key === "y")) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Copy / Paste — skip when user is typing in an input
      if (inText) return;

      if (!mod && !e.altKey && ["c", "v", "h", "escape"].includes(key)) {
        e.preventDefault();
        setConnectSource(null);
        setTool(key === "c" ? "connect" : key === "h" ? "hand" : "select");
        return;
      }

      if (mod && e.key === "a") {
        e.preventDefault();
        const {
          nodes: allNodes,
          edges: allEdges,
          onNodesChange: nc,
          onEdgesChange: ec,
        } = useMindMapStore.getState();
        nc(
          allNodes.map((n) => ({
            type: "select" as const,
            id: n.id,
            selected: true,
          })),
        );
        ec(
          allEdges.map((edge) => ({
            type: "select" as const,
            id: edge.id,
            selected: true,
          })),
        );
        return;
      }

      if (mod && e.key === "c") {
        const selected = useMindMapStore
          .getState()
          .nodes.filter((n) => n.selected);
        if (
          selected.length > 0 ||
          useMindMapStore.getState().edges.some((edge) => edge.selected)
        ) {
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
  }, [handleUndo, handleRedo, handleCopy, handlePaste, setTool, flowStore]);

  useEffect(
    () =>
      useEditorStore.subscribe((state, previous) => {
        if (state.tool !== previous.tool) {
          connectorEpoch.current = null;
          setConnectSource(null);
        }
      }),
    [],
  );

  // ── Drag-and-drop from sidebar ───────────────────────────────────────────────
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      // Connector tool — activate drawing mode instead of placing a node
      const isConnector = event.dataTransfer.getData(
        "application/mindmap-connector",
      );
      if (isConnector === "true") {
        setConnectingMode(true);
        setConnectSource(null);
        return;
      }

      const type = event.dataTransfer.getData(
        "application/mindmap-node-type",
      ) as NodeType;
      if (!type || !NODE_TYPE_CONFIGS[type]) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addNode({
        id: getNextNodeId(),
        type: "mindMapNode",
        position,
        data: { label: "", type, source: "manual" },
      });
    },
    [screenToFlowPosition, addNode, setConnectingMode],
  );

  const chooseEndpoint = useCallback(
    (endpoint: ConnectorEndpoint) => {
      if (!connectingMode) return;
      if (!connectSource) {
        setConnectSource(endpoint);
        connectorEpoch.current = useChatStore.getState().sessionEpoch;
      } else {
        connectEndpoints(connectSource, endpoint, connectorEpoch.current ?? -1);
        setConnectSource(null);
        setConnectCursor(null);
        setConnectingMode(false);
      }
    },
    [connectingMode, connectSource, setConnectingMode],
  );
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: MindMapNode) => {
      if (node.type !== "connectorAnchor")
        chooseEndpoint({ kind: "node", nodeId: node.id });
    },
    [chooseEndpoint],
  );
  const view = useMemo(() => connectorView(nodes, edges), [nodes, edges]);
  const preview = useMemo(() => {
    if (!connectSource || !connectCursor || !connectingMode) return null;
    const connection = connectionFromEndpoints(
      connectSource,
      { kind: "point", point: connectCursor },
      nodes,
    );
    if (!connection) return null;
    const edge = {
      id: "preview",
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      data: {
        sourcePoint: connection.sourcePoint,
        targetPoint: connection.targetPoint,
      },
    };
    return connectorGeometry(edge, nodes);
  }, [connectSource, connectCursor, connectingMode, nodes]);

  // Esc cancels connecting mode
  useEffect(() => {
    if (!connectingMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConnectingMode(false);
        setConnectSource(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [connectingMode, setConnectingMode]);

  // ── Node right-click context menu ────────────────────────────────────────────
  const onNodeContextMenu: NodeMouseHandler<MindMapNode> = useCallback(
    (event, node) => {
      event.preventDefault();
      setCanvasContextMenu(null);
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        nodeLabel: node.data.label,
      });
    },
    [],
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
    [screenToFlowPosition],
  );

  return (
    <div
      ref={reactFlowWrapper}
      className="w-full h-screen relative"
      data-animating-layout={isAnimatingLayout ? "true" : "false"}
      onPointerDownCapture={(event) => {
        // Capture modifiers on this gesture before React Flow handles selection.
        // This also works when a host did not deliver a separate Shift keydown.
        flowStore.setState({ multiSelectionActive: event.shiftKey });
      }}
      style={connectingMode ? { cursor: "crosshair" } : undefined}
    >
      {storageError && (
        <div
          role="alert"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-lg rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          {storageError}
        </div>
      )}
      <Sidebar />
      <ChatPanel key={activeSessionId} />

      {/* Connector drawing mode banner */}
      {connectingMode && (
        <div
          role="status"
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        >
          <div className="flex items-center gap-2 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg">
            <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
              <line
                x1="1"
                y1="4"
                x2="11"
                y2="4"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <polyline
                points="8,1 11,4 8,7"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {connectSource
              ? "Click the target node or canvas — Esc to cancel"
              : "Click the source node or canvas — Esc to cancel"}
          </div>
        </div>
      )}

      {/* System view */}
      <div className="w-full h-full">
        <ReactFlow
          nodes={view.nodes}
          edges={view.edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnectStart={() => {
            directConnectEpoch.current = useChatStore.getState().sessionEpoch;
          }}
          onConnect={(connection) => {
            if (
              directConnectEpoch.current ===
              useChatStore.getState().sessionEpoch
            )
              onConnect(connection);
          }}
          onConnectEnd={() => {
            directConnectEpoch.current = null;
          }}
          edgesReconnectable={false}
          nodesDraggable={tool === "select"}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={(event) =>
            chooseEndpoint({
              kind: "point",
              point: screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
              }),
            })
          }
          onPaneMouseMove={(event) => {
            if (connectingMode)
              setConnectCursor(
                screenToFlowPosition({ x: event.clientX, y: event.clientY }),
              );
          }}
          onNodeMouseMove={(event) => {
            if (connectingMode)
              setConnectCursor(
                screenToFlowPosition({ x: event.clientX, y: event.clientY }),
              );
          }}
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          connectionMode={ConnectionMode.Loose}
          connectOnClick={false}
          fitView
          minZoom={0.01}
          maxZoom={3}
          panOnDrag={tool === "hand" ? true : [1, 2]}
          panOnScroll
          zoomOnScroll={false}
          zoomOnPinch
          selectionOnDrag={tool === "select"}
          multiSelectionKeyCode="Shift"
          zoomOnDoubleClick={false}
          selectionMode={SelectionMode.Partial}
          onBeforeDelete={async ({
            nodes: removedNodes,
            edges: removedEdges,
          }) => {
            const nodeIds = new Set(removedNodes.map((n) => n.id));
            const edgeIds = new Set(removedEdges.map((e) => e.id));
            const current = useMindMapStore.getState();
            current.setNodesAndEdges(
              current.nodes.filter((n) => !nodeIds.has(n.id)),
              current.edges.filter(
                (e) =>
                  !edgeIds.has(e.id) &&
                  !nodeIds.has(e.source) &&
                  !nodeIds.has(e.target),
              ),
            );
            return false;
          }}
          deleteKeyCode={["Backspace", "Delete"]}
          className="bg-gray-50"
          defaultEdgeOptions={{ type: "editable" }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
      </div>

      {preview && (
        <svg
          aria-label="Connection preview"
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        >
          <g transform={`translate(${viewportX} ${viewportY}) scale(${zoom})`}>
            <path
              d={roundedPath(preview.points)}
              fill="none"
              stroke="#2563eb"
              strokeWidth={2 / zoom}
              strokeDasharray={`${6 / zoom} ${4 / zoom}`}
            />
          </g>
        </svg>
      )}
      <CanvasNavigation wrapper={reactFlowWrapper} />

      {/* Node context menu */}
      {contextMenu && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          nodeLabel={contextMenu.nodeLabel}
          onCopy={() => handleCopy(contextMenu.nodeId)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Canvas context menu */}
      {canvasContextMenu && (
        <CanvasContextMenu
          x={canvasContextMenu.x}
          y={canvasContextMenu.y}
          canPaste={hasClipboard}
          onPaste={() =>
            handlePaste({
              x: canvasContextMenu.flowX,
              y: canvasContextMenu.flowY,
            })
          }
          onClose={() => setCanvasContextMenu(null)}
        />
      )}
    </div>
  );
}
