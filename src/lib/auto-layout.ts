import dagre from "@dagrejs/dagre";
import type { MindMapNode, MindMapEdge } from "@/store/mindmap-store";

const NODE_WIDTH = 160;
const NODE_HEIGHT = 100;

export function getLayoutedElements(
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  direction: "TB" | "LR" = "TB"
): { nodes: MindMapNode[]; edges: MindMapEdge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 120,     // horizontal space between nodes in same rank
    ranksep: 160,     // vertical space between ranks
    edgesep: 60,      // space between edges
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  // Only update positions for nodes that don't already have manual positions
  // (i.e., nodes at 0,0 are newly added by AI and need layout)
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    if (!nodeWithPosition) return node;

    // If this is a new node (position 0,0) or if it's an AI-generated node, apply layout
    const isNewNode =
      node.position.x === 0 && node.position.y === 0;
    const isAINode = node.data.source === "text" || node.data.source === "voice";

    if (isNewNode || isAINode) {
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - NODE_WIDTH / 2,
          y: nodeWithPosition.y - NODE_HEIGHT / 2,
        },
      };
    }

    return node;
  });

  return { nodes: layoutedNodes, edges };
}
