import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useChatStore as chat } from "@/store/chat-store";
import { useMindMapStore as graph } from "@/store/mindmap-store";
import { useProposalStore as proposals } from "@/store/proposal-store";
import { sendChatTurn, generateMap, acceptProposal } from "./ai-actions";

beforeEach(() => {
  chat.setState({
    sessions: [],
    activeSessionId: null,
    messages: [],
    isLoading: false,
    isGenerating: false,
    error: null,
  });
  chat.getState().createNewChat();
  graph.setState({ nodes: [], edges: [] });
  proposals.getState().clearPending();
});
afterEach(() => vi.unstubAllGlobals());
const patch = () => ({
  add_nodes: [{ id: "next", label: "Next idea", type: "rectangle" }],
  add_edges: [],
  update_nodes: [],
  remove_nodes: [],
  remove_edges: [],
  has_changes: false,
});

it("sends a user message exactly once and includes actual readable source text", async () => {
  let payload:
    | { messages: { content: string; attachments?: { data: string }[] }[] }
    | undefined;
  vi.stubGlobal("fetch", async (_url: unknown, options: RequestInit) => {
    payload = JSON.parse(options.body as string);
    return Response.json({ message: "Let's explore" });
  });
  await sendChatTurn("Explore this", [
    {
      id: "doc",
      name: "brief.txt",
      type: "document",
      mimeType: "text/plain",
      size: 20,
      textContent: "Actual brief content",
    },
  ]);
  expect(payload?.messages).toHaveLength(1);
  expect(payload?.messages[0].attachments?.[0].data).toBe(
    "Actual brief content",
  );
  expect(chat.getState().messages.map((m) => m.content)).toEqual([
    "Explore this",
    "Let's explore",
  ]);
});

