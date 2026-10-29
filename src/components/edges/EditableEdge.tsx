"use client";
import { useState, useRef, useEffect, useId } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
  useViewport,
  type EdgeProps,
} from "@xyflow/react";
import { useMindMapStore } from "@/store/mindmap-store";
import { useChatStore } from "@/store/chat-store";
import { useConnectorEndpointDrag } from "@/hooks/useConnectorEndpointDrag";
import { connectorGeometry } from "@/lib/connector-geometry";
import {
  applyConnection,
  replaceEndpoint,
  sameConnection,
  edgeConnection,
} from "@/lib/connector-endpoints";
import { nodeBox, type Point } from "@/lib/canvas-geometry";
import { routeConnection, roundedPath } from "@/lib/edge-routing";
export interface EditableEdgeData {
  corners?: Point[];
  strokeColor?: string;
  strokeStyle?: "solid" | "dashed";
  [key: string]: unknown;
}

export default function EditableEdge({ id, label, selected }: EdgeProps) {
  const markerId = `connector-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const nodes = useMindMapStore((s) => s.nodes),
    edges = useMindMapStore((s) => s.edges),
    updateEdges = useMindMapStore((s) => s.updateEdges);
  const epoch = useChatStore((s) => s.sessionEpoch),
    { zoom } = useViewport(),
    { screenToFlowPosition } = useReactFlow();
  const [draft, setDraft] = useState<{
    epoch: number;
    corners: Point[];
  } | null>(null);
  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanup.current?.(), [epoch]);
  const endpointDrag = useConnectorEndpointDrag(id, {
    screenToFlow: screenToFlowPosition,
    zoom,
  });
  const original = edges.find((edge) => edge.id === id);
  let edge = original;
  if (edge && endpointDrag.preview) {
    const connection = replaceEndpoint(
      edge,
      endpointDrag.preview.end,
      endpointDrag.preview.endpoint,
      nodes,
    );
    if (connection) edge = applyConnection(edge, connection);
  }
  const edgeData = edge?.data as EditableEdgeData | undefined;
  const corners = draft?.epoch === epoch ? draft.corners : edgeData?.corners;
  let geometry = edge ? connectorGeometry(edge, nodes, corners) : null;
  if (!edge || !geometry) return null;
  const parallel = edges.filter((other) =>
    sameConnection(edgeConnection(other), edgeConnection(edge!)),
  );
  if (!corners?.length && !endpointDrag.preview && parallel.length > 1) {
    const lane =
      (parallel.findIndex((e) => e.id === id) - (parallel.length - 1) / 2) * 32;
    const horizontal =
      geometry.sourceSide === "left" ||
      geometry.sourceSide === "right" ||
      Math.abs(geometry.a.x - geometry.b.x) >=
        Math.abs(geometry.a.y - geometry.b.y);
    let point = {
      x: (geometry.a.x + geometry.b.x) / 2 + (horizontal ? 0 : lane),
      y: (geometry.a.y + geometry.b.y) / 2 + (horizontal ? lane : 0),
    };
    for (
      let i = 0;
      i < 20 &&
      geometry.obstacles.some(
        (r) =>
          point.x > r.x &&
          point.x < r.x + r.width &&
          point.y > r.y &&
          point.y < r.y + r.height,
      );
      i++
    )
      point = { x: point.x + 32, y: point.y + 32 };
    geometry = connectorGeometry(edge, nodes, [point])!;
  }
  const { points, a, b, sourceSide, targetSide, obstacles } = geometry;
  const segments = points.slice(0, -1).map((p, i) => ({
    a: p,
    b: points[i + 1],
    i,
    length: Math.hypot(points[i + 1].x - p.x, points[i + 1].y - p.y),
  }));
  const longest = [...segments].sort((a, b) => b.length - a.length)[0];
  const labelPoint = longest
    ? { x: (longest.a.x + longest.b.x) / 2, y: (longest.a.y + longest.b.y) / 2 }
    : a;
  const startSegment = (event: React.MouseEvent, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    cleanup.current?.();
    const original = points.slice(1, -1).map((p) => ({ ...p })),
      horizontal = points[index].y === points[index + 1].y;
    let latest = original,
      moved = false;
    const move = (event: MouseEvent) => {
      const point = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      latest = original.map((p) => ({ ...p }));
      for (const at of [index - 1, index])
        if (latest[at])
          latest[at] = horizontal
            ? { ...latest[at], y: point.y }
            : { ...latest[at], x: point.x };
      moved ||= JSON.stringify(latest) !== JSON.stringify(original);
      setDraft({ epoch, corners: latest });
    };
    const end = () => {
      cleanup.current?.();
      setDraft(null);
      if (!moved || epoch !== useChatStore.getState().sessionEpoch) return;
      const route = routeConnection(
        a,
        b,
        sourceSide,
        targetSide,
        obstacles,
        latest,
      );
      if (!route.blocked && !route.adjusted)
        updateEdges((edges) =>
          edges.map((e) =>
            e.id === id ? { ...e, data: { ...e.data, corners: latest } } : e,
          ),
        );
    };
    const cancel = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cleanup.current?.();
        setDraft(null);
      }
    };
    cleanup.current = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("keydown", cancel);
      cleanup.current = null;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    window.addEventListener("keydown", cancel);
  };
  const highlight = edgeData?.proposalHighlight;
  const snapEndpoint = endpointDrag.preview?.endpoint;
  const snapNode =
    snapEndpoint?.kind === "node"
      ? nodes.find((n) => n.id === snapEndpoint.nodeId)
      : undefined;
  const snapBox = snapNode ? nodeBox(snapNode, 4) : null;
  const connectedToSelection = nodes.some(
    (node) =>
      node.selected && (node.id === edge.source || node.id === edge.target),
  );
  const focused = selected || connectedToSelection;
  const stroke = focused ? "#2563eb" : (edgeData?.strokeColor ?? "#64748b");
  return (
    <>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={stroke} />
        </marker>
      </defs>
      <BaseEdge
        path={roundedPath(points)}
        markerEnd={`url(#${markerId})`}
        interactionWidth={24 / zoom}
        style={{
          stroke,
          strokeWidth: focused ? 2.5 : 1.75,
          strokeDasharray:
            edgeData?.strokeStyle === "dashed" ? "6 4" : undefined,
        }}
        className={highlight ? `proposal-edge-${highlight}` : undefined}
      />
      {snapBox && (
        <rect
          {...snapBox}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2 / zoom}
          strokeDasharray={`${4 / zoom} ${3 / zoom}`}
          pointerEvents="none"
        />
      )}
      <EdgeLabelRenderer>
        {selected &&
          (
            [
              ["source", a],
              ["target", b],
            ] as const
          ).map(([end, point]) => (
            <button
              key={end}
              type="button"
              data-endpoint-control="true"
              aria-label={`Move connection ${end === "source" ? "start" : "end"}`}
              title="Drag to move freely or attach to a node. Hold Alt to keep free. Arrow keys nudge freely."
              className="nodrag nopan absolute pointer-events-auto flex items-center justify-center"
              style={{
                left: 0,
                top: 0,
                transformOrigin: "0 0",
                width: 28,
                height: 28,
                zIndex: 1001,
                touchAction: "none",
                cursor: endpointDrag.preview ? "grabbing" : "grab",
                transform: `translate(${point.x}px,${point.y}px) scale(${1 / zoom}) translate(-50%,-50%)`,
              }}
              onPointerDown={(event) => endpointDrag.start(event, end)}
              onKeyDown={(event) => {
                const delta =
                  event.key === "ArrowLeft"
                    ? { x: -1, y: 0 }
                    : event.key === "ArrowRight"
                      ? { x: 1, y: 0 }
                      : event.key === "ArrowUp"
                        ? { x: 0, y: -1 }
                        : event.key === "ArrowDown"
                          ? { x: 0, y: 1 }
                          : null;
                if (delta) {
                  event.preventDefault();
                  event.stopPropagation();
                  const step = event.shiftKey ? 10 : 1;
                  endpointDrag.nudge(end, {
                    x: delta.x * step,
                    y: delta.y * step,
                  });
                }
              }}
            >
              <span className="w-3 h-3 rounded-full bg-white border-2 border-blue-600 pointer-events-none" />
            </button>
          ))}
        {selected &&
          !endpointDrag.preview &&
          segments
            .filter(
              (s) => s.i > 0 && s.i < points.length - 2 && s.length * zoom > 24,
            )
            .map((s) => (
              <div
                key={s.i}
                role="button"
                aria-label="Adjust connector segment"
                title="Drag to adjust route"
                className="nodrag nopan absolute pointer-events-auto flex items-center justify-center"
                style={{
                  left: 0,
                  top: 0,
                  transformOrigin: "0 0",
                  width: 24,
                  height: 24,
                  transform: `translate(${(s.a.x + s.b.x) / 2}px,${(s.a.y + s.b.y) / 2}px) scale(${1 / zoom}) translate(-50%,-50%)`,
                  cursor: s.a.y === s.b.y ? "ns-resize" : "ew-resize",
                }}
                onMouseDown={(event) => startSegment(event, s.i)}
              >
                <span
                  className="bg-white border-2 border-blue-500 rounded-sm"
                  style={{
                    width: s.a.y === s.b.y ? 14 : 6,
                    height: s.a.y === s.b.y ? 6 : 14,
                  }}
                />
              </div>
            ))}
        {typeof label === "string" && !!label && (
          <div
            className={`absolute text-xs bg-white/95 rounded px-1 ${selected ? "pointer-events-auto cursor-text" : "pointer-events-none"}`}
            style={{
              transform: `translate(-50%,-50%) translate(${labelPoint.x}px,${labelPoint.y - (selected ? 24 / zoom : 0)}px)`,
            }}
            onDoubleClick={() =>
              document.getElementById(`edge-label-${id}`)?.focus()
            }
          >
            {label}
          </div>
        )}
        {endpointDrag.preview && (
          <div
            role="status"
            className="absolute bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded pointer-events-none"
            style={{
              transform: `translate(${(endpointDrag.preview.end === "source" ? a : b).x}px,${(endpointDrag.preview.end === "source" ? a : b).y}px) scale(${1 / zoom}) translate(14px,-24px)`,
            }}
          >
            {snapNode ? `Attach to ${snapNode.data.label}` : "Free endpoint"}
          </div>
        )}
        {selected &&
          !endpointDrag.preview &&
          (geometry.blocked || geometry.adjusted) && (
            <div
              role="status"
              className="absolute text-xs text-amber-800 bg-amber-50 px-2 py-1 rounded pointer-events-none"
              style={{
                transform: `translate(${labelPoint.x}px,${labelPoint.y + 24}px) scale(${1 / zoom})`,
              }}
            >
              {geometry.blocked
                ? "Overlapping nodes block this route"
                : "Stored bends blocked — use Reset route"}
            </div>
          )}
      </EdgeLabelRenderer>
    </>
  );
}
