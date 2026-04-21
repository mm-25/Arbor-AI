"use client";

import { type DragEvent, useCallback, useState } from "react";
import { NODE_TYPE_CONFIGS, type NodeTypeConfig } from "./nodes/node-config";
import type { NodeType } from "@/store/mindmap-store";
import { useMindMapStore } from "@/store/mindmap-store";
import { useChatStore } from "@/store/chat-store";
import { useHistoryStore } from "@/store/history-store";
import { Button } from "@/components/ui/button";
import ExportDesignModal from "./ExportDesignModal";

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
      className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing hover:shadow-md hover:border-gray-300 transition-all select-none bg-white"
    >
      <ShapePreview shape={config.shape} color={config.borderColor} />
      <span className="text-xs font-medium text-gray-600">
        {config.label}
      </span>
    </div>
  );
}

export default function Toolbar() {
  const { saveToStorage, clear, deleteSelected, performUndo, performRedo } = useMindMapStore();
  const { saveGraphToSession } = useChatStore();
  const canUndo = useHistoryStore((s) => s.past.length > 0);
  const canRedo = useHistoryStore((s) => s.future.length > 0);
  const [showExport, setShowExport] = useState(false);

  const handleUndo = useCallback(() => {
    performUndo();
    const { nodes, edges } = useMindMapStore.getState();
    saveGraphToSession(nodes, edges);
  }, [performUndo, saveGraphToSession]);

  const handleRedo = useCallback(() => {
    performRedo();
    const { nodes, edges } = useMindMapStore.getState();
    saveGraphToSession(nodes, edges);
  }, [performRedo, saveGraphToSession]);

  const nodeTypes = Object.keys(NODE_TYPE_CONFIGS) as NodeType[];

  return (
    <>
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-3 bg-white/90 backdrop-blur-sm border rounded-xl p-3 shadow-lg">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Drag to add
        </div>
        <div className="flex flex-col gap-2">
          {nodeTypes.map((type) => (
            <DraggableNodeButton
              key={type}
              config={NODE_TYPE_CONFIGS[type]}
            />
          ))}
        </div>

        <div className="border-t pt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo}
            className="text-xs flex-1"
            title="Undo (Ctrl+Z)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
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
            className="text-xs flex-1"
            title="Redo (Ctrl+Shift+Z)"
          >
            Redo
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
            </svg>
          </Button>
        </div>

        <div className="border-t pt-3 flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={saveToStorage}
            className="text-xs"
          >
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deleteSelected}
            className="text-xs"
          >
            Delete Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExport(true)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Export Design
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clear}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Clear All
          </Button>
        </div>
      </div>

      {showExport && (
        <ExportDesignModal onClose={() => setShowExport(false)} />
      )}
    </>
  );
}
