import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  useMindMapStore as graph,
  type MindMapNode,
} from "@/store/mindmap-store";
import { useChatStore as chat } from "@/store/chat-store";
import { useHistoryStore as history } from "@/store/history-store";
import { initializeWorkspace } from "./workspace";
import { connectNodes } from "./connector";

const node = (id: string, selected = false): MindMapNode => ({
  id,
  type: "mindMapNode",
  selected,
  position: { x: 300, y: 240 },
  data: { label: id, type: "rectangle", source: "manual", color: "#123456" },
});
class TestStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
}
let stop: () => void;
beforeEach(() => {
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", new TestStorage());
  localStorage.clear();
  chat.setState({
    sessions: [],
    activeSessionId: null,
    messages: [],
    storageError: null,
  });
  graph.setState({ nodes: [], edges: [] });
  history.getState().clear();
  stop = initializeWorkspace();
  chat.getState().createNewChat();
});
afterEach(() => {
  stop?.();
  vi.restoreAllMocks();
});

it("autosaves manual edits and restores graph plus undo/redo after a reload", () => {
  graph.getState().addNode(node("a"));
  graph.getState().updateNodeLabel("a", "Revised");
  stop();
  graph.setState({ nodes: [], edges: [] });
  history.getState().clear();
  chat.setState({ sessions: [], activeSessionId: null });
  stop = initializeWorkspace();
  chat.getState().loadSessions();
  expect(graph.getState().nodes[0].data.label).toBe("Revised");
  graph.getState().performUndo();
  expect(graph.getState().nodes[0].data.label).toBe("a");
  graph.getState().performRedo();
  expect(graph.getState().nodes[0].data.label).toBe("Revised");
  expect(
    JSON.parse(localStorage.getItem("mindmap-chat-sessions")!)[0].graphNodes[0]
      .data.label,
  ).toBe("Revised");
});

it("removes attached edges in the same undoable deletion", () => {
  graph
    .getState()
    .setNodesAndEdges(
      [node("a", true), node("b")],
      [{ id: "ab", source: "a", target: "b" }],
    );
  graph.getState().deleteSelected();
  expect(graph.getState().edges).toEqual([]);
  graph.getState().performUndo();
  expect(graph.getState().nodes).toHaveLength(2);
  expect(graph.getState().edges).toHaveLength(1);
});

it("saves edge styling as one transaction and keeps map histories independent", () => {
  const first = chat.getState().activeSessionId!;
  graph
    .getState()
    .setNodesAndEdges(
      [node("a"), node("b")],
      [{ id: "ab", source: "a", target: "b" }],
    );
  graph.getState().updateEdges((edges) =>
    edges.map((e) => ({
      ...e,
      label: "Next",
      data: { strokeColor: "#123456" },
    })),
  );
  chat.getState().createNewChat();
  graph.getState().addNode(node("other"));
  chat.getState().switchChat(first);
  expect(graph.getState().edges[0].label).toBe("Next");
  graph.getState().performUndo();
  expect(graph.getState().edges[0].label).toBeUndefined();
  expect(graph.getState().nodes.map((n) => n.id)).toEqual(["a", "b"]);
});

it("keeps changes in memory and exposes a recoverable error when local storage is full", () => {
  vi.spyOn(TestStorage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Full", "QuotaExceededError");
  });
  expect(() => graph.getState().addNode(node("a"))).not.toThrow();
  expect(graph.getState().nodes).toHaveLength(1);
  expect(chat.getState().storageError).toMatch(/save/i);
});

it("preserves existing AI geometry and style when adding connected content", () => {
  const original = {
    ...node("root"),
    data: { ...node("root").data, source: "text" as const },
  };
  graph.getState().addNode(original);
  graph.getState().applyProposal({
    id: "p",
    status: "accepted",
    add_nodes: [{ id: "new", label: "New", type: "rectangle" }],
    add_edges: [{ source: "root", target: "new" }],
    update_nodes: [],
    remove_nodes: [],
    remove_edges: [],
  });
  expect(graph.getState().nodes[0]).toEqual(original);
  expect(graph.getState().edges[0].sourceHandle).toBe("right");
  expect(graph.getState().edges[0].targetHandle).toBe("left");
});

