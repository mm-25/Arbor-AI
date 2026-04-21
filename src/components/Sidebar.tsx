"use client";

import { type DragEvent, useCallback, useState } from "react";
import { NODE_TYPE_CONFIGS, type NodeTypeConfig } from "./nodes/node-config";
import type { NodeType } from "@/store/mindmap-store";
import { useMindMapStore } from "@/store/mindmap-store";
import { useChatStore } from "@/store/chat-store";
import { useHistoryStore } from "@/store/history-store";
import { Button } from "@/components/ui/button";
import { getLayoutedElements } from "@/lib/auto-layout";
import ExportDesignModal from "./ExportDesignModal";

/** Above this node count, skip Tidy Up animation — too many things moving at once. */
const TIDY_UP_ANIMATION_THRESHOLD = 30;

function ShapePreview({ shape, color }: { shape: string; color: string }) {
  const size = 18;
  switch (shape) {
    case "circle":
      return (
        <svg width={size} height={size} viewBox="0 0 18 18">
          <circle cx="9" cy="9" r="7" fill="none" stroke={color} strokeWidth="2" />
        </svg>
      );
    case "diamond":
      return (
        <svg width={size} height={size} viewBox="0 0 18 18">
          <polygon points="9,1 17,9 9,17 1,9" fill="none" stroke={color} strokeWidth="2" />
        </svg>
      );
    case "rounded-rect":
      return (
        <svg width={size} height={size} viewBox="0 0 18 18">
          <rect x="1" y="4" width="16" height="10" rx="5" fill="none" stroke={color} strokeWidth="2" />
        </svg>
      );
    default: // rectangle
      return (
        <svg width={size} height={size} viewBox="0 0 18 18">
          <rect x="1" y="4" width="16" height="10" rx="2" fill="none" stroke={color} strokeWidth="2" />
        </svg>
      );
  }
}

function DraggableNodeButton({ config }: { config: NodeTypeConfig }) {
  const onDragStart = useCallback(
    (event: DragEvent) => {
      event.dataTransfer.setData("application/mindmap-node-type", config.type);
      event.dataTransfer.effectAllowed = "move";
    },
    [config.type]
  );

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-grab active:cursor-grabbing hover:shadow-md hover:border-gray-300 transition-all select-none bg-white"
    >
      <ShapePreview shape={config.shape} color={config.borderColor} />
      <span className="text-[11px] font-medium text-gray-600">
        {config.label}
      </span>
    </div>
  );
}

