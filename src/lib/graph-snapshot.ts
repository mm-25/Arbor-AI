import type { GraphSnapshot } from "@/store/history-store";

/** Persist content, never measurement, selection or proposal preview state. */
export function cleanSnapshot(snapshot: GraphSnapshot): GraphSnapshot {
  const data = <T extends Record<string, unknown>>(value: T): T => {
    const copy = {...value}; delete copy.proposalHighlight; return copy;
  };
  return {
    nodes: snapshot.nodes.map(node => {
      const copy = {...node, data: data(node.data)};
      delete copy.selected; delete copy.dragging; delete copy.measured;
      return copy;
    }),
    edges: snapshot.edges.map(edge => {
      const copy = {...edge, ...(edge.data && {data: data(edge.data)})};
      delete copy.selected; return copy;
    }),
  };
}
