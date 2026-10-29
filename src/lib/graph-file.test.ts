import { expect, it } from "vitest";
import { serializeGraph, parseGraphFile } from "./graph-file";
it("round-trips a graph backup with exact IDs, geometry, styles and manual bends", () => {
  const graph = {
    nodes: [
      {
        id: "a",
        position: { x: -14.5, y: 32 },
        data: {
          label: "Idea",
          type: "circle" as const,
          source: "manual" as const,
          color: "#fab123",
        },
      },
    ],
    edges: [
      {
        id: "loop",
        source: "a",
        target: "a",
        sourceHandle: "right",
        targetHandle: "top",
        label: "revisit",
        data: { corners: [{ x: 100, y: -20 }], strokeStyle: "dashed" },
      },
    ],
  };
  expect(parseGraphFile(serializeGraph(graph))).toEqual(graph);
});
it("rejects a corrupt or dangling backup instead of importing a partial map", () => {
  expect(() =>
    parseGraphFile(
      '{"app":"Arbor AI","version":1,"graph":{"nodes":[],"edges":[{"id":"bad","source":"missing","target":"missing"}]}}',
    ),
  ).toThrow(/invalid/i);
});

it("rejects malformed rendering and route data before replacing a map", () => {
  const nodes = [
    {
      id: "a",
      position: { x: 0, y: 0 },
      data: { label: "A", type: "rectangle", source: "manual" },
    },
  ];
  const edge = { id: "ab", source: "a", target: "a", type: "editable" };
  const encode = (nodes: unknown, edges: unknown) =>
    JSON.stringify({ app: "Arbor AI", version: 1, graph: { nodes, edges } });
  for (const malformed of [
    { ...edge, data: { corners: [null] } },
    { ...edge, data: { corners: [{ x: "10", y: 20 }] } },
    { ...edge, data: { corners: { x: 10, y: 20 } } },
    { ...edge, source: ["a"] },
    { ...edge, label: { text: "bad" } },
    { ...edge, data: { strokeStyle: { bad: true } } },
    { ...edge, style: "bad" },
  ])
    expect(() => parseGraphFile(encode(nodes, [malformed]))).toThrow(
      /invalid/i,
    );
  expect(() =>
    parseGraphFile(
      encode([{ ...nodes[0], style: { width: { toString: null } } }], []),
    ),
  ).toThrow(/invalid/i);
  expect(() =>
    parseGraphFile(
      encode(
        [{ ...nodes[0], data: { ...nodes[0].data, icon: { bad: true } } }],
        [],
      ),
    ),
  ).toThrow(/invalid/i);
});

it("round-trips a zero-node map with free endpoints and rejects ambiguous attachments", () => {
  const free = {
    id: "line",
    source: "",
    target: "",
    label: "note",
    data: {
      sourcePoint: { x: -40, y: 80 },
      targetPoint: { x: 320, y: 180 },
      strokeStyle: "dashed",
    },
  };
  const original = { nodes: [], edges: [free] };
  expect(parseGraphFile(serializeGraph(original))).toEqual(original);
  const bad = {
    nodes: [
      {
        id: "a",
        position: { x: 0, y: 0 },
        data: {
          label: "A",
          type: "rectangle" as const,
          source: "manual" as const,
        },
      },
    ],
    edges: [{ ...free, source: "a" }],
  };
  expect(() => parseGraphFile(serializeGraph(bad))).toThrow(/invalid/i);
});