it("records a continuous drag once and ignores selection changes", () => {
  graph.getState().addNode(node("a"));
  const count = history.getState().past.length;
  graph.getState().onNodesChange([{ type: "select", id: "a", selected: true }]);
  expect(history.getState().past).toHaveLength(count);
  for (const x of [350, 400, 450])
    graph
      .getState()
      .onNodesChange([
        { type: "position", id: "a", dragging: true, position: { x, y: 240 } },
      ]);
  graph.getState().onNodesChange([
    {
      type: "position",
      id: "a",
      dragging: false,
      position: { x: 450, y: 240 },
    },
  ]);
  expect(history.getState().past).toHaveLength(count + 1);
  graph.getState().performUndo();
  expect(graph.getState().nodes[0].position.x).toBe(300);
});

it("does not overwrite unreadable saved data when loading sessions", () => {
  const corrupted = '{"incomplete":';
  localStorage.setItem("mindmap-chat-sessions", corrupted);
  chat.getState().loadSessions();
  expect(localStorage.getItem("mindmap-chat-sessions")).toBe(corrupted);
  expect(chat.getState().storageError).toMatch(/read/i);
});

it("retains usable document context after reload and keeps transient highlights out of explicit saves", () => {
  graph.getState().addNode(node("a", true));
  graph.getState().setNodeHighlights(new Map([["a", "update"]]));
  chat.getState().saveGraphToSession(graph.getState().nodes, []);
  chat.getState().addUserMessage("Read this", [
    {
      id: "doc",
      type: "document",
      name: "brief.txt",
      size: 10,
      mimeType: "text/plain",
      textContent: "Source content",
    },
  ]);
  stop();
  chat.setState({ activeSessionId: null, sessions: [], messages: [] });
  stop = initializeWorkspace();
  chat.getState().loadSessions();
  const saved = chat.getState().sessions[0].graphNodes[0];
  expect(saved.selected).toBeUndefined();
  expect(saved.data.proposalHighlight).toBeUndefined();
  expect(
    chat.getState().getConversationForAPI()[0].attachments?.[0],
  ).toMatchObject({ data: "Source content" });
});

it("rejects connector creation when either endpoint is absent", () => {
  graph.getState().addNode(node("target"));
  graph.getState().onConnect({
    source: "old-map-source",
    target: "target",
    sourceHandle: "right",
    targetHandle: "left",
  });
  expect(graph.getState().edges).toEqual([]);
});

it("rejects an old connector intent even when the new map reuses both node IDs", () => {
  const epoch = chat.getState().sessionEpoch;
  chat.getState().createNewChat();
  graph.getState().setNodesAndEdges([node("source"), node("target")], []);
  expect(connectNodes("source", "target", epoch)).toBe(false);
  expect(graph.getState().edges).toEqual([]);
});

it("removes a single parallel relationship by ID and preserves the retained edge's geometry/style", () => {
  const retained = {
    id: "observes",
    source: "a",
    target: "b",
    label: "observes",
    data: { corners: [{ x: 20, y: 50 }], strokeColor: "purple" },
  };
  graph
    .getState()
    .setNodesAndEdges(
      [node("a"), node("b")],
      [{ id: "calls", source: "a", target: "b", label: "calls" }, retained],
    );
  graph.getState().applyProposal({
    id: "p",
    status: "accepted",
    add_nodes: [],
    add_edges: [],
    update_nodes: [],
    remove_nodes: [],
    remove_edges: [{ id: "calls", source: "a", target: "b" }],
  });
  expect(graph.getState().edges).toEqual([retained]);
  graph.getState().performUndo();
  expect(graph.getState().edges).toHaveLength(2);
});

