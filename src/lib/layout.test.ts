import { expect, it } from "vitest";
import { placeNewNodesIncrementally } from "./incremental-layout";
import { getLayoutedElements } from "./auto-layout";
import type { MindMapNode } from "@/store/mindmap-store";

const node = (id: string): MindMapNode => ({
  id,
  position: { x: 500, y: 200 },
  data: { label: id, type: "rectangle", source: "text" },
});

it("places new upstream steps before their existing destination", () => {
  const existing = node("destination");
  const [upstream] = placeNewNodesIncrementally(
    [existing],
    [{ id: "prior", label: "Before", type: "rectangle" }],
    [{ source: "prior", target: "destination" }],
  );
  expect(upstream.position.x).toBeLessThan(existing.position.x);
  expect(existing.position).toEqual({ x: 500, y: 200 });
});

it("uses measured dimensions to keep additions outside long existing labels", () => {
  const existing = { ...node("root"), measured: { width: 320, height: 200 } };
  const [addition] = placeNewNodesIncrementally(
    [existing],
    [{ id: "new", label: "New", type: "rectangle" }],
    [{ source: "root", target: "new" }],
  );
  expect(addition.position.x).toBeGreaterThanOrEqual(820);
});

it("clears obsolete routing after an explicit layout while retaining user edge styling", () => {
  const result = getLayoutedElements(
    [node("a"), node("b")],
    [
      {
        id: "ab",
        source: "a",
        target: "b",
        data: {
          autoDashed: true,
          parallelOffset: 36,
          parallelAxis: "y",
          corners: [{ x: 200, y: 300 }],
          strokeColor: "#123456",
          strokeStyle: "solid",
        },
      },
    ],
  );
  expect(result.edges[0].data?.autoDashed).toBe(false);
  expect(result.edges[0].data?.parallelOffset ?? 0).toBe(0);
  expect(result.edges[0].data?.corners).toBeUndefined();
  expect(result.edges[0].data?.strokeColor).toBe("#123456");
  expect(result.edges[0].data?.strokeStyle).toBe("solid");
});

import { intranetFixture } from "./fixtures/intranet";
import { graphBounds, nodeBox, intersects } from "./canvas-geometry";
it("packs the audited IA into a compact hierarchy without losing content or changing styles", () => {
  const original = intranetFixture();
  const compact = getLayoutedElements(original.nodes, original.edges, "TB");
  const bounds = graphBounds(compact.nodes);
  expect(bounds.width).toBeLessThan(3600);
  expect(bounds.height).toBeLessThan(1600);
  for (let i = 0; i < compact.nodes.length; i++)
    for (let j = i + 1; j < compact.nodes.length; j++)
      expect(
        intersects(nodeBox(compact.nodes[i]), nodeBox(compact.nodes[j]), 16),
        `${compact.nodes[i].id}/${compact.nodes[j].id}`,
      ).toBe(false);
  expect(compact.nodes.map((n) => n.data)).toEqual(
    original.nodes.map((n) => n.data),
  );
  expect(
    compact.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
    })),
  ).toEqual(
    original.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
    })),
  );
});
it("keeps supporting question references from determining the site hierarchy", () => {
  const fixture = intranetFixture();
  const withReferences = getLayoutedElements(
    fixture.nodes,
    fixture.edges,
    "TB",
  );
  const without = getLayoutedElements(
    fixture.nodes,
    fixture.edges.filter((e) => e.source !== "publishing"),
    "TB",
  );
  expect(
    withReferences.nodes
      .filter((n) => n.id !== "publishing")
      .map((n) => n.position),
  ).toEqual(
    without.nodes.filter((n) => n.id !== "publishing").map((n) => n.position),
  );
});

it("finds free space after a crowded local addition search without moving existing nodes", () => {
  const existing = { ...node("root"), position: { x: 0, y: 0 } };
  const blocker = {
    ...node("blocker"),
    position: { x: 250, y: -10000 },
    measured: { width: 400, height: 20000 },
  };
  const before = structuredClone([existing, blocker]);
  const [addition] = placeNewNodesIncrementally(
    [existing, blocker],
    [{ id: "new", label: "New", type: "rectangle" }],
    [{ source: "root", target: "new" }],
  );
  expect(
    intersects(
      nodeBox({
        ...addition,
        data: { label: addition.label, type: addition.type },
      }),
      nodeBox(blocker),
      16,
    ),
  ).toBe(false);
  expect([existing, blocker]).toEqual(before);
});

it("keeps explicit process decisions and transition branches in the primary flow", () => {
  const nodes = ["submit", "decision", "publish", "revise"].map((id) => ({
    ...node(id),
    data: {
      ...node(id).data,
      label: id === "decision" ? "Approved?" : id,
      role: "concept" as const,
    },
  }));
  const edges = [
    ["submit", "decision"],
    ["decision", "publish"],
    ["decision", "revise"],
  ].map(([source, target]) => ({
    id: `${source}-${target}`,
    source,
    target,
    data: { relation: "transition" },
  }));
  const result = getLayoutedElements(nodes, edges, "LR");
  const decision = result.nodes.find((n) => n.id === "decision")!;
  for (const id of ["publish", "revise"])
    expect(result.nodes.find((n) => n.id === id)!.position.x).toBeGreaterThan(
      decision.position.x,
    );
});
