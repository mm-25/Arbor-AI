"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { MindMapNodeData } from "@/store/mindmap-store";
import { getNodeVisualConfig } from "./node-config";
import { useMindMapStore } from "@/store/mindmap-store";
import NodeStyleToolbar from "./NodeStyleToolbar";

function MindMapNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as MindMapNodeData;
  const config = getNodeVisualConfig(nodeData.type, nodeData.color, nodeData.icon);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateNodeLabel = useMindMapStore((s) => s.updateNodeLabel);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleDoubleClick = useCallback(() => {
    setEditValue(nodeData.label);
    setEditing(true);
  }, [nodeData.label]);

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (editValue.trim()) {
      updateNodeLabel(id, editValue.trim());
    }
  }, [id, editValue, updateNodeLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleBlur();
      }
      if (e.key === "Escape") {
        setEditing(false);
        setEditValue(nodeData.label);
      }
    },
    [handleBlur, nodeData.label]
  );

  const proposalHighlight = nodeData.proposalHighlight as "update" | "remove" | undefined;
  const highlightClass = proposalHighlight === "update"
    ? "proposal-highlight-update"
    : proposalHighlight === "remove"
    ? "proposal-highlight-remove"
    : "";

  const isDiamond = config.shape === "diamond";
  const handleClass = "!w-3 !h-3 !bg-blue-500 !border-2 !border-white node-handle";

  if (isDiamond) {
    return (
      <div
        className={`relative flex items-center justify-center ${highlightClass}`}
        style={{ width: 120, height: 120 }}
        onDoubleClick={handleDoubleClick}
      >
        {selected && (
          <NodeStyleToolbar
            nodeId={id}
            currentColor={nodeData.color}
            currentIcon={nodeData.icon}
            currentType={nodeData.type}
          />
        )}
        {/* Diamond shape via clip-path — no rotation needed */}
        <div
          className={`absolute inset-0 ${
            selected ? "drop-shadow-lg" : ""
          }`}
          style={{
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            backgroundColor: config.bgColor,
            border: "none",
          }}
        />
        {/* Border: slightly larger diamond behind */}
        <div
          className="absolute"
          style={{
            inset: -2,
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            backgroundColor: selected ? "#60a5fa" : config.borderColor,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            backgroundColor: config.bgColor,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-1 text-center px-4">
          <span className="text-xs opacity-60 select-none">{config.icon}</span>
          {editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-b border-current text-sm text-center outline-none w-full min-w-[60px]"
              style={{ color: config.color }}
            />
          ) : (
            <span
              className="text-sm font-medium max-w-[80px] break-words"
              style={{ color: config.color }}
            >
              {nodeData.label}
            </span>
          )}
        </div>

        {/* Handles at all 4 tips of the diamond */}
        <Handle type="source" position={Position.Top} id="top" className={handleClass} />
        <Handle type="source" position={Position.Right} id="right" className={handleClass} />
        <Handle type="source" position={Position.Bottom} id="bottom" className={handleClass} />
        <Handle type="source" position={Position.Left} id="left" className={handleClass} />
      </div>
    );
  }

  // Non-diamond shapes
  const shapeClasses = (() => {
    switch (config.shape) {
      case "circle":
        return "rounded-full min-w-[100px] min-h-[100px] flex items-center justify-center";
      case "rounded-rect":
        return "rounded-2xl min-w-[120px] min-h-[60px] flex items-center justify-center";
      case "rectangle":
      default:
        return "rounded-md min-w-[120px] min-h-[60px] flex items-center justify-center";
    }
  })();

  return (
    <div
      className={`relative px-4 py-3 border-2 shadow-sm transition-shadow ${shapeClasses} ${
        selected && !proposalHighlight ? "shadow-lg ring-2 ring-blue-400" : ""
      } ${highlightClass}`}
      style={{
        backgroundColor: config.bgColor,
        borderColor: proposalHighlight ? undefined : config.borderColor,
      }}
      onDoubleClick={handleDoubleClick}
    >
      {selected && (
        <NodeStyleToolbar
          nodeId={id}
          currentColor={nodeData.color}
          currentIcon={nodeData.icon}
          currentType={nodeData.type}
        />
      )}
      <Handle type="source" position={Position.Top} id="top" className={handleClass} />
      <Handle type="source" position={Position.Right} id="right" className={handleClass} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={handleClass} />
      <Handle type="source" position={Position.Left} id="left" className={handleClass} />

      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-xs opacity-60 select-none">{config.icon}</span>
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-b border-current text-sm text-center outline-none w-full min-w-[60px]"
            style={{ color: config.color }}
          />
        ) : (
          <span
            className="text-sm font-medium max-w-[150px] break-words"
            style={{ color: config.color }}
          >
            {nodeData.label}
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(MindMapNodeComponent);
