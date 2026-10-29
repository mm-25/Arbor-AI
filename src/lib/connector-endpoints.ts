import type { Connection, Position } from "@xyflow/react";
import type { MindMapNode, MindMapEdge } from "@/store/mindmap-store";
import { nodeBox, type Point, type Box } from "./canvas-geometry";
import type { Side } from "./edge-routing";

export type ConnectorEndpoint =
  | { kind: "node"; nodeId: string; handle?: Side }
  | { kind: "point"; point: Point };
export type ConnectorConnection = Connection & {
  sourcePoint?: Point;
  targetPoint?: Point;
};
export const isPoint = (value: unknown): value is Point =>
  !!value &&
  typeof value === "object" &&
  Number.isFinite((value as Point).x) &&
  Number.isFinite((value as Point).y);
const sides: Side[] = ["top", "right", "bottom", "left"];
export const isSide = (side: unknown): side is Side =>
  typeof side === "string" && sides.includes(side as Side);
export function validEndpoint(id: unknown, point: unknown, ids: Set<string>) {
  return (
    typeof id === "string" &&
    (id === "" ? isPoint(point) : point === undefined && ids.has(id))
  );
}
export function edgeEndpointsExist(edge: MindMapEdge, ids: Set<string>) {
  return (
    validEndpoint(edge.source, edge.data?.sourcePoint, ids) &&
    validEndpoint(edge.target, edge.data?.targetPoint, ids)
  );
}
export function validConnection(
  connection: ConnectorConnection,
  nodes: MindMapNode[],
) {
  const ids = new Set(nodes.map((n) => n.id));
  return (
    validEndpoint(connection.source, connection.sourcePoint, ids) &&
    validEndpoint(connection.target, connection.targetPoint, ids) &&
    [connection.sourceHandle, connection.targetHandle].every(
      (side) => side == null || isSide(side),
    )
  );
}
export function edgeConnection(edge: MindMapEdge): ConnectorConnection {
  return {
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
    ...(edge.data?.sourcePoint !== undefined
      ? { sourcePoint: edge.data.sourcePoint as Point }
      : {}),
    ...(edge.data?.targetPoint !== undefined
      ? { targetPoint: edge.data.targetPoint as Point }
      : {}),
  };
}
export function endpointOf(
  edge: MindMapEdge,
  end: "source" | "target",
): ConnectorEndpoint {
  const point = edge.data?.[`${end}Point`];
  if (edge[end] === "" && isPoint(point)) return { kind: "point", point };
  const handle = edge[`${end}Handle`];
  return {
    kind: "node",
    nodeId: edge[end],
    ...(isSide(handle) ? { handle } : {}),
  };
}
export function resolveEndpoint(
  endpoint: ConnectorEndpoint,
  nodes: MindMapNode[],
): Point | null {
  if (endpoint.kind === "point") return endpoint.point;
  const node = nodes.find((n) => n.id === endpoint.nodeId);
  if (!node) return null;
  const box = nodeBox(node),
    side = endpoint.handle;
  return {
    x:
      side === "left"
        ? box.x
        : side === "right"
          ? box.x + box.width
          : box.x + box.width / 2,
    y:
      side === "top"
        ? box.y
        : side === "bottom"
          ? box.y + box.height
          : box.y + box.height / 2,
  };
}
export function connectionFromEndpoints(
  source: ConnectorEndpoint,
  target: ConnectorEndpoint,
  nodes: MindMapNode[],
): ConnectorConnection | null {
  const a = resolveEndpoint(source, nodes),
    b = resolveEndpoint(target, nodes);
  if (!a || !b) return null;
  const horizontal = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
  const sourceSide: Side = horizontal
    ? b.x >= a.x
      ? "right"
      : "left"
    : b.y >= a.y
      ? "bottom"
      : "top";
  const targetSide: Side = horizontal
    ? b.x >= a.x
      ? "left"
      : "right"
    : b.y >= a.y
      ? "top"
      : "bottom";
  return {
    source: source.kind === "node" ? source.nodeId : "",
    target: target.kind === "node" ? target.nodeId : "",
    sourceHandle: source.kind === "node" ? (source.handle ?? sourceSide) : null,
    targetHandle: target.kind === "node" ? (target.handle ?? targetSide) : null,
    ...(source.kind === "point" ? { sourcePoint: { ...source.point } } : {}),
    ...(target.kind === "point" ? { targetPoint: { ...target.point } } : {}),
  };
}
export function replaceEndpoint(
  edge: MindMapEdge,
  end: "source" | "target",
  endpoint: ConnectorEndpoint,
  nodes: MindMapNode[],
) {
  return connectionFromEndpoints(
    end === "source" ? endpoint : endpointOf(edge, "source"),
    end === "target" ? endpoint : endpointOf(edge, "target"),
    nodes,
  );
}
export function sameConnection(a: ConnectorConnection, b: ConnectorConnection) {
  return (
    a.source === b.source &&
    a.target === b.target &&
    (a.sourceHandle ?? null) === (b.sourceHandle ?? null) &&
    (a.targetHandle ?? null) === (b.targetHandle ?? null) &&
    JSON.stringify(a.sourcePoint) === JSON.stringify(b.sourcePoint) &&
    JSON.stringify(a.targetPoint) === JSON.stringify(b.targetPoint)
  );
}
export function applyConnection(
  edge: MindMapEdge,
  connection: ConnectorConnection,
): MindMapEdge {
  const data = { ...edge.data };
  for (const key of [
    "sourcePoint",
    "targetPoint",
    "corners",
    "parallelOffset",
    "parallelAxis",
  ])
    delete data[key];
  if (connection.sourcePoint) data.sourcePoint = { ...connection.sourcePoint };
  if (connection.targetPoint) data.targetPoint = { ...connection.targetPoint };
  return {
    ...edge,
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
    data,
  };
}
/** Point candidates are local previews. This function never mutates a graph. */
export function snapEndpoint(
  point: Point,
  nodes: MindMapNode[],
  zoom: number,
  forceFree = false,
): ConnectorEndpoint {
  let best: { distance: number; endpoint: ConnectorEndpoint } | null = null;
  if (!forceFree)
    for (const node of nodes) {
      const box = nodeBox(node),
        inside =
          point.x >= box.x &&
          point.x <= box.x + box.width &&
          point.y >= box.y &&
          point.y <= box.y + box.height;
      for (const handle of sides) {
        const candidate = { kind: "node" as const, nodeId: node.id, handle };
        const anchor = resolveEndpoint(candidate, nodes)!;
        const distance = Math.hypot(anchor.x - point.x, anchor.y - point.y);
        if (
          (inside || distance <= 16 / zoom) &&
          (!best || distance < best.distance)
        )
          best = { distance, endpoint: candidate };
      }
    }
  return best?.endpoint ?? { kind: "point", point: { ...point } };
}
/** Only React Flow sees these anchor nodes; document nodes are never changed. */
export function connectorView(nodes: MindMapNode[], edges: MindMapEdge[]) {
  const anchors: MindMapNode[] = [],
    ids = new Set(nodes.map((n) => n.id));
  const rendered = edges.map((edge) => {
    const view = { ...edge };
    for (const end of ["source", "target"] as const) {
      const endpoint = endpointOf(edge, end);
      if (endpoint.kind !== "point") continue;
      let id = `__arbor_connector_${edge.id}_${end}`;
      while (ids.has(id)) id += "_";
      ids.add(id);
      anchors.push({
        id,
        type: "connectorAnchor",
        position: { ...endpoint.point },
        width: 1,
        height: 1,
        measured: { width: 1, height: 1 },
        handles: [
          {
            id: "free",
            type: "source",
            position: "right" as Position,
            x: 0,
            y: 0,
            width: 1,
            height: 1,
          },
        ],
        selectable: false,
        draggable: false,
        deletable: false,
        focusable: false,
        connectable: false,
        style: { opacity: 0, pointerEvents: "none" },
        data: {
          label: "",
          type: "rectangle",
          source: "manual",
          connectorAnchor: true,
        },
      });
      view[end] = id;
      view[`${end}Handle`] = "free";
    }
    return view;
  });
  return { nodes: [...nodes, ...anchors], edges: rendered };
}
export function documentBounds(
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  contextNodes = nodes,
): Box {
  const boxes = nodes.map((n) => nodeBox(n));
  const included = new Set(nodes.map((n) => n.id));
  for (const id of edges.flatMap((edge) => [edge.source, edge.target]))
    if (id && !included.has(id)) {
      const node = contextNodes.find((n) => n.id === id);
      if (node) {
        boxes.push(nodeBox(node));
        included.add(id);
      }
    }
  for (const edge of edges) {
    for (const point of [
      edge.data?.sourcePoint,
      edge.data?.targetPoint,
      ...(Array.isArray(edge.data?.corners) ? edge.data.corners : []),
    ])
      if (isPoint(point)) boxes.push({ ...point, width: 0, height: 0 });
  }
  if (!boxes.length) return { x: 0, y: 0, width: 1, height: 1 };
  const x = Math.min(...boxes.map((b) => b.x)),
    y = Math.min(...boxes.map((b) => b.y));
  return {
    x,
    y,
    width: Math.max(1, Math.max(...boxes.map((b) => b.x + b.width)) - x),
    height: Math.max(1, Math.max(...boxes.map((b) => b.y + b.height)) - y),
  };
}
