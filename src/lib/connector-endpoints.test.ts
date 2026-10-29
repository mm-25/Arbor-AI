import { expect, it } from "vitest";
import {
  connectorView,
  documentBounds,
  snapEndpoint,
  resolveEndpoint,
  edgeConnection,
} from "./connector-endpoints";
import { parseGraph, graphContext } from "./ai-contract";
import { getLayoutedElements } from "./auto-layout";
const node = {
  id: "a",
  type: "mindMapNode",
  position: { x: 100, y: 100 },
  data: { label: "A", type: "rectangle" as const, source: "manual" as const },
};
const free = {
  id: "line",
  source: "",
  target: "",
  type: "editable",
  data: { sourcePoint: { x: -200, y: 80 }, targetPoint: { x: 600, y: 400 } },
};
it("renders free endpoints through derived anchors without changing the document", () => {
  const view = connectorView([], [free]);
  expect(view.nodes).toHaveLength(2);
  expect(view.edges).toHaveLength(1);
  expect(view.edges[0].source).not.toBe("");
  expect(
    view.nodes.every((n) => n.selectable === false && n.draggable === false),
  ).toBe(true);
  expect(view.nodes.map((n) => n.position)).toEqual([
    { x: -200, y: 80 },
    { x: 600, y: 400 },
  ]);
  expect(free.source).toBe("");
  expect(documentBounds([], [free])).toEqual({
    x: -200,
    y: 80,
    width: 800,
    height: 320,
  });
});
it("snaps an endpoint to a real node side and allows Alt to keep it free", () => {
  expect(snapEndpoint({ x: 315, y: 136 }, [node], 1)).toEqual({
    kind: "node",
    nodeId: "a",
    handle: "right",
  });
  expect(snapEndpoint({ x: 315, y: 136 }, [node], 1, true)).toEqual({
    kind: "point",
    point: { x: 315, y: 136 },
  });
  expect(snapEndpoint({ x: 500, y: 400 }, [node], 1)).toEqual({
    kind: "point",
    point: { x: 500, y: 400 },
  });
  expect(
    resolveEndpoint({ kind: "node", nodeId: "a", handle: "right" }, [node]),
  ).toEqual({ x: 308, y: 136 });
  expect(edgeConnection(free).targetPoint).toEqual({ x: 600, y: 400 });
});
it("accepts free drawing context beside AI concepts while rejecting missing attachments", () => {
  const graph = parseGraph([node], [free]);
  expect(graphContext(graph)).toContain("sourcePoint");
  expect(() => parseGraph([node], [{ ...free, source: "missing" }])).toThrow();
});
it("keeps free endpoint geometry and chosen route constraints through Tidy", () => {
  const edge = {
    ...free,
    data: { ...free.data, corners: [{ x: 20, y: 80 }], strokeColor: "purple" },
  };
  expect(getLayoutedElements([node], [edge], "TB").edges[0]).toEqual(edge);
});

it("includes the attached node when fitting or anchoring a selected half-free connector", () => {
  const half = {
    id: "half",
    source: "a",
    target: "",
    sourceHandle: "right",
    data: { targetPoint: { x: 500, y: 400 } },
  };
  expect(documentBounds([], [half], [node])).toEqual({
    x: 100,
    y: 100,
    width: 400,
    height: 300,
  });
});
