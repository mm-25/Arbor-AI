import type { MindMapNode, MindMapEdge } from "@/store/mindmap-store";
import {
  connectionFromEndpoints,
  endpointOf,
  resolveEndpoint,
} from "./connector-endpoints";
import { nodeBox, type Point } from "./canvas-geometry";
import { routeConnection, type Side } from "./edge-routing";
export function connectorGeometry(
  edge: MindMapEdge,
  nodes: MindMapNode[],
  corners?: Point[],
) {
  const source = endpointOf(edge, "source"),
    target = endpointOf(edge, "target");
  const connection = connectionFromEndpoints(source, target, nodes);
  if (!connection) return null;
  const a = resolveEndpoint(
    source.kind === "node"
      ? { ...source, handle: connection.sourceHandle as Side }
      : source,
    nodes,
  )!;
  const b = resolveEndpoint(
    target.kind === "node"
      ? { ...target, handle: connection.targetHandle as Side }
      : target,
    nodes,
  )!;
  const sourceSide: Side | "free" =
    source.kind === "point" ? "free" : (connection.sourceHandle as Side);
  const targetSide: Side | "free" =
    target.kind === "point" ? "free" : (connection.targetHandle as Side);
  const boxes = nodes
    .map((n) => nodeBox(n, 10))
    .filter(
      (box) =>
        ![
          ...(source.kind === "point" ? [a] : []),
          ...(target.kind === "point" ? [b] : []),
        ].some(
          (p) =>
            p.x > box.x &&
            p.x < box.x + box.width &&
            p.y > box.y &&
            p.y < box.y + box.height,
        ),
    );
  return {
    a,
    b,
    sourceSide,
    targetSide,
    obstacles: boxes,
    ...routeConnection(
      a,
      b,
      sourceSide,
      targetSide,
      boxes,
      corners ?? (edge.data?.corners as Point[] | undefined),
    ),
  };
}
