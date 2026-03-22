"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { type EdgeProps, useReactFlow, EdgeLabelRenderer } from "@xyflow/react";

interface Waypoint {
  x: number;
  y: number;
}

export interface EditableEdgeData {
  waypoints?: Waypoint[];
  [key: string]: unknown;
}

export default function EditableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  label,
  selected,
  markerEnd,
}: EdgeProps) {
  const { setEdges, screenToFlowPosition } = useReactFlow();
  const edgeData = data as EditableEdgeData | undefined;
  const waypoints: Waypoint[] = edgeData?.waypoints ?? [];
  const proposalHighlight = edgeData?.proposalHighlight as "update" | "remove" | undefined;
  const edgeHighlightClass = proposalHighlight === "update"
    ? "proposal-edge-update"
    : proposalHighlight === "remove"
    ? "proposal-edge-remove"
    : "";

  // Build path through all points
  const allPoints = [
    { x: sourceX, y: sourceY },
    ...waypoints,
    { x: targetX, y: targetY },
  ];

  const edgePath = allPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Drag a waypoint to reposition it
  const onWaypointMouseDown = (
    event: React.MouseEvent,
    waypointIndex: number
  ) => {
    event.stopPropagation();
    event.preventDefault();

    const onMouseMove = (ev: MouseEvent) => {
      const flowPos = screenToFlowPosition({
        x: ev.clientX,
        y: ev.clientY,
      });

      setEdges((edges) =>
        edges.map((e) => {
          if (e.id !== id) return e;
          const newWaypoints = [
            ...((e.data as EditableEdgeData)?.waypoints ?? []),
          ];
          newWaypoints[waypointIndex] = flowPos;
          return { ...e, data: { ...e.data, waypoints: newWaypoints } };
        })
      );
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Right-click a waypoint to remove it
  const onWaypointContextMenu = (
    event: React.MouseEvent,
    waypointIndex: number
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setEdges((edges) =>
      edges.map((e) => {
        if (e.id !== id) return e;
        const newWaypoints = [
          ...((e.data as EditableEdgeData)?.waypoints ?? []),
        ];
        newWaypoints.splice(waypointIndex, 1);
        return { ...e, data: { ...e.data, waypoints: newWaypoints } };
      })
    );
  };

  // When selected and no waypoints, show a draggable midpoint handle to start bending
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  const onMidpointMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    // Insert a waypoint at the midpoint and immediately start dragging it
    const flowPos = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    setEdges((edges) =>
      edges.map((e) => {
        if (e.id !== id) return e;
        return { ...e, data: { ...e.data, waypoints: [flowPos] } };
      })
    );

    // Start drag for the new waypoint (index 0)
    const onMouseMove = (ev: MouseEvent) => {
      const pos = screenToFlowPosition({
        x: ev.clientX,
        y: ev.clientY,
      });

      setEdges((edges) =>
        edges.map((e) => {
          if (e.id !== id) return e;
          return { ...e, data: { ...e.data, waypoints: [pos] } };
        })
      );
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Label position: midpoint of the full path
  const labelMidIdx = Math.floor(allPoints.length / 2);
  const labelX =
    allPoints.length % 2 === 0
      ? (allPoints[labelMidIdx - 1].x + allPoints[labelMidIdx].x) / 2
      : allPoints[labelMidIdx].x;
  const labelY =
    allPoints.length % 2 === 0
      ? (allPoints[labelMidIdx - 1].y + allPoints[labelMidIdx].y) / 2
      : allPoints[labelMidIdx].y;

  // Edge label editing
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editLabelValue, setEditLabelValue] = useState(
    typeof label === "string" ? label : ""
  );
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);

  const handleLabelDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setEditLabelValue(typeof label === "string" ? label : "");
      setIsEditingLabel(true);
    },
    [label]
  );

  const commitLabel = useCallback(() => {
    const trimmed = editLabelValue.trim();
    setEdges((edges) =>
      edges.map((e) => (e.id === id ? { ...e, label: trimmed } : e))
    );
    setIsEditingLabel(false);
  }, [editLabelValue, id, setEdges]);

  const handleLabelKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitLabel();
      } else if (e.key === "Escape") {
        setIsEditingLabel(false);
      }
    },
    [commitLabel]
  );

  return (
    <>
      {/* Invisible wide path for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: "pointer" }}
      />
      {/* Visible edge line */}
      <path
        d={edgePath}
        fill="none"
        stroke={proposalHighlight ? undefined : selected ? "#3b82f6" : "#b1b1b7"}
        strokeWidth={proposalHighlight ? undefined : selected ? 2 : 1.5}
        markerEnd={markerEnd}
        className={`react-flow__edge-path ${edgeHighlightClass}`}
      />

      {selected && (
        <EdgeLabelRenderer>
          {/* If no waypoints exist, show a midpoint handle the user can drag to bend */}
          {waypoints.length === 0 && (
            <div
              className="absolute pointer-events-auto"
              style={{
                transform: `translate(-50%, -50%) translate(${midX}px, ${midY}px)`,
              }}
            >
              <div
                className="w-4 h-4 rounded-full bg-white border-2 border-blue-500 cursor-grab active:cursor-grabbing hover:scale-125 transition-transform shadow-sm"
                onMouseDown={onMidpointMouseDown}
                title="Drag to bend edge"
              />
            </div>
          )}

          {/* Render existing waypoint control points */}
          {waypoints.map((wp, i) => (
            <div
              key={`wp-${id}-${i}`}
              className="absolute pointer-events-auto"
              style={{
                transform: `translate(-50%, -50%) translate(${wp.x}px, ${wp.y}px)`,
              }}
            >
              <div
                className="w-4 h-4 rounded-full bg-white border-2 border-blue-500 cursor-grab active:cursor-grabbing hover:scale-125 transition-transform shadow-sm"
                onMouseDown={(e) => onWaypointMouseDown(e, i)}
                onContextMenu={(e) => onWaypointContextMenu(e, i)}
                title="Drag to move · Right-click to remove"
              />
            </div>
          ))}

          {/* Show segment midpoints for adding more waypoints */}
          {waypoints.length > 0 &&
            allPoints.slice(0, -1).map((pt, i) => {
              const nextPt = allPoints[i + 1];
              const segMidX = (pt.x + nextPt.x) / 2;
              const segMidY = (pt.y + nextPt.y) / 2;

              // Don't show if too close to an existing waypoint
              const tooClose = waypoints.some(
                (wp) => Math.hypot(wp.x - segMidX, wp.y - segMidY) < 30
              );
              if (tooClose) return null;

              return (
                <div
                  key={`seg-${id}-${i}`}
                  className="absolute pointer-events-auto"
                  style={{
                    transform: `translate(-50%, -50%) translate(${segMidX}px, ${segMidY}px)`,
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300 cursor-grab active:cursor-grabbing hover:bg-blue-200 hover:scale-125 transition-all opacity-60 hover:opacity-100"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();

                      const pos = screenToFlowPosition({
                        x: e.clientX,
                        y: e.clientY,
                      });

                      // Insert waypoint at this segment
                      // The waypoint index to insert at = i (because allPoints[0] is source, allPoints[1..n] are waypoints, allPoints[n+1] is target)
                      // segment i connects allPoints[i] to allPoints[i+1]
                      // waypoint index = i for segments after source (segment 0 inserts at waypoint 0, segment 1 at waypoint 1, etc.)
                      const insertIdx = i;

                      setEdges((edges) =>
                        edges.map((edge) => {
                          if (edge.id !== id) return edge;
                          const wps = [
                            ...((edge.data as EditableEdgeData)?.waypoints ?? []),
                          ];
                          wps.splice(insertIdx, 0, pos);
                          return { ...edge, data: { ...edge.data, waypoints: wps } };
                        })
                      );

                      // Start dragging the newly inserted waypoint
                      const onMouseMove = (ev: MouseEvent) => {
                        const flowPos = screenToFlowPosition({
                          x: ev.clientX,
                          y: ev.clientY,
                        });
                        setEdges((edges) =>
                          edges.map((edge) => {
                            if (edge.id !== id) return edge;
                            const wps = [
                              ...((edge.data as EditableEdgeData)?.waypoints ?? []),
                            ];
                            wps[insertIdx] = flowPos;
                            return { ...edge, data: { ...edge.data, waypoints: wps } };
                          })
                        );
                      };

                      const onMouseUp = () => {
                        window.removeEventListener("mousemove", onMouseMove);
                        window.removeEventListener("mouseup", onMouseUp);
                      };

                      window.addEventListener("mousemove", onMouseMove);
                      window.addEventListener("mouseup", onMouseUp);
                    }}
                    title="Drag to add waypoint"
                  />
                </div>
              );
            })}
        </EdgeLabelRenderer>
      )}

      {/* Edge label — editable on double-click */}
      <EdgeLabelRenderer>
        {isEditingLabel ? (
          <div
            className="absolute pointer-events-auto"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <input
              ref={labelInputRef}
              value={editLabelValue}
              onChange={(e) => setEditLabelValue(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={handleLabelKeyDown}
              className="text-xs bg-white border border-blue-400 rounded px-1.5 py-0.5 shadow-sm outline-none ring-1 ring-blue-300 min-w-[60px] text-center"
              placeholder="Add label..."
            />
          </div>
        ) : label ? (
          <div
            className={`absolute text-xs bg-white/80 px-1 rounded ${
              selected ? "pointer-events-auto cursor-text hover:bg-blue-50" : "pointer-events-none"
            }`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onDoubleClick={selected ? handleLabelDoubleClick : undefined}
          >
            {label}
          </div>
        ) : selected ? (
          <div
            className="absolute pointer-events-auto"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <button
              className="text-[10px] text-gray-400 hover:text-blue-500 bg-white/80 hover:bg-blue-50 border border-dashed border-gray-300 hover:border-blue-400 rounded px-1.5 py-0.5 transition-colors"
              onDoubleClick={handleLabelDoubleClick}
              onClick={handleLabelDoubleClick}
              title="Add label"
            >
              + label
            </button>
          </div>
        ) : null}
      </EdgeLabelRenderer>
    </>
  );
}
