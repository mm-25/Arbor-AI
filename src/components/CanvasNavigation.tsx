"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useReactFlow, useViewport } from "@xyflow/react";
import { useMindMapStore } from "@/store/mindmap-store";
import { useEditorStore } from "@/store/editor-store";
import { fitViewport } from "@/lib/canvas-geometry";
import { documentBounds } from "@/lib/connector-endpoints";
import NodeStyleToolbar from "./nodes/NodeStyleToolbar";

export default function CanvasNavigation({
  wrapper,
}: {
  wrapper: RefObject<HTMLDivElement | null>;
}) {
  const flow = useReactFlow(),
    { zoom } = useViewport();
  const tool = useEditorStore((s) => s.tool),
    setTool = useEditorStore((s) => s.setTool);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [insets, setInsets] = useState({ left: 256, right: 416 });
  useEffect(() => {
    const root = wrapper.current;
    if (!root) return;
    const measure = () => {
      const parent = root.getBoundingClientRect();
      let left = 0,
        right = 0;
      setSize((old) =>
        old.width === parent.width && old.height === parent.height
          ? old
          : { width: parent.width, height: parent.height },
      );
      root
        .querySelectorAll<HTMLElement>("[data-canvas-panel]")
        .forEach((panel) => {
          const r = panel.getBoundingClientRect();
          if (panel.dataset.canvasPanel === "left")
            left = Math.max(left, r.right - parent.left + 12);
          else right = Math.max(right, parent.right - r.left + 12);
        });
      setInsets((old) =>
        old.left === left && old.right === right ? old : { left, right },
      );
    };
    const resize = new ResizeObserver(measure);
    const observe = () => {
      resize.disconnect();
      resize.observe(root);
      root
        .querySelectorAll<HTMLElement>("[data-canvas-panel]")
        .forEach((p) => resize.observe(p));
      measure();
    };
    const mutations = new MutationObserver(observe);
    mutations.observe(root, { childList: true, subtree: true });
    observe();
    return () => {
      resize.disconnect();
      mutations.disconnect();
    };
  }, [wrapper]);
  const fit = useCallback(
    (selected = false) => {
      const current = useMindMapStore.getState();
      const nodes = selected
        ? current.nodes.filter((n) => n.selected)
        : current.nodes;
      const edges = selected
        ? current.edges.filter((e) => e.selected)
        : current.edges;
      if (nodes.length || edges.length)
        void flow.setViewport(
          fitViewport(documentBounds(nodes, edges, current.nodes), size, {
            ...insets,
            bottom: 110,
          }),
          {
            duration: 200,
          },
        );
    },
    [flow, insets, size],
  );
  const fitRequest = useEditorStore((s) => s.fitRequest);
  const lastFit = useRef(fitRequest);
  useEffect(() => {
    if (lastFit.current === fitRequest) return;
    const frame = requestAnimationFrame(() => {
      fit();
      lastFit.current = fitRequest;
    });
    return () => cancelAnimationFrame(frame);
  }, [fitRequest, fit]);
  const selectedCount = useMindMapStore(
    (s) =>
      s.nodes.filter((n) => n.selected).length +
      s.edges.filter((e) => e.selected).length,
  );
  const selectedNode = useMindMapStore((s) => s.nodes.find((n) => n.selected));
  const selectedEdge = useMindMapStore((s) => s.edges.find((e) => e.selected));
  const edgeStyle = (patch: Record<string, unknown>) =>
    useMindMapStore
      .getState()
      .updateEdges((edges) =>
        edges.map((e) =>
          e.id === selectedEdge?.id
            ? { ...e, data: { ...e.data, ...patch } }
            : e,
        ),
      );
  return (
    <div
      className="absolute bottom-4 z-20 pointer-events-none flex flex-col items-center gap-2 justify-center"
      style={{ left: insets.left, right: insets.right }}
    >
      {selectedCount === 1 && selectedNode && !selectedEdge && (
        <NodeStyleToolbar
          key={selectedNode.id}
          nodeId={selectedNode.id}
          currentColor={selectedNode.data.color}
          currentIcon={selectedNode.data.icon}
          currentType={selectedNode.data.type}
        />
      )}
      {selectedEdge && (
        <div
          role="toolbar"
          aria-label="Connection properties"
          className="pointer-events-auto flex flex-wrap justify-center items-center gap-2 rounded-xl border bg-white shadow-md p-2 text-xs"
        >
          <input
            key={`${selectedEdge.id}:${String(selectedEdge.label)}`}
            id={`edge-label-${selectedEdge.id}`}
            aria-label="Connection label"
            placeholder="Connection label"
            defaultValue={
              typeof selectedEdge.label === "string" ? selectedEdge.label : ""
            }
            className="w-36 rounded border px-2 py-1.5"
            onBlur={(event) => {
              const label = event.target.value.trim();
              if (label !== (selectedEdge.label ?? ""))
                useMindMapStore
                  .getState()
                  .updateEdgeLabel(selectedEdge.id, label);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                event.currentTarget.value = String(selectedEdge.label ?? "");
                event.currentTarget.blur();
              }
            }}
          />
          <label className="flex items-center gap-1">
            Color
            <input
              aria-label="Connection color"
              type="color"
              value={String(selectedEdge.data?.strokeColor ?? "#64748b")}
              onChange={(event) =>
                edgeStyle({ strokeColor: event.target.value })
              }
              className="w-7 h-7"
            />
          </label>
          <select
            aria-label="Connection stroke"
            value={String(selectedEdge.data?.strokeStyle ?? "solid")}
            onChange={(event) => edgeStyle({ strokeStyle: event.target.value })}
            className="border rounded px-1 py-1.5"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
          </select>
          <button
            className="rounded px-2 py-1.5 hover:bg-gray-100"
            onClick={() =>
              useMindMapStore.getState().updateEdges((edges) =>
                edges.map((e) => {
                  if (e.id !== selectedEdge.id) return e;
                  const data = { ...e.data };
                  delete data.corners;
                  delete data.parallelOffset;
                  delete data.parallelAxis;
                  return { ...e, data };
                }),
              )
            }
          >
            Reset route
          </button>
        </div>
      )}
      <div
        role="toolbar"
        aria-label="Canvas tools"
        className="pointer-events-auto flex flex-wrap justify-center items-center gap-1 rounded-xl bg-white border border-gray-200 shadow-md p-1.5 text-xs text-gray-700"
      >
        {(
          [
            ["select", "Select (V)"],
            ["hand", "Hand (H)"],
            ["connect", "Connect (C)"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            aria-pressed={tool === value}
            className={`px-2 py-2 rounded-md ${tool === value ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100"}`}
            onClick={() => setTool(value)}
          >
            {label}
          </button>
        ))}
        <span className="h-5 border-l mx-1" />
        <button
          className="px-2 py-2 rounded hover:bg-gray-100"
          aria-label="Zoom Out"
          onClick={() => flow.zoomOut()}
        >
          −
        </button>
        <span className="min-w-10 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          className="px-2 py-2 rounded hover:bg-gray-100"
          aria-label="Zoom In"
          onClick={() => flow.zoomIn()}
        >
          +
        </button>
        <button
          className="px-2 py-2 rounded hover:bg-gray-100"
          onClick={() => fit()}
        >
          Fit map
        </button>
        {!!selectedCount && (
          <button
            className="px-2 py-2 rounded hover:bg-gray-100"
            onClick={() => fit(true)}
          >
            Fit {selectedCount} selected
          </button>
        )}
      </div>
    </div>
  );
}
