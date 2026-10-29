"use client";
import { memo, useState, useCallback, useRef, useEffect } from "react";
import { Handle, Position, useViewport, type NodeProps } from "@xyflow/react";
import type { MindMapNodeData } from "@/store/mindmap-store";
import { useMindMapStore } from "@/store/mindmap-store";
import { nodeSize } from "@/lib/canvas-geometry";
import { getNodeVisualConfig } from "./node-config";

function MindMapNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as MindMapNodeData;
  const config = getNodeVisualConfig(
    nodeData.type,
    nodeData.color,
    nodeData.icon,
  );
  const size = nodeSize({ data: nodeData });
  const { zoom } = useViewport();
  const connectedToSelection = useMindMapStore((state) => {
    const selectedIds = new Set(
      state.nodes.filter((node) => node.selected).map((node) => node.id),
    );
    return state.edges.some(
      (edge) =>
        (edge.source === id && selectedIds.has(edge.target)) ||
        (edge.target === id && selectedIds.has(edge.source)),
    );
  });
  const showConnectionContext = connectedToSelection && !selected;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nodeData.label);
  const input = useRef<HTMLTextAreaElement>(null);
  const cancelled = useRef(false);
  const updateLabel = useMindMapStore((s) => s.updateNodeLabel);
  useEffect(() => {
    if (editing) {
      input.current?.focus();
      input.current?.select();
    }
  }, [editing]);
  const commit = useCallback(() => {
    setEditing(false);
    if (!cancelled.current && value.trim() && value.trim() !== nodeData.label)
      updateLabel(id, value.trim());
  }, [id, nodeData.label, value, updateLabel]);
  const diamond = nodeData.type === "diamond",
    square = diamond || nodeData.type === "circle";
  const highlight = nodeData.proposalHighlight;
  return (
    <div
      className="relative"
      style={size}
      aria-description={
        showConnectionContext
          ? "Directly connected to a selected node"
          : undefined
      }
    >
      <div
        className={`relative flex items-center justify-center border-2 shadow-sm ${selected ? "ring-2 ring-blue-400" : ""} ${highlight ? `proposal-highlight-${highlight}` : ""}`}
        style={{
          ...size,
          boxSizing: "border-box",
          borderRadius: diamond
            ? 0
            : nodeData.type === "circle"
              ? "50%"
              : nodeData.type === "rounded-rect"
                ? 16
                : 6,
          borderColor: diamond
            ? "transparent"
            : showConnectionContext
              ? "#93c5fd"
              : config.borderColor,
          background: diamond ? "transparent" : config.bgColor,
        }}
        onDoubleClick={() => {
          cancelled.current = false;
          setValue(nodeData.label);
          setEditing(true);
        }}
      >
        {diamond && (
          <>
            <div
              className="absolute"
              style={{
                inset: -2,
                clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)",
                background: selected
                  ? "#60a5fa"
                  : showConnectionContext
                    ? "#93c5fd"
                    : config.borderColor,
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)",
                background: config.bgColor,
              }}
            />
          </>
        )}
        <div
          className="relative flex flex-col items-center justify-center gap-1"
          style={{
            width: square ? 120 : size.width - 32,
            color: "#1f2937",
            fontSize: 14,
            lineHeight: "20px",
            textAlign: "center",
            overflowWrap: "anywhere",
          }}
        >
          {(nodeData.role === "suggestion" || nodeData.role === "question") && (
            <span className="text-[10px] uppercase tracking-wide text-gray-500">
              {nodeData.role === "question" ? "Open question" : "Suggested"}
            </span>
          )}
          {nodeData.icon && <span aria-hidden="true">{nodeData.icon}</span>}
          {editing ? (
            <textarea
              ref={input}
              aria-label="Node label"
              className="nodrag nopan resize-none w-full bg-transparent outline-none ring-1 ring-blue-300 rounded"
              style={{
                height: Math.max(
                  20,
                  size.height - (square ? size.height * 0.5 : 32),
                ),
                font: "inherit",
                textAlign: "center",
              }}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  commit();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelled.current = true;
                  setEditing(false);
                }
              }}
            />
          ) : (
            <span>{nodeData.label}</span>
          )}
        </div>
      </div>
      {[Position.Top, Position.Right, Position.Bottom, Position.Left].map(
        (side) => (
          <Handle
            key={side}
            type="source"
            position={side}
            id={side}
            title={`Connect from ${side}`}
            className="node-handle !bg-transparent !border-0 flex items-center justify-center"
            style={{
              width: 1,
              height: 1,
              minWidth: 1,
              minHeight: 1,
              visibility: zoom < 0.65 ? "hidden" : "visible",
            }}
          >
            <span
              className="absolute flex items-center justify-center"
              style={{
                width: 24 / zoom,
                height: 24 / zoom,
                left: "50%",
                top: "50%",
                transform: "translate(-50%,-50%)",
              }}
            >
              <span
                className="rounded-full bg-blue-500 border border-white pointer-events-none"
                style={{ width: 8 / zoom, height: 8 / zoom }}
              />
            </span>
          </Handle>
        ),
      )}
    </div>
  );
}
export default memo(MindMapNodeComponent);
