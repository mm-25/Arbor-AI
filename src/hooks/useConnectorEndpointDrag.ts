"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useMindMapStore as graph } from "@/store/mindmap-store";
import { useChatStore as chat } from "@/store/chat-store";
import { cleanSnapshot } from "@/lib/graph-snapshot";
import {
  endpointOf,
  replaceEndpoint,
  resolveEndpoint,
  snapEndpoint,
  type ConnectorEndpoint,
} from "@/lib/connector-endpoints";
import type { Point } from "@/lib/canvas-geometry";

/** Overlays are not drawing surfaces, even when a pointer is captured. */
export function canDropOnCanvas(point: Point): boolean {
  const canvas = document.querySelector(".react-flow");
  if (!canvas) return false;
  const bounds = canvas.getBoundingClientRect();
  if (
    point.x < bounds.left ||
    point.x > bounds.right ||
    point.y < bounds.top ||
    point.y > bounds.bottom
  )
    return false;
  for (const element of document.elementsFromPoint(point.x, point.y)) {
    if (element.closest("[data-endpoint-control]")) continue;
    if (
      element.closest('[data-canvas-panel], [role="toolbar"], [role="dialog"]')
    )
      return false;
    return !!element.closest(".react-flow");
  }
  return false;
}
interface Options {
  screenToFlow: (point: Point) => Point;
  zoom: number;
  canDrop?: (point: Point) => boolean;
}
export function useConnectorEndpointDrag(
  id: string,
  { screenToFlow, zoom, canDrop = canDropOnCanvas }: Options,
) {
  const epoch = chat((s) => s.sessionEpoch);
  const [draft, setDraft] = useState<{
    epoch: number;
    end: "source" | "target";
    endpoint: ConnectorEndpoint;
  } | null>(null);
  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanup.current?.(), [epoch]);
  const start = useCallback(
    (event: ReactPointerEvent, end: "source" | "target") => {
      if (event.button !== 0 || event.isPrimary === false) return;
      event.preventDefault();
      event.stopPropagation();
      cleanup.current?.();
      const edge = graph.getState().edges.find((e) => e.id === id);
      if (!edge) return;
      const owner = chat.getState().sessionEpoch,
        fingerprint = JSON.stringify(cleanSnapshot(graph.getState()));
      const pointerId = event.pointerId,
        origin = { x: event.clientX, y: event.clientY };
      let moved = false;
      const cancel = () => {
        cleanup.current?.();
        setDraft(null);
      };
      const move = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) return;
        const screen = { x: event.clientX, y: event.clientY };
        moved ||= Math.hypot(screen.x - origin.x, screen.y - origin.y) >= 2;
        if (moved)
          setDraft({
            epoch: owner,
            end,
            endpoint: snapEndpoint(
              screenToFlow(screen),
              graph.getState().nodes,
              zoom,
              event.altKey,
            ),
          });
      };
      const endDrag = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) return;
        cleanup.current?.();
        setDraft(null);
        const screen = { x: event.clientX, y: event.clientY };
        if (
          !moved ||
          owner !== chat.getState().sessionEpoch ||
          JSON.stringify(cleanSnapshot(graph.getState())) !== fingerprint ||
          !canDrop(screen)
        )
          return;
        const endpoint = snapEndpoint(
          screenToFlow(screen),
          graph.getState().nodes,
          zoom,
          event.altKey,
        );
        const connection = replaceEndpoint(
          edge,
          end,
          endpoint,
          graph.getState().nodes,
        );
        if (connection) graph.getState().reconnectEdge(id, connection, owner);
      };
      const key = (event: KeyboardEvent) => {
        if (event.key === "Escape") cancel();
      };
      cleanup.current = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", endDrag);
        window.removeEventListener("pointercancel", cancel);
        window.removeEventListener("keydown", key);
        window.removeEventListener("blur", cancel);
        cleanup.current = null;
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", cancel);
      window.addEventListener("keydown", key);
      window.addEventListener("blur", cancel);
    },
    [id, screenToFlow, zoom, canDrop],
  );
  const nudge = useCallback(
    (end: "source" | "target", delta: Point) => {
      const edge = graph.getState().edges.find((e) => e.id === id);
      if (!edge) return;
      const point = resolveEndpoint(
        endpointOf(edge, end),
        graph.getState().nodes,
      );
      if (!point) return;
      const connection = replaceEndpoint(
        edge,
        end,
        {
          kind: "point",
          point: { x: point.x + delta.x / zoom, y: point.y + delta.y / zoom },
        },
        graph.getState().nodes,
      );
      if (connection) graph.getState().reconnectEdge(id, connection, epoch);
    },
    [id, epoch, zoom],
  );
  return { start, nudge, preview: draft?.epoch === epoch ? draft : null };
}
