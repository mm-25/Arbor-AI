// @vitest-environment jsdom
import React from "react";
// jsdom supplies a separate storage instance because Node 26 exposes a conflicting global.
// @ts-expect-error jsdom is supplied by the test runtime without bundled declarations
import { JSDOM } from "jsdom";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { ReactFlowProvider, useStoreApi, Position } from "@xyflow/react";
import Canvas from "./Canvas";
import { useEditorStore } from "@/store/editor-store";
import { useMindMapStore as graph } from "@/store/mindmap-store";
import { useChatStore as chat } from "@/store/chat-store";
import { useHistoryStore as history } from "@/store/history-store";

const flowEvents = vi.hoisted(() => ({
  current: {} as Record<string, (...args: unknown[]) => unknown>,
}));
vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>();
  return {
    ...actual,
    ReactFlow: (props: React.ComponentProps<typeof actual.ReactFlow>) => {
      flowEvents.current = props as unknown as typeof flowEvents.current;
      return <actual.ReactFlow {...props} />;
    },
  };
});

beforeAll(() => {
  Object.defineProperty(globalThis, "localStorage", {
    value: new JSDOM("", { url: "http://localhost" }).window.localStorage,
    configurable: true,
  });
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  HTMLElement.prototype.scrollIntoView = () => {};
});
beforeEach(() => {
  localStorage.clear();
  history.getState().clear();
  useEditorStore.getState().setTool("select");
  chat.setState({
    sessions: [],
    activeSessionId: null,
    messages: [],
    storageError: null,
  });
  graph.setState({ nodes: [], edges: [] });
});
afterEach(cleanup);
let testFlowApi: ReturnType<typeof useStoreApi>;
function CaptureCanvas() {
  const api = useStoreApi();
  React.useEffect(() => {
    testFlowApi = api;
  }, [api]);
  return <Canvas />;
}
function openCanvas() {
  render(
    <ReactFlowProvider>
      <CaptureCanvas />
    </ReactFlowProvider>,
  );
}
const node = (id: string) => ({
  id,
  type: "mindMapNode",
  position: { x: 40, y: 40 },
  data: { label: id, type: "rectangle" as const, source: "manual" as const },
});

it("restores an undone graph edit with an uppercase Shift-Z keyboard event", () => {
  openCanvas();
  act(() => graph.getState().addNode(node("Alpha")));
  fireEvent.keyDown(window, { key: "z", metaKey: true });
  expect(graph.getState().nodes).toHaveLength(0);
  fireEvent.keyDown(window, { key: "Z", metaKey: true, shiftKey: true });
  expect(graph.getState().nodes.map((n) => n.id)).toEqual(["Alpha"]);
});
it("activates Connector by click and cancels with Escape", () => {
  openCanvas();
  fireEvent.click(screen.getByRole("button", { name: /^Connector/ }));
  expect(screen.getByRole("status").textContent).toMatch(/source/i);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByText(/Click the source node/)).toBeNull();
  expect(graph.getState().edges).toHaveLength(0);
});
it("activates C on the canvas but leaves typed C in the composer", () => {
  openCanvas();
  const composer = screen.getByPlaceholderText(
    "Describe your system or ask a question...",
  );
  composer.focus();
  fireEvent.keyDown(composer, { key: "c" });
  expect(screen.queryByText(/Click the source node/)).toBeNull();
  composer.blur();
  fireEvent.keyDown(window, { key: "c" });
  expect(screen.getByRole("status").textContent).toMatch(/source/i);
});
it("connects the clicked source and target once, then returns to selection", () => {
  openCanvas();
  act(() =>
    graph.getState().setNodesAndEdges([node("Alpha"), node("Beta")], []),
  );
  fireEvent.click(screen.getByRole("button", { name: /^Connector/ }));
  fireEvent.click(screen.getByText("Alpha"));
  expect(screen.getByRole("status").textContent).toMatch(/target/i);
  fireEvent.click(screen.getByText("Beta"));
  expect(graph.getState().edges).toMatchObject([
    { source: "Alpha", target: "Beta" },
  ]);
  expect(screen.queryByText(/Click the source node/)).toBeNull();
});

