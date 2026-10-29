import { expect, it } from "vitest";
import { routeConnection, translateEdgeGeometry } from "./edge-routing";
import { segmentHitsBox } from "./canvas-geometry";
it("routes an HQ-to-IT connection around the intervening Departments box", () => {
  const obstacle = { x: 130, y: 70, width: 120, height: 100 };
  const result = routeConnection(
    { x: 100, y: 40 },
    { x: 300, y: 180 },
    "right",
    "left",
    [obstacle],
  );
  expect(result.blocked).toBe(false);
  expect(result.points[0]).toEqual({ x: 100, y: 40 });
  expect(result.points.at(-1)).toEqual({ x: 300, y: 180 });
  for (let i = 1; i < result.points.length; i++)
    expect(
      segmentHitsBox(result.points[i - 1], result.points[i], obstacle),
    ).toBe(false);
});
it("preserves the requested departure and arrival side when obstacles require a detour", () => {
  const result = routeConnection(
    { x: 100, y: 100 },
    { x: 400, y: 200 },
    "right",
    "top",
    [
      { x: 130, y: 80, width: 100, height: 190 },
      { x: 260, y: 0, width: 100, height: 130 },
    ],
  );
  expect(result.blocked).toBe(false);
  expect(result.points[1].x).toBeGreaterThan(100);
  expect(result.points[1].y).toBe(100);
  expect(result.points.at(-2)!.y).toBeLessThan(200);
  expect(result.points.at(-2)!.x).toBe(400);
});
it("translates copied manual bends without mutating the original edge", () => {
  const edge = {
    id: "ab",
    source: "a",
    target: "b",
    label: "relates",
    data: { corners: [{ x: 100, y: 50 }], strokeColor: "purple" },
  };
  const moved = translateEdgeGeometry(edge, 40, -20);
  expect(moved.data?.corners).toEqual([{ x: 140, y: 30 }]);
  expect(edge.data.corners).toEqual([{ x: 100, y: 50 }]);
  expect(moved.data?.strokeColor).toBe("purple");
});

import { intranetFixture } from "./fixtures/intranet";
import { getLayoutedElements } from "./auto-layout";
import { nodeBox } from "./canvas-geometry";
it("routes every relationship in the compact IA without crossing unrelated node interiors", () => {
  const fixture = intranetFixture(),
    layout = getLayoutedElements(fixture.nodes, fixture.edges, "TB");
  const boxes = new Map(layout.nodes.map((n) => [n.id, nodeBox(n)]));
  const point = (id: string, side: string) => {
    const b = boxes.get(id)!;
    return {
      x:
        side === "left"
          ? b.x
          : side === "right"
            ? b.x + b.width
            : b.x + b.width / 2,
      y:
        side === "top"
          ? b.y
          : side === "bottom"
            ? b.y + b.height
            : b.y + b.height / 2,
    };
  };
  for (const edge of layout.edges) {
    const source = edge.sourceHandle!,
      target = edge.targetHandle!;
    const route = routeConnection(
      point(edge.source, source),
      point(edge.target, target),
      source as "left",
      target as "left",
      layout.nodes.map((n) => nodeBox(n, 10)),
    );
    expect(route.blocked, edge.id).toBe(false);
    for (const [id, box] of boxes) {
      if (id === edge.source || id === edge.target) continue;
      for (let i = 1; i < route.points.length; i++)
        expect(
          segmentHitsBox(route.points[i - 1], route.points[i], box),
          `${edge.id} through ${id}`,
        ).toBe(false);
    }
  }
});

it("shortens endpoint stubs when a neighboring node is close to the attachment", () => {
  const boxes = [
    { x: 178, y: 174, width: 228, height: 92 },
    { x: 50, y: 318, width: 228, height: 92 },
    { x: 70, y: 462, width: 228, height: 92 },
    { x: 70, y: 566, width: 228, height: 92 },
    { x: 70, y: 670, width: 228, height: 92 },
  ];
  const result = routeConnection(
    { x: 292, y: 256 },
    { x: 184, y: 680 },
    "bottom",
    "top",
    boxes,
  );
  expect(result.blocked).toBe(false);
  for (const box of boxes.slice(1, -1))
    for (let i = 1; i < result.points.length; i++)
      expect(segmentHitsBox(result.points[i - 1], result.points[i], box)).toBe(
        false,
      );
});

it("aligns the visible reconnect control with the library hit target outside the node", async () => {
  const { reconnectControlPosition } = await import("./edge-routing");
  expect(reconnectControlPosition({ x: 100, y: 200 }, "top", 0.5)).toEqual({
    x: 100,
    y: 168,
  });
  expect(reconnectControlPosition({ x: 100, y: 200 }, "right", 2)).toEqual({
    x: 108,
    y: 200,
  });
});
