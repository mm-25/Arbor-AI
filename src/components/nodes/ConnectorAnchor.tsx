"use client";
import { Handle, Position } from "@xyflow/react";
/** A render-only endpoint. It is never a saved or AI-visible concept. */
export default function ConnectorAnchor() {
  return (
    <div
      aria-hidden="true"
      style={{ width: 1, height: 1, pointerEvents: "none" }}
    >
      <Handle
        type="source"
        id="free"
        position={Position.Right}
        style={{
          width: 1,
          height: 1,
          minWidth: 1,
          minHeight: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