it("extends selection from the Shift modifier on the pointer gesture itself", () => {
  openCanvas();
  act(() =>
    graph.getState().setNodesAndEdges([node("Alpha"), node("Beta")], []),
  );
  fireEvent.click(screen.getByText("Alpha"));
  fireEvent(
    screen.getByText("Beta"),
    new MouseEvent("pointerdown", { bubbles: true, shiftKey: true }),
  );
  fireEvent.click(screen.getByText("Beta"), { shiftKey: true });
  expect(
    graph
      .getState()
      .nodes.filter((n) => n.selected)
      .map((n) => n.id),
  ).toEqual(["Alpha", "Beta"]);
});

it("keeps the node style control in the shared inspector instead of covering neighboring nodes", () => {
  openCanvas();
  act(() =>
    graph
      .getState()
      .setNodesAndEdges([{ ...node("Alpha"), selected: true }], []),
  );
  expect(
    screen
      .getByRole("button", { name: "Style" })
      .closest('[aria-label="Node properties"]'),
  ).not.toBeNull();
});

it("keeps overview node bodies available for selection instead of invisible port hit regions", () => {
  openCanvas();
  act(() => graph.getState().setNodesAndEdges([node("Alpha")], []));
  act(() => testFlowApi.setState({ transform: [0, 0, 0.2] }));
  expect(screen.getByTitle("Connect from top").style.visibility).toBe("hidden");
  expect(flowEvents.current.connectOnClick).toBe(false);
  expect(screen.getByTitle("Connect from top").style.width).toBe("1px");
  expect(flowEvents.current.edgesReconnectable).toBe(false);
  act(() => testFlowApi.setState({ transform: [0, 0, 1] }));
  expect(screen.getByTitle("Connect from top").style.visibility).not.toBe(
    "hidden",
  );
});

it("copies and pastes internal bends with the selected subgraph in one recoverable edit", () => {
  openCanvas();
  const nodes = [
    { ...node("Alpha"), selected: true },
    { ...node("Beta"), selected: true, position: { x: 300, y: 40 } },
  ];
  const edge = {
    id: "ab",
    source: "Alpha",
    target: "Beta",
    type: "editable",
    label: "relates",
    data: { corners: [{ x: 250, y: 140 }], strokeColor: "purple" },
  };
  act(() => graph.getState().setNodesAndEdges(nodes, [edge]));
  const count = history.getState().past.length;
  fireEvent.keyDown(window, { key: "c", metaKey: true });
  fireEvent.keyDown(window, { key: "v", metaKey: true });
  expect(graph.getState().nodes).toHaveLength(4);
  expect(graph.getState().edges).toHaveLength(2);
  expect(graph.getState().edges.find((e) => e.id !== "ab")?.data).toMatchObject(
    { corners: [{ x: 270, y: 160 }], strokeColor: "purple" },
  );
  expect(history.getState().past).toHaveLength(count + 1);
  fireEvent.keyDown(window, { key: "z", metaKey: true });
  expect(graph.getState().nodes).toHaveLength(2);
  expect(graph.getState().edges).toEqual([edge]);
});

it("creates a connector between empty-canvas points without adding concepts", () => {
  openCanvas();
  fireEvent.click(screen.getByRole("button", { name: /^Connector/ }));
  const pane = document.querySelector(".react-flow__pane")!;
  fireEvent.click(pane, { clientX: 120, clientY: 180 });
  fireEvent.mouseMove(pane, { clientX: 440, clientY: 260 });
  fireEvent.click(pane, { clientX: 440, clientY: 260 });
  expect(graph.getState().nodes).toEqual([]);
  expect(graph.getState().edges).toHaveLength(1);
  expect(graph.getState().edges[0]).toMatchObject({
    source: "",
    target: "",
    data: { sourcePoint: { x: 120, y: 180 }, targetPoint: { x: 440, y: 260 } },
  });
});
it("can finish a node-started connector in empty canvas", () => {
  openCanvas();
  act(() => graph.getState().setNodesAndEdges([node("Alpha")], []));
  fireEvent.click(screen.getByRole("button", { name: /^Connector/ }));
  fireEvent.click(screen.getByText("Alpha"));
  fireEvent.click(document.querySelector(".react-flow__pane")!, {
    clientX: 440,
    clientY: 260,
  });
  expect(graph.getState().edges).toMatchObject([
    { source: "Alpha", target: "", data: { targetPoint: { x: 440, y: 260 } } },
  ]);
});
it("copies a selected free connector with its points and bends, without placeholder nodes", () => {
  openCanvas();
  const edge = {
    id: "free",
    source: "",
    target: "",
    selected: true,
    label: "note",
    type: "editable",
    data: {
      sourcePoint: { x: 20, y: 30 },
      targetPoint: { x: 300, y: 200 },
      corners: [{ x: 100, y: 30 }],
    },
  };
  act(() => graph.getState().setNodesAndEdges([], [edge]));
  fireEvent.keyDown(window, { key: "c", metaKey: true });
  fireEvent.keyDown(window, { key: "v", metaKey: true });
  expect(graph.getState().nodes).toHaveLength(0);
  expect(graph.getState().edges).toHaveLength(2);
  expect(
    graph.getState().edges.find((e) => e.id !== "free")?.data,
  ).toMatchObject({
    sourcePoint: { x: 40, y: 50 },
    targetPoint: { x: 320, y: 220 },
    corners: [{ x: 120, y: 50 }],
  });
  fireEvent.keyDown(window, { key: "z", metaKey: true });
  expect(graph.getState().edges).toHaveLength(1);
});

