/**
 * Incremental node placement — used when ADDING new nodes to an existing graph
 * without reshuffling the user's manual positions.
 *
 * Unlike `getLayoutedElements` (which does a full dagre re-layout and overwrites
 * every position), this function:
 *   - treats existing nodes as immovable anchors
 *   - places each new node adjacent to an existing (or previously-placed new)
 *     node it's connected to
 *   - resolves overlap by nudging perpendicular to flow direction
 *
 * Trade-off: less globally optimal than dagre, but preserves the user's mental
 * map. Use this for proposal-accept flows. For "Tidy Up" (explicit full reset),
 * use `getLayoutedElements` instead.
 */
import type { MindMapNode, NodeType } from "@/store/mindmap-store";

// Mirror of NODE_SIZES in auto-layout.ts. Kept local to avoid cross-module
// churn — these rarely change.
const NODE_SIZES: Record<string, { w: number; h: number }> = {
  circle: { w: 110, h: 110 },
  rectangle: { w: 140, h: 70 },
  diamond: { w: 130, h: 130 },
  "rounded-rect": { w: 140, h: 70 },
};
const DEFAULT_SIZE = { w: 140, h: 80 };

const HORIZONTAL_GAP = 80; // px between anchor and placed node along flow axis
const VERTICAL_GAP = 50; // px between siblings placed around same anchor
const NUDGE_STEP = 130; // perpendicular step size when resolving overlap
const OVERLAP_PAD = 16; // min clearance between node bounding boxes
const MAX_NUDGE_ITERATIONS = 50;

interface PlacedBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface NewNodeSpec {
  id: string;
  label: string;
  type: NodeType;
}

export interface NewEdgeSpec {
  source: string;
  target: string;
}

export interface PlacedNewNode {
  id: string;
  label: string;
  type: NodeType;
  position: { x: number; y: number };
}

function getDims(type: string): { w: number; h: number } {
  return NODE_SIZES[type] || DEFAULT_SIZE;
}

/**
 * AABB overlap check with padding.
 */
function hasOverlap(
  x: number,
  y: number,
  w: number,
  h: number,
  placed: Map<string, PlacedBox>,
  ignoreId?: string
): boolean {
  for (const [id, p] of placed) {
    if (id === ignoreId) continue;
    if (
      x < p.x + p.w + OVERLAP_PAD &&
      x + w + OVERLAP_PAD > p.x &&
      y < p.y + p.h + OVERLAP_PAD &&
      y + h + OVERLAP_PAD > p.y
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Find an existing (already placed) node to anchor this new node to.
 * Preference: incoming edge source (the "parent" in flow direction),
 * then outgoing edge target (the "child").
 */
function findAnchor(
  nodeId: string,
  incoming: Map<string, string[]>,
  outgoing: Map<string, string[]>,
  placed: Map<string, PlacedBox>
): string | null {
  const parents = incoming.get(nodeId) || [];
  for (const p of parents) if (placed.has(p)) return p;
  const children = outgoing.get(nodeId) || [];
  for (const c of children) if (placed.has(c)) return c;
  return null;
}

/**
 * Starting from (x,y), nudge perpendicular to flow direction until no overlap.
 * Alternates sides so siblings fan out symmetrically rather than all drifting
 * one way.
 */
function resolveOverlap(
  baseX: number,
  baseY: number,
  w: number,
  h: number,
  placed: Map<string, PlacedBox>,
  direction: "LR" | "TB"
): { x: number; y: number } {
  let x = baseX;
  let y = baseY;
  let sign = 1;
  let step = 1;
  let iterations = 0;

  while (iterations < MAX_NUDGE_ITERATIONS && hasOverlap(x, y, w, h, placed)) {
    const offset = sign * step * NUDGE_STEP;
    if (direction === "LR") {
      y = baseY + offset;
    } else {
      x = baseX + offset;
    }
    sign = -sign;
    if (sign === 1) step += 1;
    iterations++;
  }

  return { x, y };
}

/**
 * Compute bounding box of all placed nodes — used to position "orphan" new
 * nodes (no connection to any existing graph node) off to the side.
 */
function getBoundingBox(placed: Map<string, PlacedBox>): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  avgY: number;
  avgX: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (const p of placed.values()) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x + p.w);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y + p.h);
    sumX += p.x;
    sumY += p.y;
    count++;
  }
  if (count === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, avgX: 100, avgY: 100 };
  }
  return { minX, maxX, minY, maxY, avgX: sumX / count, avgY: sumY / count };
}

/**
 * Place new nodes adjacent to their anchors without disturbing existing nodes.
 *
 * @param existingNodes  Nodes already in the graph — their positions are sacred
 * @param newNodeSpecs   New nodes that need positions
 * @param newEdges       Edges being added (used to find anchors for new nodes)
 * @param direction      "LR" places new nodes to the right of anchors,
 *                       "TB" places them below. Default "LR" (matches auto-layout)
 * @returns              The new nodes with computed positions
 */