it("reconnects a stable edge as one saved undoable edit and rejects stale map gestures", () => {
  graph.getState().setNodesAndEdges(
    [node("a"), node("b"), node("c")],
    [
      {
        id: "ab",
        source: "a",
        target: "b",
        label: "depends",
        data: { strokeColor: "purple", corners: [{ x: 40, y: 90 }] },
      },
    ],
  );
  const epoch = chat.getState().sessionEpoch;
  const count = history.getState().past.length;
  expect(
    graph.getState().reconnectEdge(
      "ab",
      {
        source: "a",
        target: "c",
        sourceHandle: "right",
        targetHandle: "left",
      },
      epoch,
    ),
  ).toBe(true);
  expect(graph.getState().edges).toMatchObject([
    {
      id: "ab",
      source: "a",
      target: "c",
      label: "depends",
      data: { strokeColor: "purple" },
    },
  ]);
  expect(graph.getState().edges[0].data?.corners).toBeUndefined();
  expect(history.getState().past).toHaveLength(count + 1);
  graph.getState().performUndo();
  expect(graph.getState().edges[0].target).toBe("b");
  graph.getState().performRedo();
  expect(graph.getState().edges[0].target).toBe("c");
  expect(
    JSON.parse(localStorage.getItem("mindmap-chat-sessions")!)[0].graphEdges[0]
      .target,
  ).toBe("c");
  chat.getState().createNewChat();
  graph
    .getState()
    .setNodesAndEdges(
      [node("a"), node("b"), node("c")],
      [{ id: "ab", source: "a", target: "b" }],
    );
  expect(
    graph.getState().reconnectEdge(
      "ab",
      {
        source: "a",
        target: "c",
        sourceHandle: "right",
        targetHandle: "left",
      },
      epoch,
    ),
  ).toBe(false);
  expect(graph.getState().edges[0].target).toBe("b");
});

it("translates internal bends once during a group move and preserves external constraints through undo", () => {
  const bend = [{ x: 620, y: 280 }];
  graph.getState().setNodesAndEdges(
    [node("a"), node("b"), node("c")],
    [
      { id: "ab", source: "a", target: "b", data: { corners: bend } },
      { id: "bc", source: "b", target: "c", data: { corners: bend } },
    ],
  );
  const count = history.getState().past.length;
  graph.getState().onNodesChange(
    ["a", "b"].map((id) => ({
      type: "position" as const,
      id,
      dragging: true,
      position: { x: 400, y: 290 },
    })),
  );
  graph.getState().onNodesChange(
    ["a", "b"].map((id) => ({
      type: "position" as const,
      id,
      dragging: false,
      position: { x: 400, y: 290 },
    })),
  );
  expect(graph.getState().edges[0].data?.corners).toEqual([{ x: 720, y: 330 }]);
  expect(graph.getState().edges[1].data?.corners).toEqual(bend);
  expect(history.getState().past).toHaveLength(count + 1);
  graph.getState().performUndo();
  expect(graph.getState().edges[0].data?.corners).toEqual(bend);
});

it("creates a fully free connector without adding placeholder concepts and restores it after reload", () => {
  const connection = {
    source: "",
    target: "",
    sourceHandle: null,
    targetHandle: null,
    sourcePoint: { x: 120, y: 180 },
    targetPoint: { x: 440, y: 260 },
  };
  graph.getState().onConnect(connection);
  expect(graph.getState().nodes).toEqual([]);
  expect(graph.getState().edges).toHaveLength(1);
  expect(graph.getState().edges[0]).toMatchObject({
    source: "",
    target: "",
    data: { sourcePoint: { x: 120, y: 180 }, targetPoint: { x: 440, y: 260 } },
  });
  const id = graph.getState().edges[0].id;
  stop();
  graph.setState({ nodes: [], edges: [] });
  history.getState().clear();
  chat.setState({ sessions: [], activeSessionId: null });
  stop = initializeWorkspace();
  chat.getState().loadSessions();
  expect(graph.getState().edges[0].id).toBe(id);
  graph.getState().performUndo();
  expect(graph.getState().edges).toEqual([]);
  graph.getState().performRedo();
  expect(graph.getState().edges[0].id).toBe(id);
});