it("renders movable endpoint controls for a selected line before any real node is measured", async () => {
  openCanvas();
  act(() =>
    graph.getState().setNodesAndEdges(
      [],
      [
        {
          id: "free",
          source: "",
          target: "",
          selected: true,
          type: "editable",
          data: {
            sourcePoint: { x: 20, y: 30 },
            targetPoint: { x: 300, y: 200 },
          },
        },
      ],
    ),
  );
  expect(
    await screen.findByRole("button", { name: "Move connection end" }),
  ).toBeDefined();
});

it("rejects a node-handle connection started before the current map activation", () => {
  openCanvas();
  act(() =>
    graph.getState().setNodesAndEdges([node("Alpha"), node("Beta")], []),
  );
  act(() => flowEvents.current.onConnectStart());
  act(() => {
    chat.setState({ sessionEpoch: chat.getState().sessionEpoch + 1 });
    graph.getState().setNodesAndEdges([node("Alpha"), node("Beta")], []);
  });
  act(() =>
    flowEvents.current.onConnect({
      source: "Alpha",
      target: "Beta",
      sourceHandle: "right",
      targetHandle: "left",
    }),
  );
  expect(graph.getState().edges).toEqual([]);
});

it("draws a filled destination arrow that follows the final route and connector color", async () => {
  openCanvas();
  act(() =>
    graph.getState().setNodesAndEdges(
      [],
      [
        {
          id: "direction",
          source: "",
          target: "",
          type: "editable",
          data: {
            sourcePoint: { x: 20, y: 30 },
            targetPoint: { x: 300, y: 200 },
            strokeColor: "#be123c",
          },
        },
      ],
    ),
  );
  const path = await screen.findByTestId("rf__edge-direction");
  const line = path.querySelector(".react-flow__edge-path")!;
  const markerReference = line.getAttribute("marker-end");
  expect(markerReference).toMatch(/^url\(#.+\)$/);
  const marker = document.getElementById(markerReference!.slice(5, -1))!;
  expect(marker.getAttribute("orient")).toBe("auto");
  expect(marker.querySelector("path")?.getAttribute("fill")).toBe("#be123c");
  expect(line.getAttribute("marker-start")).toBeNull();
  act(() =>
    graph.setState({
      edges: graph.getState().edges.map((e) => ({ ...e, selected: true })),
    }),
  );
  expect(marker.querySelector("path")?.getAttribute("fill")).toBe("#2563eb");
});

it("copies an attached endpoint as a free position when its node is not selected, across maps", () => {
  openCanvas();
  act(() =>
    graph.getState().setNodesAndEdges(
      [{ ...node("Alpha"), measured: { width: 200, height: 80 } }],
      [
        {
          id: "half",
          source: "Alpha",
          target: "",
          sourceHandle: "right",
          selected: true,
          label: "keep",
          data: { targetPoint: { x: 400, y: 200 }, strokeStyle: "dashed" },
        },
      ],
    ),
  );
  fireEvent.keyDown(window, { key: "c", metaKey: true });
  act(() => {
    chat.setState({ sessionEpoch: chat.getState().sessionEpoch + 1 });
    graph.getState().setNodesAndEdges([], []);
  });
  fireEvent.keyDown(window, { key: "v", metaKey: true });
  expect(graph.getState().nodes).toEqual([]);
  expect(graph.getState().edges).toMatchObject([
    {
      source: "",
      target: "",
      label: "keep",
      data: {
        sourcePoint: { x: 260, y: 100 },
        targetPoint: { x: 420, y: 220 },
        strokeStyle: "dashed",
      },
    },
  ]);
  fireEvent.keyDown(window, { key: "z", metaKey: true });
  expect(graph.getState().edges).toEqual([]);
});

it("applies a changed layout direction immediately to the existing map with one undo step", () => {
  openCanvas();
  const original = [
    { ...node("Parent"), position: { x: 600, y: 500 } },
    { ...node("Child"), position: { x: 20, y: 30 } },
  ];
  act(() => {
    graph.getState().setNodesAndEdges(original, [
      {
        id: "pc",
        source: "Parent",
        target: "Child",
        label: "contains",
        data: { strokeColor: "#123456" },
      },
    ]);
    useEditorStore.getState().setDirection("AUTO");
    history.getState().clear();
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Layout direction" }), {
    target: { value: "TB" },
  });
  const vertical = graph.getState();
  expect(vertical.nodes[1].position.y).toBeGreaterThan(
    vertical.nodes[0].position.y,
  );
  expect(vertical.nodes[1].position.x).toBe(vertical.nodes[0].position.x);
  expect(history.getState().past).toHaveLength(1);
  expect(vertical.edges[0]).toMatchObject({
    id: "pc",
    source: "Parent",
    target: "Child",
    label: "contains",
    data: { strokeColor: "#123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: /^Undo$/ }));
  expect(graph.getState().nodes.map((n) => n.position)).toEqual([
    { x: 600, y: 500 },
    { x: 20, y: 30 },
  ]);
  fireEvent.change(screen.getByRole("combobox", { name: "Layout direction" }), {
    target: { value: "LR" },
  });
  const horizontal = graph.getState();
  expect(horizontal.nodes[1].position.x).toBeGreaterThan(
    horizontal.nodes[0].position.x,
  );
  expect(horizontal.nodes[1].position.y).toBe(horizontal.nodes[0].position.y);
});

it("applies Automatic on selection and keeps free connector coordinates fixed", () => {
  openCanvas();
  const nodes = ["Root", "A", "B", "C"].map((id, i) => ({
    ...node(id),
    position: { x: 600 - i * 150, y: 400 - i * 100 },
  }));
  const edges = ["A", "B", "C"].map((target) => ({
    id: target,
    source: "Root",
    target,
  }));
  const drawing = {
    id: "drawing",
    source: "",
    target: "",
    data: { sourcePoint: { x: -40, y: 80 }, targetPoint: { x: 320, y: 180 } },
  };
  act(() => {
    graph.getState().setNodesAndEdges(nodes, [...edges, drawing]);
    useEditorStore.getState().setDirection("LR");
    history.getState().clear();
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Layout direction" }), {
    target: { value: "AUTO" },
  });
  const current = graph.getState();
  expect(
    current.nodes
      .slice(1)
      .every((n) => n.position.y > current.nodes[0].position.y),
  ).toBe(true);
  expect(current.nodes[0].position).not.toEqual({ x: 600, y: 400 });
  expect(current.edges.find((e) => e.id === "drawing")).toEqual(drawing);
  expect(history.getState().past).toHaveLength(1);
});

function openConnectionFocusMap() {
  openCanvas();
  const ids = ["Incoming", "Parent", "Child", "Grandchild", "Island"];
  const nodes = ids.map((id, i) => ({
    ...node(id),
    position: { x: i * 300, y: 40 },
    measured: { width: 208, height: 72 },
    handles: [
      {
        id: "right",
        type: "source" as const,
        position: Position.Right,
        x: 208,
        y: 36,
        width: 1,
        height: 1,
      },
      {
        id: "left",
        type: "source" as const,
        position: Position.Left,
        x: 0,
        y: 36,
        width: 1,
        height: 1,
      },
    ],
    data: { ...node(id).data, ...(id === "Child" ? { color: "#ec4899" } : {}) },
  }));
  const edge = (
    id: string,
    source: string,
    target: string,
    color = "#64748b",
  ) => ({
    id,
    source,
    target,
    type: "editable",
    sourceHandle: "right",
    targetHandle: "left",
    data: { strokeColor: color },
  });
  act(() => {
    graph.getState().setNodesAndEdges(nodes, [
      edge("incoming", "Incoming", "Parent"),
      edge("outgoing", "Parent", "Child", "#be123c"),
      edge("indirect", "Child", "Grandchild"),
      {
        ...edge("half", "Parent", ""),
        targetHandle: null,
        data: { targetPoint: { x: 600, y: 300 } },
      },
      {
        ...edge("free", "", ""),
        sourceHandle: null,
        targetHandle: null,
        data: {
          sourcePoint: { x: 30, y: 500 },
          targetPoint: { x: 500, y: 500 },
        },
      },
    ]);
    history.getState().clear();
  });
}
const edgePath = (id: string) =>
  screen
    .getByTestId(`rf__edge-${id}`)
    .querySelector<SVGPathElement>(".react-flow__edge-path")!;
const nodeBorder = (label: string) =>
  (
    screen
      .getByText(label)
      .closest(".react-flow__node")!
      .querySelector(".border-2") as HTMLElement
  ).style.borderColor;

it("highlights a clicked node's incoming/outgoing arrows and direct neighbors without selecting or editing them", async () => {
  openConnectionFocusMap();
  await screen.findByTestId("rf__edge-outgoing");
  fireEvent.click(screen.getByText("Parent"));
  for (const id of ["incoming", "outgoing", "half"]) {
    const path = edgePath(id);
    expect(path.style.stroke).toBe("rgb(37, 99, 235)");
    const marker = document.getElementById(
      path.getAttribute("marker-end")!.slice(5, -1),
    )!;
    expect(marker.querySelector("path")!.getAttribute("fill")).toBe("#2563eb");
  }
  expect(edgePath("indirect").style.stroke).toBe("rgb(100, 116, 139)");
  expect(edgePath("free").style.stroke).toBe("rgb(100, 116, 139)");
  expect(nodeBorder("Child")).toBe("rgb(147, 197, 253)");
  expect(nodeBorder("Incoming")).toBe("rgb(147, 197, 253)");
  expect(nodeBorder("Grandchild")).toBe("rgb(107, 114, 128)");
  expect(
    graph
      .getState()
      .nodes.filter((n) => n.selected)
      .map((n) => n.id),
  ).toEqual(["Parent"]);
  expect(graph.getState().edges.some((e) => e.selected)).toBe(false);
  expect(
    screen.queryByRole("button", { name: "Move connection end" }),
  ).toBeNull();
  expect(
    graph.getState().edges.find((e) => e.id === "outgoing")!.data?.strokeColor,
  ).toBe("#be123c");
  expect(history.getState().past).toHaveLength(0);
});

it("updates highlights with node selection, combines Shift selection, and restores saved colors when cleared", async () => {
  openConnectionFocusMap();
  await screen.findByTestId("rf__edge-outgoing");
  fireEvent.click(screen.getByText("Child"));
  expect(edgePath("outgoing").style.stroke).toBe("rgb(37, 99, 235)");
  expect(edgePath("indirect").style.stroke).toBe("rgb(37, 99, 235)");
  expect(edgePath("incoming").style.stroke).toBe("rgb(100, 116, 139)");
  fireEvent(
    screen.getByText("Parent"),
    new MouseEvent("pointerdown", { bubbles: true, shiftKey: true }),
  );
  fireEvent.click(screen.getByText("Parent"), { shiftKey: true });
  expect(edgePath("incoming").style.stroke).toBe("rgb(37, 99, 235)");
  expect(edgePath("indirect").style.stroke).toBe("rgb(37, 99, 235)");
  const pane = document.querySelector(".react-flow__pane")!;
  // In marquee mode React Flow clears selection on a primary pointer release.
  const down = new MouseEvent("pointerdown", { bubbles: true, button: 0 });
  Object.defineProperty(down, "isPrimary", { value: true });
  fireEvent(pane, down);
  fireEvent(pane, new MouseEvent("pointerup", { bubbles: true, button: 0 }));
  fireEvent.click(pane);
  expect(edgePath("outgoing").style.stroke).toBe("rgb(190, 18, 60)");
  expect(nodeBorder("Child")).toBe("rgb(236, 72, 153)");
  expect(history.getState().past).toHaveLength(0);
});