export function placeNewNodesIncrementally(
  existingNodes: MindMapNode[],
  newNodeSpecs: NewNodeSpec[],
  newEdges: NewEdgeSpec[],
  direction: "LR" | "TB" = "LR"
): PlacedNewNode[] {
  // Start with existing nodes recorded as "placed" (immovable anchors)
  const placed = new Map<string, PlacedBox>();
  for (const n of existingNodes) {
    const dims = getDims(n.data.type);
    placed.set(n.id, {
      x: n.position.x,
      y: n.position.y,
      w: dims.w,
      h: dims.h,
    });
  }

  // Build adjacency from new edges so we can find anchors
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const e of newEdges) {
    if (!incoming.has(e.target)) incoming.set(e.target, []);
    incoming.get(e.target)!.push(e.source);
    if (!outgoing.has(e.source)) outgoing.set(e.source, []);
    outgoing.get(e.source)!.push(e.target);
  }

  const result: PlacedNewNode[] = [];
  let remaining = [...newNodeSpecs];

  // Rounds of placement: each round places all nodes whose anchor is already
  // placed. Remaining nodes (their anchor is a sibling not-yet-placed) wait
  // for the next round. Handles chains like A→B→C where B and C are both new.
  let safetyGuard = 0;
  while (remaining.length > 0 && safetyGuard < 20) {
    safetyGuard++;

    // Group placeable nodes by their anchor for sibling fan-out
    const placeableByAnchor = new Map<string, NewNodeSpec[]>();
    const unplaceable: NewNodeSpec[] = [];

    for (const node of remaining) {
      const anchorId = findAnchor(node.id, incoming, outgoing, placed);
      if (anchorId) {
        if (!placeableByAnchor.has(anchorId)) placeableByAnchor.set(anchorId, []);
        placeableByAnchor.get(anchorId)!.push(node);
      } else {
        unplaceable.push(node);
      }
    }

    if (placeableByAnchor.size === 0) break; // no more progress possible

    for (const [anchorId, siblings] of placeableByAnchor) {
      const anchor = placed.get(anchorId)!;

      // Compute center of the sibling group so they fan out symmetrically
      // around the anchor's perpendicular axis
      const siblingDims = siblings.map((s) => getDims(s.type));

      if (direction === "LR") {
        // Total stack height of siblings
        const totalH =
          siblingDims.reduce((sum, d) => sum + d.h, 0) +
          Math.max(0, siblings.length - 1) * VERTICAL_GAP;
        const anchorCenterY = anchor.y + anchor.h / 2;
        let cursorY = anchorCenterY - totalH / 2;

        siblings.forEach((node, idx) => {
          const d = siblingDims[idx];
          const baseX = anchor.x + anchor.w + HORIZONTAL_GAP;
          const baseY = cursorY;
          cursorY += d.h + VERTICAL_GAP;

          const { x: fx, y: fy } = resolveOverlap(
            baseX,
            baseY,
            d.w,
            d.h,
            placed,
            direction
          );
          placed.set(node.id, { x: fx, y: fy, w: d.w, h: d.h });
          result.push({
            id: node.id,
            label: node.label,
            type: node.type,
            position: { x: fx, y: fy },
          });
        });
      } else {
        // TB direction — fan out horizontally
        const totalW =
          siblingDims.reduce((sum, d) => sum + d.w, 0) +
          Math.max(0, siblings.length - 1) * HORIZONTAL_GAP;
        const anchorCenterX = anchor.x + anchor.w / 2;
        let cursorX = anchorCenterX - totalW / 2;

        siblings.forEach((node, idx) => {
          const d = siblingDims[idx];
          const baseX = cursorX;
          const baseY = anchor.y + anchor.h + VERTICAL_GAP;
          cursorX += d.w + HORIZONTAL_GAP;

          const { x: fx, y: fy } = resolveOverlap(
            baseX,
            baseY,
            d.w,
            d.h,
            placed,
            direction
          );
          placed.set(node.id, { x: fx, y: fy, w: d.w, h: d.h });
          result.push({
            id: node.id,
            label: node.label,
            type: node.type,
            position: { x: fx, y: fy },
          });
        });
      }
    }

    remaining = unplaceable;
  }

  // Any stragglers — truly disconnected orphans. Park them to the right of
  // the graph (or below, for TB) so they're visible but not overlapping.
  if (remaining.length > 0) {
    const bbox = getBoundingBox(placed);
    for (const node of remaining) {
      const d = getDims(node.type);
      let baseX: number;
      let baseY: number;
      if (direction === "LR") {
        baseX = bbox.maxX + HORIZONTAL_GAP;
        baseY = bbox.avgY;
      } else {
        baseX = bbox.avgX;
        baseY = bbox.maxY + VERTICAL_GAP;
      }
      const { x: fx, y: fy } = resolveOverlap(
        baseX,
        baseY,
        d.w,
        d.h,
        placed,
        direction
      );
      placed.set(node.id, { x: fx, y: fy, w: d.w, h: d.h });
      result.push({
        id: node.id,
        label: node.label,
        type: node.type,
        position: { x: fx, y: fy },
      });
    }
  }

  return result;
}