it("ignores a reply after switching away and back to its original map", async () => {
  let finish!: (response: Response) => void;
  vi.stubGlobal(
    "fetch",
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  const first = chat.getState().activeSessionId!;
  const sending = sendChatTurn("Think with me");
  chat.getState().createNewChat();
  chat.getState().switchChat(first);
  finish(Response.json({ message: "Late reply" }));
  await sending;
  expect(chat.getState().messages.map((m) => m.content)).toEqual([
    "Think with me",
  ]);
});

it("refuses a generation that became stale because of a manual edit", async () => {
  let finish!: (response: Response) => void;
  vi.stubGlobal(
    "fetch",
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  const generating = generateMap("Map the idea");
  graph.getState().addNode({
    id: "manual",
    type: "mindMapNode",
    position: { x: 70, y: 90 },
    data: { label: "Mine", source: "manual", type: "circle" },
  });
  finish(Response.json(patch()));
  await generating;
  expect(graph.getState().nodes.map((n) => n.id)).toEqual(["manual"]);
  expect(chat.getState().error).toMatch(/changed/i);
});

it("adds generated content without moving or restyling an existing AI node", async () => {
  const original = {
    id: "root",
    type: "mindMapNode",
    position: { x: 650, y: 320 },
    data: {
      label: "Root",
      source: "text" as const,
      type: "circle" as const,
      color: "#fab123",
    },
  };
  graph.getState().addNode(original);
  vi.stubGlobal("fetch", async () =>
    Response.json({
      ...patch(),
      add_edges: [{ source: "root", target: "next" }],
    }),
  );
  await generateMap("Expand root");
  expect(graph.getState().nodes[0]).toEqual(original);
  expect(graph.getState().nodes).toHaveLength(2);
});

it("does not accept a proposal after intervening edits", async () => {
  graph.getState().addNode({
    id: "root",
    position: { x: 0, y: 0 },
    data: { label: "Root", source: "manual", type: "rectangle" },
  });
  vi.stubGlobal("fetch", async () =>
    Response.json({
      ...patch(),
      has_changes: true,
      update_nodes: [{ id: "root", label: "Changed" }],
    }),
  );
  await generateMap("Rename root");
  graph.getState().updateNodeLabel("root", "My revision");
  expect(acceptProposal()).toBe(false);
  expect(graph.getState().nodes[0].data.label).toBe("My revision");
});

it("submits pending readable attachments exactly once when Generate is used directly", async () => {
  let payload:
    | { conversation: { attachments?: { data: string }[] }[] }
    | undefined;
  vi.stubGlobal("fetch", async (_url: unknown, options: RequestInit) => {
    payload = JSON.parse(options.body as string);
    return Response.json(patch());
  });
  await generateMap("Map this document", undefined, [
    {
      id: "pending",
      type: "document",
      name: "brief.txt",
      mimeType: "text/plain",
      size: 10,
      textContent: "Unsent source content",
    },
  ]);
  expect(payload?.conversation).toHaveLength(1);
  expect(payload?.conversation[0].attachments?.[0].data).toBe(
    "Unsent source content",
  );
  expect(
    chat.getState().messages.filter((m) => m.role === "user"),
  ).toHaveLength(1);
});

it("executes an explicit tidy request from Generate without a model or semantic changes", async () => {
  graph.getState().setNodesAndEdges(
    [
      {
        id: "a",
        position: { x: 700, y: 300 },
        data: { label: "A", type: "rectangle", source: "manual" },
      },
      {
        id: "b",
        position: { x: 700, y: 300 },
        data: { label: "B", type: "rectangle", source: "manual" },
      },
    ],
    [{ id: "ab", source: "a", target: "b", label: "" }],
  );
  const network = vi.fn();
  vi.stubGlobal("fetch", network);
  await generateMap("Can you tidy up the graph top to bottom");
  expect(network).not.toHaveBeenCalled();
  expect(graph.getState().nodes[0].position).not.toEqual(
    graph.getState().nodes[1].position,
  );
  expect(graph.getState().edges).toMatchObject([
    { id: "ab", source: "a", target: "b", label: "" },
  ]);
  expect(chat.getState().messages.at(-1)?.content).toMatch(/arranged/i);
});
it("reviews a connection-label update and preserves the edge's identity and style when accepted", async () => {
  graph.getState().setNodesAndEdges(
    [
      {
        id: "a",
        position: { x: 0, y: 0 },
        data: { label: "A", type: "rectangle", source: "manual" },
      },
      {
        id: "b",
        position: { x: 500, y: 0 },
        data: { label: "B", type: "rectangle", source: "manual" },
      },
    ],
    [
      {
        id: "ab",
        source: "a",
        target: "b",
        label: "contains",
        data: { strokeColor: "purple", corners: [{ x: 250, y: 40 }] },
      },
    ],
  );
  vi.stubGlobal("fetch", async () =>
    Response.json({
      ...patch(),
      add_nodes: [],
      update_edges: [{ id: "ab", label: "" }],
    }),
  );
  await generateMap("Remove the redundant connector label");
  expect(graph.getState().edges[0].label).toBe("contains");
  expect(acceptProposal()).toBe(true);
  expect(graph.getState().edges[0]).toMatchObject({
    id: "ab",
    source: "a",
    target: "b",
    label: "",
    data: { strokeColor: "purple", corners: [{ x: 250, y: 40 }] },
  });
});

it("arranges the full captured selection even when the composer supplies its first focused node", async () => {
  const item = (id: string, selected: boolean, x = 700, y = 300) => ({
    id,
    selected,
    position: { x, y },
    data: { label: id, type: "rectangle" as const, source: "manual" as const },
  });
  const outside = item("outside", false, 20, 20);
  graph
    .getState()
    .setNodesAndEdges(
      [item("a", true), item("b", true), outside],
      [{ id: "ab", source: "a", target: "b" }],
    );
  const network = vi.fn();
  vi.stubGlobal("fetch", network);
  await generateMap("Arrange the selected nodes top to bottom", "a");
  const nodes = graph.getState().nodes;
  expect(nodes.find((n) => n.id === "b")!.position.y).toBeGreaterThan(
    nodes.find((n) => n.id === "a")!.position.y,
  );
  expect(nodes.find((n) => n.id === "outside")).toEqual(outside);
  expect(network).not.toHaveBeenCalled();
});

it("explains that Tidy leaves a free-only drawing in place instead of claiming to arrange concepts", async () => {
  graph
    .getState()
    .setNodesAndEdges(
      [],
      [
        {
          id: "line",
          source: "",
          target: "",
          data: {
            sourcePoint: { x: 0, y: 0 },
            targetPoint: { x: 500, y: 250 },
          },
        },
      ],
    );
  const network = vi.fn();
  vi.stubGlobal("fetch", network);
  await generateMap("Tidy the graph");
  expect(graph.getState().nodes).toEqual([]);
  expect(graph.getState().edges[0].data?.targetPoint).toEqual({
    x: 500,
    y: 250,
  });
  expect(chat.getState().messages.at(-1)?.content).toMatch(
    /free connectors.*positions|drag.*endpoints/i,
  );
  expect(network).not.toHaveBeenCalled();
});
