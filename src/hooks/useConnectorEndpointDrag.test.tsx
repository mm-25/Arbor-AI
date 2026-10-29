// @vitest-environment jsdom
import { act, cleanup, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  useConnectorEndpointDrag,
  canDropOnCanvas,
} from "./useConnectorEndpointDrag";
import { useMindMapStore as graph } from "@/store/mindmap-store";
import { useChatStore as chat } from "@/store/chat-store";
import { useHistoryStore as history } from "@/store/history-store";
const initial = {
  id: "line",
  source: "",
  target: "",
  type: "editable",
  label: "keep",
  data: {
    sourcePoint: { x: 20, y: 30 },
    targetPoint: { x: 100, y: 100 },
    strokeColor: "purple",
  },
};
beforeEach(() => {
  graph.setState({ nodes: [], edges: [structuredClone(initial)] });
  chat.setState({ sessionEpoch: 500 });
  history.getState().clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function event(x: number, y: number) {
  return {
    button: 0,
    clientX: x,
    clientY: y,
    pointerId: 1,
    preventDefault() {},
    stopPropagation() {},
  } as unknown as React.PointerEvent;
}
function pointer(type: string, x: number, y: number, altKey = false) {
  const e = new MouseEvent(type, {
    clientX: x,
    clientY: y,
    altKey,
    bubbles: true,
  });
  Object.defineProperty(e, "pointerId", { value: 1 });
  fireEvent(window, e);
}
const options = {
  screenToFlow: (p: { x: number; y: number }) => p,
  zoom: 1,
  canDrop: () => true,
};
it("previews a free endpoint then commits its final position once with undo recovery", () => {
  const { result } = renderHook(() =>
    useConnectorEndpointDrag("line", options),
  );
  act(() => result.current.start(event(100, 100), "target"));
  pointer("pointermove", 300, 350);
  expect(graph.getState().edges[0]).toEqual(initial);
  expect(result.current.preview?.endpoint).toEqual({
    kind: "point",
    point: { x: 300, y: 350 },
  });
  pointer("pointerup", 300, 350);
  expect(graph.getState().edges[0]).toMatchObject({
    id: "line",
    label: "keep",
    data: { targetPoint: { x: 300, y: 350 }, strokeColor: "purple" },
  });
  expect(history.getState().past).toHaveLength(1);
  act(() => graph.getState().performUndo());
  expect(graph.getState().edges[0].data?.targetPoint).toEqual({
    x: 100,
    y: 100,
  });
});
it("snaps onto a node, detaches from it and retains the other endpoint", () => {
  const node = {
    id: "a",
    position: { x: 100, y: 100 },
    data: { label: "A", type: "rectangle" as const, source: "manual" as const },
  };
  graph.setState({ nodes: [node] });
  const { result } = renderHook(() =>
    useConnectorEndpointDrag("line", options),
  );
  act(() => result.current.start(event(20, 30), "source"));
  pointer("pointermove", 308, 136);
  pointer("pointerup", 308, 136);
  expect(graph.getState().edges[0]).toMatchObject({
    source: "a",
    sourceHandle: "right",
    target: "",
    data: { targetPoint: { x: 100, y: 100 } },
  });
  expect(graph.getState().edges[0].data?.sourcePoint).toBeUndefined();
  act(() => result.current.start(event(308, 136), "source"));
  pointer("pointermove", 500, 400);
  pointer("pointerup", 500, 400);
  expect(graph.getState().edges[0]).toMatchObject({
    source: "",
    target: "",
    data: { sourcePoint: { x: 500, y: 400 }, targetPoint: { x: 100, y: 100 } },
  });
});
it("Escape, a rejected drop, no movement or a map switch cannot commit a stale drag", () => {
  const { result } = renderHook(() =>
    useConnectorEndpointDrag("line", options),
  );
  act(() => result.current.start(event(100, 100), "target"));
  pointer("pointermove", 300, 300);
  fireEvent.keyDown(window, { key: "Escape" });
  pointer("pointerup", 300, 300);
  expect(graph.getState().edges[0]).toEqual(initial);
  act(() => result.current.start(event(100, 100), "target"));
  pointer("pointerup", 100, 100);
  expect(history.getState().past).toHaveLength(0);
  act(() => result.current.start(event(100, 100), "target"));
  pointer("pointermove", 300, 300);
  act(() => chat.setState({ sessionEpoch: 501 }));
  pointer("pointerup", 300, 300);
  expect(graph.getState().edges[0]).toEqual(initial);
  const rejected = renderHook(() =>
    useConnectorEndpointDrag("line", { ...options, canDrop: () => false }),
  );
  act(() => rejected.result.current.start(event(100, 100), "target"));
  pointer("pointermove", 400, 400);
  pointer("pointerup", 400, 400);
  expect(history.getState().past).toHaveLength(0);
});

it("cancels a pointer-cancelled drag and rejects a commit after an intervening graph edit", () => {
  const { result } = renderHook(() =>
    useConnectorEndpointDrag("line", options),
  );
  act(() => result.current.start(event(100, 100), "target"));
  pointer("pointermove", 300, 300);
  pointer("pointercancel", 300, 300);
  pointer("pointerup", 300, 300);
  expect(graph.getState().edges[0]).toEqual(initial);
  expect(history.getState().past).toHaveLength(0);
  act(() => result.current.start(event(100, 100), "target"));
  pointer("pointermove", 300, 300);
  act(() => graph.getState().updateEdgeLabel("line", "New label"));
  pointer("pointerup", 300, 300);
  expect(graph.getState().edges[0]).toMatchObject({
    label: "New label",
    data: { targetPoint: { x: 100, y: 100 } },
  });
  expect(history.getState().past).toHaveLength(1);
});
it("nudges a free endpoint by screen pixels without moving its opposite end", () => {
  const { result } = renderHook(() =>
    useConnectorEndpointDrag("line", { ...options, zoom: 0.5 }),
  );
  act(() => result.current.nudge("source", { x: 10, y: 0 }));
  expect(graph.getState().edges[0].data).toMatchObject({
    sourcePoint: { x: 40, y: 30 },
    targetPoint: { x: 100, y: 100 },
  });
});

it("rejects a release onto a floating overlay above the canvas", () => {
  const canvas = document.createElement("div");
  canvas.className = "react-flow";
  document.body.append(canvas);
  const overlay = document.createElement("button");
  overlay.textContent = "Open chat";
  document.body.append(overlay);
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    right: 800,
    bottom: 600,
  } as DOMRect);
  Object.defineProperty(document, "elementsFromPoint", {
    configurable: true,
    value: () => [overlay, canvas, document.body],
  });
  expect(canDropOnCanvas({ x: 200, y: 200 })).toBe(false);
  overlay.remove();
  canvas.remove();
});
