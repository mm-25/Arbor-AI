import { validEndpoint } from "./connector-endpoints";
import { AIError } from "./claude";
import type { GenerateResult } from "./generate-validation";

export type Conversation = { role: "user" | "assistant"; content: string }[];
export interface GraphNodeInfo {
  id: string;
  data: { label: string; type: string; role?: string };
}
export interface GraphEdgeInfo {
  id?: string;
  source: string;
  target: string;
  label?: string;
  data?: {
    relation?: string;
    sourcePoint?: import("./canvas-geometry").Point;
    targetPoint?: import("./canvas-geometry").Point;
  };
}
const shapes = ["rectangle", "rounded-rect", "circle", "diamond"];
const string = { type: "string" };
const role = { type: "string", enum: ["concept", "question", "suggestion"] };
const relation = {
  type: "string",
  enum: ["contains", "transition", "association", "reference"],
};
const object = (
  properties: Record<string, unknown>,
  required = Object.keys(properties),
) => ({ type: "object", properties, required, additionalProperties: false });
const array = (items: unknown) => ({ type: "array", items });
export const GRAPH_CHANGE_SCHEMA = object({
  add_nodes: array(
    object(
      {
        id: string,
        label: string,
        type: { type: "string", enum: shapes },
        role,
      },
      ["id", "label", "type"],
    ),
  ),
  add_edges: array(
    object({ source: string, target: string, label: string, relation }, [
      "source",
      "target",
      "label",
    ]),
  ),
  update_nodes: array(
    object(
      { id: string, label: string, type: { type: "string", enum: shapes } },
      ["id"],
    ),
  ),
  update_edges: array(
    object({ id: string, label: string, relation }, ["id", "label"]),
  ),
  remove_nodes: array(string),
  remove_edges: array(
    object({ id: string, source: string, target: string }, [
      "source",
      "target",
    ]),
  ),
});

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
const text = (value: unknown): value is string =>
  typeof value === "string" && value.length <= 100_000;

export function parseRequestBody(value: unknown): Record<string, unknown> {
  if (!record(value)) throw new AIError("Expected a JSON object request.", 400);
  return value;
}

export function parseConversation(value: unknown): Conversation {
  if (!Array.isArray(value) || !value.length || value.length > 200)
    throw new AIError("Provide 1–200 conversation messages.", 400);
  let total = 0;
  const result = value.map((message) => {
    if (
      !record(message) ||
      (message.role !== "user" && message.role !== "assistant") ||
      !text(message.content)
    )
      throw new AIError("Invalid conversation message.", 400);
    let content = message.content;
    if (message.attachments !== undefined) {
      if (!Array.isArray(message.attachments))
        throw new AIError("Invalid attachments.", 400);
      for (const attachment of message.attachments) {
        if (
          !record(attachment) ||
          attachment.type !== "document" ||
          !text(attachment.name) ||
          !text(attachment.data)
        )
          throw new AIError(
            "Only readable document attachments are supported.",
            400,
          );
        content += `\n\n[Source document: ${attachment.name}]\n${attachment.data}`;
      }
    }
    total += content.length;
    return { role: message.role, content } as Conversation[number];
  });
  if (total > 250_000)
    throw new AIError(
      "This conversation is too long. Start a new map or use shorter source text.",
      400,
    );
  return result;
}

export function parseGraph(nodes: unknown = [], edges: unknown = []) {
  if (
    !Array.isArray(nodes) ||
    nodes.length > 1000 ||
    !Array.isArray(edges) ||
    edges.length > 5000
  )
    throw new AIError("Invalid or oversized canvas.", 400);
  const ids = new Set<string>();
  for (const node of nodes) {
    if (
      !record(node) ||
      !text(node.id) ||
      !node.id ||
      ids.has(node.id) ||
      !record(node.data) ||
      !text(node.data.label) ||
      !text(node.data.type)
    )
      throw new AIError("Invalid canvas node.", 400);
    ids.add(node.id);
  }
  for (const edge of edges) {
    if (
      !record(edge) ||
      (edge.id !== undefined && (!text(edge.id) || !edge.id)) ||
      !text(edge.source) ||
      !text(edge.target) ||
      !validEndpoint(
        edge.source,
        (edge.data as Record<string, unknown> | undefined)?.sourcePoint,
        ids,
      ) ||
      !validEndpoint(
        edge.target,
        (edge.data as Record<string, unknown> | undefined)?.targetPoint,
        ids,
      ) ||
      (edge.label !== undefined && !text(edge.label))
    )
      throw new AIError("Invalid canvas connection.", 400);
  }
  return { nodes: nodes as GraphNodeInfo[], edges: edges as GraphEdgeInfo[] };
}

export function parseGraphChanges(value: unknown): GenerateResult {
  const invalid = () =>
    new AIError(
      "Claude returned an invalid graph change. The map has not been changed.",
    );
  if (!record(value)) throw invalid();
  for (const key of [
    "add_nodes",
    "add_edges",
    "update_nodes",
    "remove_nodes",
    "remove_edges",
  ])
    if (!Array.isArray(value[key])) throw invalid();
  const result = value as unknown as GenerateResult;
  if (
    result.update_edges !== undefined &&
    (!Array.isArray(result.update_edges) ||
      result.update_edges.some(
        (e) =>
          !record(e) ||
          !text(e.id) ||
          !e.id ||
          (e.label !== undefined && !text(e.label)) ||
          (e.relation !== undefined && !relation.enum.includes(e.relation)),
      ))
  )
    throw invalid();
  if (
    result.add_nodes.some(
      (n) =>
        !record(n) ||
        !text(n.id) ||
        !n.id.trim() ||
        !text(n.label) ||
        !n.label.trim() ||
        !shapes.includes(n.type) ||
        (n.role !== undefined && !role.enum.includes(n.role)),
    )
  )
    throw invalid();
  if (
    result.add_edges.some(
      (e) =>
        !record(e) ||
        !text(e.source) ||
        !text(e.target) ||
        (e.label !== undefined && !text(e.label)) ||
        (e.relation !== undefined && !relation.enum.includes(e.relation)),
    )
  )
    throw invalid();
  if (
    result.update_nodes.some(
      (n) =>
        !record(n) ||
        !text(n.id) ||
        (n.label !== undefined && (!text(n.label) || !n.label.trim())) ||
        (n.type !== undefined && !shapes.includes(n.type)),
    )
  )
    throw invalid();
  if (
    result.remove_nodes.some((id) => !text(id)) ||
    result.remove_edges.some(
      (e) =>
        !record(e) ||
        (e.id !== undefined && (!text(e.id) || !e.id)) ||
        !text(e.source) ||
        !text(e.target),
    )
  )
    throw invalid();
  return result;
}

export function graphContext(graph: ReturnType<typeof parseGraph>): string {
  return JSON.stringify({
    nodes: graph.nodes.map((n) => ({
      id: n.id,
      label: n.data.label,
      type: n.data.type,
      ...(n.data.role ? { role: n.data.role } : {}),
    })),
    edges: graph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label ?? "",
      ...(e.data?.relation ? { relation: e.data.relation } : {}),
      ...(e.data?.sourcePoint ? { sourcePoint: e.data.sourcePoint } : {}),
      ...(e.data?.targetPoint ? { targetPoint: e.data.targetPoint } : {}),
    })),
  });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof AIError)
    return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError)
    return Response.json({ error: "Invalid JSON request." }, { status: 400 });
  return Response.json(
    { error: "The request could not be completed. Please try again." },
    { status: 500 },
  );
}
