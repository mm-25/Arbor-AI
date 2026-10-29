import { expect, it } from "vitest";
import {
  runQualityValidation,
  type GenerateResult,
} from "./generate-validation";

const empty = (): GenerateResult => ({
  add_nodes: [],
  add_edges: [],
  update_nodes: [],
  remove_nodes: [],
  remove_edges: [],
});
const context = {
  existingNodeIds: new Set<string>(),
  existingEdges: [],
  isExpanding: false,
};

it("retains disconnected brainstorming, conventional labels and distinct concepts with identical labels", () => {
  const input = {
    ...empty(),
    add_nodes: [
      { id: "Start", label: "Start", type: "circle" },
      { id: "team-a", label: "Review", type: "diamond" },
      { id: "team-b", label: "Review", type: "rectangle" },
    ],
  };
  expect(runQualityValidation(input, context).result).toEqual(input);
});

it("does not invent decision labels or truncate valid fanout", () => {
  const input = {
    ...empty(),
    add_nodes: [
      { id: "choice", label: "Options", type: "diamond" },
      ...Array.from({ length: 30 }, (_, i) => ({
        id: `n${i}`,
        label: `Idea ${i}`,
        type: "rectangle",
      })),
    ],
    add_edges: Array.from({ length: 30 }, (_, i) => ({
      source: "choice",
      target: `n${i}`,
    })),
  };
  expect(runQualityValidation(input, context).result).toEqual(input);
});

it("rejects dangling endpoints, colliding IDs and unknown updates without changing stable IDs", () => {
  const input = {
    ...empty(),
    add_nodes: [
      { id: "Existing-ID", label: "Collision", type: "rectangle" },
      { id: "New-ID", label: "New", type: "rectangle" },
    ],
    add_edges: [
      { source: "Existing-ID", target: "New-ID" },
      { source: "missing", target: "New-ID" },
    ],
    update_nodes: [{ id: "missing", label: "oops" }],
  };
  const { result, warnings } = runQualityValidation(input, {
    ...context,
    existingNodeIds: new Set(["Existing-ID"]),
  });
  expect(result.add_nodes.map((n) => n.id)).toEqual(["New-ID"]);
  expect(result.add_edges).toEqual([
    { source: "Existing-ID", target: "New-ID" },
  ]);
  expect(result.update_nodes).toEqual([]);
  expect(warnings.length).toBeGreaterThan(0);
});

it("rejects exact duplicate relationships while allowing differently labeled parallel connections", () => {
  const input = {
    ...empty(),
    add_edges: [
      { source: "a", target: "b", label: "same" },
      { source: "a", target: "b", label: "different" },
    ],
  };
  const { result, warnings } = runQualityValidation(input, {
    ...context,
    existingNodeIds: new Set(["a", "b"]),
    existingEdges: [{ source: "a", target: "b", label: "same" }],
  });
  expect(result.add_edges).toEqual([
    { source: "a", target: "b", label: "different" },
  ]);
  expect(warnings).toHaveLength(1);
});

it("reports removal references that are no longer on the canvas", () => {
  const { warnings } = runQualityValidation(
    {
      ...empty(),
      remove_nodes: ["missing"],
      remove_edges: [{ source: "a", target: "b" }],
    },
    context,
  );
  expect(warnings).toHaveLength(2);
});

it("rejects ambiguous parallel-edge removals and accepts stable edge IDs", () => {
  const existingEdges = [
    { id: "calls", source: "a", target: "b", label: "calls" },
    { id: "observes", source: "a", target: "b", label: "observes" },
  ];
  const ctx = {
    ...context,
    existingEdges,
    existingNodeIds: new Set(["a", "b"]),
  };
  expect(
    runQualityValidation(
      { ...empty(), remove_edges: [{ source: "a", target: "b" }] },
      ctx,
    ).warnings,
  ).toHaveLength(1);
  const { result, warnings } = runQualityValidation(
    { ...empty(), remove_edges: [{ id: "calls", source: "a", target: "b" }] },
    ctx,
  );
  expect(warnings).toEqual([]);
  expect(result.remove_edges).toEqual([
    { id: "calls", source: "a", target: "b" },
  ]);
});

it("validates new connections against updated labels and rejects conflicting edge operations", () => {
  const ctx = {
    ...context,
    existingNodeIds: new Set(["a", "b"]),
    existingEdges: [{ id: "ab", source: "a", target: "b", label: "old" }],
  };
  const updated = runQualityValidation(
    {
      ...empty(),
      update_edges: [{ id: "ab", label: "new" }],
      add_edges: [{ source: "a", target: "b", label: "new" }],
    },
    ctx,
  );
  expect(updated.result.add_edges).toEqual([]);
  expect(updated.warnings).toHaveLength(1);
  const conflicting = runQualityValidation(
    {
      ...empty(),
      remove_edges: [{ source: "a", target: "b" }],
      update_edges: [{ id: "ab", label: "new" }],
    },
    ctx,
  );
  expect(conflicting.result.update_edges).toEqual([]);
  expect(conflicting.warnings).toHaveLength(1);
  const duplicate = runQualityValidation(
    {
      ...empty(),
      update_edges: [
        { id: "ab", label: "one" },
        { id: "ab", label: "two" },
      ],
    },
    ctx,
  );
  expect(duplicate.warnings).toHaveLength(1);
});