it("detaches and reattaches an endpoint with stable identity and one history entry per change", () => {
  graph
    .getState()
    .setNodesAndEdges(
      [node("a"), node("b")],
      [
        {
          id: "ab",
          source: "a",
          target: "b",
          sourceHandle: "right",
          targetHandle: "left",
          label: "depends",
          data: { strokeColor: "purple", corners: [{ x: 620, y: 40 }] },
        },
      ],
    );
  const epoch = chat.getState().sessionEpoch,
    count = history.getState().past.length;
  const detach = {
    source: "a",
    target: "",
    sourceHandle: "right",
    targetHandle: null,
    targetPoint: { x: 640, y: 380 },
  };
  expect(graph.getState().reconnectEdge("ab", detach, epoch)).toBe(true);
  expect(graph.getState().edges[0]).toMatchObject({
    id: "ab",
    target: "",
    label: "depends",
    data: { targetPoint: { x: 640, y: 380 }, strokeColor: "purple" },
  });
  expect(graph.getState().edges[0].data?.corners).toBeUndefined();
  expect(history.getState().past).toHaveLength(count + 1);
  graph.getState().performUndo();
  expect(graph.getState().edges[0].target).toBe("b");
  graph.getState().performRedo();
  expect(graph.getState().edges[0].target).toBe("");
  expect(
    graph
      .getState()
      .reconnectEdge(
        "ab",
        {
          source: "a",
          target: "b",
          sourceHandle: "right",
          targetHandle: "top",
        },
        epoch,
      ),
  ).toBe(true);
  expect(graph.getState().edges[0].data?.targetPoint).toBeUndefined();
  expect(graph.getState().edges[0].label).toBe("depends");
});

it("retains free drawings through node selection, movement and unrelated node deletion", () => {
  const free = {
    id: "free",
    source: "",
    target: "",
    data: { sourcePoint: { x: 10, y: 20 }, targetPoint: { x: 300, y: 250 } },
  };
  const half = {
    id: "half",
    source: "a",
    target: "",
    data: { targetPoint: { x: 500, y: 50 } },
  };
  graph
    .getState()
    .setNodesAndEdges([node("a"), node("unrelated", true)], [free, half]);
  graph
    .getState()
    .onNodesChange([{ type: "select", id: "a", selected: false }]);
  graph
    .getState()
    .onNodesChange([
      {
        type: "position",
        id: "a",
        position: { x: 350, y: 300 },
        dragging: true,
      },
    ]);
  graph
    .getState()
    .onNodesChange([
      {
        type: "position",
        id: "a",
        position: { x: 350, y: 300 },
        dragging: false,
      },
    ]);
  graph.getState().deleteSelected();
  expect(graph.getState().edges).toEqual([free, half]);
  graph.getState().onNodesChange([{ type: "remove", id: "a" }]);
  expect(graph.getState().edges).toEqual([free]);
});

it("rejects ambiguous, non-finite and stale endpoint edits without a history entry", () => {
  graph
    .getState()
    .setNodesAndEdges([node("a")], [{ id: "ab", source: "a", target: "a" }]);
  const before = history.getState().past.length,
    epoch = chat.getState().sessionEpoch;
  for (const connection of [
    {
      source: "a",
      target: "",
      sourceHandle: null,
      targetHandle: null,
      targetPoint: { x: NaN, y: 20 },
    },
    {
      source: "a",
      target: "a",
      sourceHandle: null,
      targetHandle: null,
      targetPoint: { x: 20, y: 20 },
    },
    { source: "a", target: "missing", sourceHandle: null, targetHandle: null },
  ])
    expect(graph.getState().reconnectEdge("ab", connection, epoch)).toBe(false);
  expect(
    graph
      .getState()
      .reconnectEdge(
        "ab",
        {
          source: "a",
          target: "a",
          sourceHandle: "right",
          targetHandle: "top",
        },
        epoch - 1,
      ),
  ).toBe(false);
  expect(history.getState().past).toHaveLength(before);
});
