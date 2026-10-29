import { validEndpoint } from "./connector-endpoints";
import type { GraphSnapshot } from "@/store/history-store";
import { cleanSnapshot } from "./graph-snapshot";
export function serializeGraph(graph: GraphSnapshot) {
  return JSON.stringify(
    { app: "Arbor AI", version: 1, graph: cleanSnapshot(graph) },
    null,
    2,
  );
}
export function parseGraphFile(text: string): GraphSnapshot {
  const invalid = () =>
    new Error("Invalid map backup. The current map has not been changed.");
  const record = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === "object" && !Array.isArray(v);
  const optionalStyle = (v: unknown) =>
    v === undefined ||
    (record(v) &&
      Object.values(v).every(
        (value) =>
          typeof value === "string" ||
          (typeof value === "number" && Number.isFinite(value)),
      ));
  const optionalString = (v: unknown) =>
    v === undefined || typeof v === "string";
  const point = (v: unknown) =>
    record(v) && Number.isFinite(v.x) && Number.isFinite(v.y);
  const points = (v: unknown) =>
    v === undefined || (Array.isArray(v) && v.length <= 1000 && v.every(point));
  const optionalEnum = (v: unknown, values: string[]) =>
    v === undefined || (typeof v === "string" && values.includes(v));
  const handle = (v: unknown) =>
    v === null || optionalEnum(v, ["top", "right", "bottom", "left"]);
  const optionalNumber = (v: unknown) => v === undefined || Number.isFinite(v);
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw invalid();
  }
  if (
    !record(value) ||
    value.app !== "Arbor AI" ||
    value.version !== 1 ||
    !record(value.graph) ||
    !Array.isArray(value.graph.nodes) ||
    !Array.isArray(value.graph.edges) ||
    value.graph.nodes.length > 1000 ||
    value.graph.edges.length > 5000
  )
    throw invalid();
  const ids = new Set<string>(),
    edgeIds = new Set<string>();
  for (const n of value.graph.nodes) {
    if (
      !record(n) ||
      typeof n.id !== "string" ||
      !n.id ||
      ids.has(n.id) ||
      !record(n.position) ||
      !Number.isFinite(n.position.x) ||
      !Number.isFinite(n.position.y) ||
      !record(n.data) ||
      typeof n.data.label !== "string" ||
      !optionalEnum(n.type, ["mindMapNode"]) ||
      !optionalStyle(n.style) ||
      n.parentId !== undefined ||
      !optionalNumber(n.width) ||
      !optionalNumber(n.height) ||
      !optionalString(n.data.color) ||
      !optionalString(n.data.icon) ||
      !optionalEnum(n.data.role, ["concept", "question", "suggestion"]) ||
      !optionalEnum(n.data.source, ["manual", "text", "voice"]) ||
      !["rectangle", "rounded-rect", "circle", "diamond"].includes(
        String(n.data.type),
      )
    )
      throw invalid();
    ids.add(n.id);
  }
  for (const e of value.graph.edges) {
    if (
      !record(e) ||
      typeof e.id !== "string" ||
      !e.id ||
      edgeIds.has(e.id) ||
      typeof e.source !== "string" ||
      typeof e.target !== "string" ||
      !validEndpoint(
        e.source,
        (e.data as Record<string, unknown> | undefined)?.sourcePoint,
        ids,
      ) ||
      !validEndpoint(
        e.target,
        (e.data as Record<string, unknown> | undefined)?.targetPoint,
        ids,
      ) ||
      !optionalString(e.label) ||
      !optionalEnum(e.type, ["editable"]) ||
      !optionalStyle(e.style) ||
      !handle(e.sourceHandle) ||
      !handle(e.targetHandle) ||
      (e.data !== undefined &&
        (!record(e.data) ||
          !points(e.data.corners) ||
          !points(e.data.waypoints) ||
          !optionalString(e.data.strokeColor) ||
          !optionalEnum(e.data.strokeStyle, ["solid", "dashed"]) ||
          !optionalEnum(e.data.relation, [
            "contains",
            "transition",
            "association",
            "reference",
          ]) ||
          !optionalEnum(e.data.parallelAxis, ["x", "y"]) ||
          !optionalNumber(e.data.parallelOffset)))
    )
      throw invalid();
    edgeIds.add(e.id);
  }
  return cleanSnapshot(value.graph as unknown as GraphSnapshot);
}
