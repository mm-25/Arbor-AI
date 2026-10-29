"use client";

import { memo, useState } from "react";
import { COLOR_PRESETS, NODE_TYPE_CONFIGS } from "./node-config";
import { useMindMapStore, type NodeType } from "@/store/mindmap-store";

interface NodeStyleToolbarProps {
  nodeId: string;
  currentColor?: string;
  currentIcon?: string;
  currentType: NodeType;
}

const SHAPE_OPTIONS: { type: NodeType; label: string }[] = [
  { type: "rectangle", label: "Rectangle" },
  { type: "rounded-rect", label: "Rounded" },
  { type: "circle", label: "Circle" },
  { type: "diamond", label: "Diamond" },
];

function ShapeIcon({
  shape,
  size = 16,
  active,
}: {
  shape: string;
  size?: number;
  active?: boolean;
}) {
  const stroke = active ? "#3b82f6" : "#6b7280";
  const sw = active ? 2.5 : 1.5;
  switch (shape) {
    case "circle":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16">
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    case "diamond":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16">
          <polygon
            points="8,1 15,8 8,15 1,8"
            fill="none"
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    case "rounded-rect":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16">
          <rect
            x="1"
            y="4"
            width="14"
            height="8"
            rx="4"
            fill="none"
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 16 16">
          <rect
            x="1"
            y="4"
            width="14"
            height="8"
            rx="1.5"
            fill="none"
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
  }
}

function NodeStyleToolbarComponent({
  nodeId,
  currentColor,
  currentIcon,
  currentType,
}: NodeStyleToolbarProps) {
  const updateNodeStyle = useMindMapStore((s) => s.updateNodeStyle);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const selectionCount = useMindMapStore(
    (s) => s.nodes.filter((n) => n.selected).length,
  );

  const activePreset = COLOR_PRESETS.find((p) => p.color === currentColor);
  const baseConfig = NODE_TYPE_CONFIGS[currentType];
  const effectiveColor = activePreset?.color ?? baseConfig.color;

  if (selectionCount > 1) return null;
  return (
    <div
      role="toolbar"
      aria-label="Node properties"
      className="pointer-events-auto flex flex-wrap justify-center items-center gap-1 bg-white border rounded-lg shadow-lg px-2 py-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="text-xs px-2 py-1"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        Style
      </button>
      {expanded && (
        <>
          {/* Shape selector */}
          {SHAPE_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => updateNodeStyle(nodeId, { type: opt.type })}
              className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                currentType === opt.type ? "bg-blue-50" : ""
              }`}
              title={opt.label}
            >
              <ShapeIcon shape={opt.type} active={currentType === opt.type} />
            </button>
          ))}

          <div className="w-px h-5 bg-gray-200 mx-0.5" />

          {/* Color swatches */}
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => updateNodeStyle(nodeId, { color: preset.color })}
              className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                effectiveColor === preset.color
                  ? "border-gray-800 scale-110"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: preset.color }}
              title={preset.name}
            />
          ))}

          <div className="w-px h-5 bg-gray-200 mx-0.5" />

          {/* Icon button */}
          <div className="relative">
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="p-1 rounded hover:bg-gray-100 transition-colors text-sm min-w-[24px] text-center"
              title="Change icon"
            >
              {currentIcon || baseConfig.icon}
            </button>
            {showIconPicker && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-white border rounded-lg shadow-lg p-2 z-50">
                <input
                  type="text"
                  placeholder="Type emoji..."
                  className="w-24 text-sm border rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-blue-300 text-center"
                  autoFocus
                  maxLength={4}
                  defaultValue={currentIcon || ""}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) updateNodeStyle(nodeId, { icon: val });
                      setShowIconPicker(false);
                    }
                    if (e.key === "Escape") setShowIconPicker(false);
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val) updateNodeStyle(nodeId, { icon: val });
                    setShowIconPicker(false);
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default memo(NodeStyleToolbarComponent);