function ChatHistoryItem({
  session,
  isActive,
  onSwitch,
  onDelete,
  onRename,
}: {
  session: { id: string; title: string; messages: { id: string }[]; updatedAt: number };
  isActive: boolean;
  onSwitch: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(session.title);

  const handleRenameSubmit = () => {
    onRename(renameValue);
    setIsRenaming(false);
  };

  return (
    <div
      className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer group ${
        isActive
          ? "bg-blue-50 text-blue-700"
          : "text-gray-600 hover:bg-gray-100"
      }`}
      onClick={!isRenaming ? onSwitch : undefined}
    >
      <div className="min-w-0 flex-1">
        {isRenaming ? (
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
              if (e.key === "Escape") setIsRenaming(false);
            }}
            autoFocus
            className="w-full bg-white border rounded px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-blue-300"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="truncate" title={session.title}>
            {session.title}
          </div>
        )}
      </div>
      {!isRenaming && (
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-1 shrink-0 transition-opacity">
          {/* Rename */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRenameValue(session.title);
              setIsRenaming(true);
            }}
            className="text-gray-400 hover:text-blue-500 p-0.5"
            title="Rename"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-gray-400 hover:text-red-500 p-0.5"
            title="Delete"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { saveToStorage, clear, nodes, edges, performUndo, performRedo, setNodesAndEdges } = useMindMapStore();
  const {
    sessions,
    activeSessionId,
    createNewChat,
    switchChat,
    deleteChat,
    renameChat,
    saveGraphToSession,
  } = useChatStore();
  const canUndo = useHistoryStore((s) => s.past.length > 0);
  const canRedo = useHistoryStore((s) => s.future.length > 0);

  const [collapsed, setCollapsed] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const nodeTypes = Object.keys(NODE_TYPE_CONFIGS) as NodeType[];

  const handleSwitchChat = useCallback(
    (sessionId: string) => {
      // Save current graph before switching
      saveGraphToSession(nodes, edges);
      switchChat(sessionId);
    },
    [nodes, edges, saveGraphToSession, switchChat]
  );

  const handleNewChat = useCallback(() => {
    // Save current graph before creating new
    saveGraphToSession(nodes, edges);
    createNewChat();
  }, [nodes, edges, saveGraphToSession, createNewChat]);

  const handleSave = useCallback(() => {
    saveToStorage();
    saveGraphToSession(nodes, edges);
  }, [saveToStorage, saveGraphToSession, nodes, edges]);

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

  const handleTidyUp = useCallback(() => {
    const { nodes: currentNodes, edges: currentEdges } = useMindMapStore.getState();
    if (currentNodes.length === 0) return;

    // Reset positions so auto-layout's "only layout AI or new nodes" rule
    // treats every node as eligible for repositioning (manual-source nodes
    // would otherwise be preserved).
    const resetNodes = currentNodes.map((n) => ({
      ...n,
      position: { x: 0, y: 0 },
      // Also strip source flag so auto-layout can't decide to skip
      data: { ...n.data, source: "text" as const },
    }));
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      resetNodes,
      currentEdges,
      "LR"
    );

    // Restore original source so nothing downstream thinks a manual node is now AI
    const layoutedWithOrigSource = layoutedNodes.map((n) => {
      const orig = currentNodes.find((c) => c.id === n.id);
      if (!orig) return n;
      return { ...n, data: { ...n.data, source: orig.data.source } };
    });

    if (currentNodes.length <= TIDY_UP_ANIMATION_THRESHOLD) {
      useHistoryStore.getState().triggerLayoutAnimation(400);
    }

    setNodesAndEdges(layoutedWithOrigSource, layoutedEdges);
    saveGraphToSession(layoutedWithOrigSource, layoutedEdges);
  }, [setNodesAndEdges, saveGraphToSession]);

  if (collapsed) {
    return (
      <>
        <button
          onClick={() => setCollapsed(false)}
          className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm border rounded-lg p-2 shadow-lg hover:shadow-xl transition-shadow"
          title="Open sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        {showExport && <ExportDesignModal onClose={() => setShowExport(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="absolute top-4 left-4 bottom-4 z-10 w-56 bg-white/95 backdrop-blur-sm border rounded-xl shadow-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-2.5 border-b shrink-0">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Arbor AI
          </span>
          <button
            onClick={() => setCollapsed(true)}
            className="text-gray-400 hover:text-gray-600 p-0.5"
            title="Collapse sidebar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Chats
              </span>
              <button
                onClick={handleNewChat}
                className="text-gray-400 hover:text-blue-500 p-0.5 rounded transition-colors"
                title="New chat"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>

            <div className="space-y-0.5">
              {sessions
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((session) => (
                  <ChatHistoryItem
                    key={session.id}
                    session={session}
                    isActive={session.id === activeSessionId}
                    onSwitch={() => handleSwitchChat(session.id)}
                    onDelete={() => deleteChat(session.id)}
                    onRename={(title) => renameChat(session.id, title)}
                  />
                ))}
            </div>
          </div>
        </div>

        {/* Node types */}
        <div className="border-t p-2 shrink-0">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Shapes
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {nodeTypes.map((type) => (
              <DraggableNodeButton
                key={type}
                config={NODE_TYPE_CONFIGS[type]}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t p-2 shrink-0 flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
              className="text-[11px] flex-1 h-7"
              title="Undo (⌘Z)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5 shrink-0">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
              className="text-[11px] flex-1 h-7"
              title="Redo (⌘⇧Z)"
            >
              Redo
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5 shrink-0">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
              </svg>
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTidyUp}
            className="text-[11px] h-7"
            title="Re-arrange the map into a clean flowchart layout"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1 shrink-0"
              aria-hidden="true"
            >
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
            </svg>
            Tidy Up
          </Button>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              className="text-[11px] flex-1 h-7"
            >
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExport(true)}
              className="text-[11px] text-blue-600 hover:text-blue-700 flex-1 h-7"
            >
              Export
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clear}
            className="text-[11px] text-red-500 hover:text-red-700 h-7"
          >
            Clear Canvas
          </Button>
        </div>
      </div>

      {showExport && <ExportDesignModal onClose={() => setShowExport(false)} />}
    </>
  );
}
