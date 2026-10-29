import type { MindMapNode, MindMapEdge } from "@/store/mindmap-store";
import {
  nodeBox,
  segmentHitsBox,
  type Box,
  type Point,
} from "./canvas-geometry";
export type Side = "left" | "right" | "top" | "bottom";
export function connectionHandles(
  nodes: MindMapNode[],
  sourceId: string,
  targetId: string,
) {
  const center = (id: string) => {
    const n = nodes.find((n) => n.id === id);
    if (!n) return null;
    const b = nodeBox(n);
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  const a = center(sourceId),
    b = center(targetId);
  if (!a || !b) return { sourceHandle: "right", targetHandle: "left" };
  if (sourceId === targetId)
    return { sourceHandle: "right", targetHandle: "top" };
  const dx = b.x - a.x,
    dy = b.y - a.y;
  return Math.abs(dx) >= Math.abs(dy)
    ? dx >= 0
      ? { sourceHandle: "right", targetHandle: "left" }
      : { sourceHandle: "left", targetHandle: "right" }
    : dy >= 0
      ? { sourceHandle: "bottom", targetHandle: "top" }
      : { sourceHandle: "top", targetHandle: "bottom" };
}
export function translateEdgeGeometry(
  edge: MindMapEdge,
  dx: number,
  dy: number,
): MindMapEdge {
  const data = { ...edge.data };
  for (const key of ["sourcePoint", "targetPoint"]) {
    const p = data[key] as Point | undefined;
    if (p) data[key] = { x: p.x + dx, y: p.y + dy };
  }
  for (const key of ["corners", "waypoints"])
    if (Array.isArray(data[key]))
      data[key] = (data[key] as Point[]).map((p) => ({
        x: p.x + dx,
        y: p.y + dy,
      }));
  return { ...edge, data };
}
export function simplify(points: Point[]) {
  const result: Point[] = [];
  for (const p of points) {
    if (result.length && p.x === result.at(-1)!.x && p.y === result.at(-1)!.y)
      continue;
    while (result.length >= 2) {
      const a = result.at(-2)!,
        b = result.at(-1)!;
      if ((a.x === b.x && b.x === p.x) || (a.y === b.y && b.y === p.y))
        result.pop();
      else break;
    }
    result.push(p);
  }
  return result;
}
function stub(p: Point, side: Side | "free", boxes: Box[]): Point {
  if (side === "free") return p;
  let distance = 28;
  for (const box of boxes) {
    // The endpoint starts inside its own padded box. Unrelated boxes ahead
    // constrain the stub so it cannot overshoot a narrow gap into a neighbor.
    if (inside(p, box)) continue;
    let ahead = Infinity;
    if (
      (side === "top" || side === "bottom") &&
      p.x > box.x &&
      p.x < box.x + box.width
    ) {
      if (side === "bottom" && box.y >= p.y) ahead = box.y - p.y;
      if (side === "top" && box.y + box.height <= p.y)
        ahead = p.y - box.y - box.height;
    }
    if (
      (side === "left" || side === "right") &&
      p.y > box.y &&
      p.y < box.y + box.height
    ) {
      if (side === "right" && box.x >= p.x) ahead = box.x - p.x;
      if (side === "left" && box.x + box.width <= p.x)
        ahead = p.x - box.x - box.width;
    }
    distance = Math.min(distance, Math.max(1, ahead - 2));
  }
  return {
    x: p.x + (side === "right" ? distance : side === "left" ? -distance : 0),
    y: p.y + (side === "bottom" ? distance : side === "top" ? -distance : 0),
  };
}
const inside = (p: Point, b: Box) =>
  p.x > b.x && p.x < b.x + b.width && p.y > b.y && p.y < b.y + b.height;

/** Orthogonal visibility grid. Bends are penalized so clear routes stay simple. */
function between(
  start: Point,
  end: Point,
  boxes: Box[],
  wide = false,
): Point[] | null {
  const clear = (a: Point, b: Point) =>
    !boxes.some((box) => segmentHitsBox(a, b, box));
  if (boxes.some((b) => inside(start, b) || inside(end, b))) return null;
  const direct = [
    [start, { x: end.x, y: start.y }, end],
    [start, { x: start.x, y: end.y }, end],
  ];
  for (const path of direct)
    if (path.slice(1).every((p, i) => clear(path[i], p))) return simplify(path);
  const relevant = wide
    ? boxes
    : boxes.filter(
        (b) =>
          b.x < Math.max(start.x, end.x) + 80 &&
          b.x + b.width > Math.min(start.x, end.x) - 80 &&
          b.y < Math.max(start.y, end.y) + 80 &&
          b.y + b.height > Math.min(start.y, end.y) - 80,
      );
  const xs = [
    ...new Set([
      start.x,
      end.x,
      ...relevant.flatMap((b) => [b.x - 4, b.x + b.width + 4]),
    ]),
  ].sort((a, b) => a - b);
  const ys = [
    ...new Set([
      start.y,
      end.y,
      ...relevant.flatMap((b) => [b.y - 4, b.y + b.height + 4]),
    ]),
  ].sort((a, b) => a - b);
  type Step = {
    i: number;
    j: number;
    direction: number;
    cost: number;
    score: number;
    previous?: Step;
  };
  const begin: Step = {
    i: xs.indexOf(start.x),
    j: ys.indexOf(start.y),
    direction: 0,
    cost: 0,
    score: 0,
  };
  const open = [begin],
    best = new Map<string, number>();
  let searched = 0;
  while (open.length && searched++ < 40000) {
    open.sort((a, b) => b.score - a.score);
    const step = open.pop()!;
    const p = { x: xs[step.i], y: ys[step.j] };
    if (p.x === end.x && p.y === end.y) {
      const path: Point[] = [];
      let at: Step | undefined = step;
      while (at) {
        path.push({ x: xs[at.i], y: ys[at.j] });
        at = at.previous;
      }
      return simplify(path.reverse());
    }
    for (const [di, dj, direction] of [
      [-1, 0, 1],
      [1, 0, 1],
      [0, -1, 2],
      [0, 1, 2],
    ]) {
      const i = step.i + di,
        j = step.j + dj;
      if (i < 0 || j < 0 || i >= xs.length || j >= ys.length) continue;
      const q = { x: xs[i], y: ys[j] };
      if (!clear(p, q)) continue;
      const cost =
        step.cost +
        Math.abs(p.x - q.x) +
        Math.abs(p.y - q.y) +
        (step.direction && step.direction !== direction ? 24 : 0);
      const key = `${i},${j},${direction}`;
      if ((best.get(key) ?? Infinity) <= cost) continue;
      best.set(key, cost);
      open.push({
        i,
        j,
        direction,
        cost,
        score: cost + Math.abs(q.x - end.x) + Math.abs(q.y - end.y),
        previous: step,
      });
    }
  }
  return !wide && relevant.length < boxes.length
    ? between(start, end, boxes, true)
    : null;
}
export function routeConnection(
  source: Point,
  target: Point,
  sourceSide: Side | "free",
  targetSide: Side | "free",
  obstacles: Box[],
  waypoints?: Point[],
) {
  const a = stub(source, sourceSide, obstacles),
    b = stub(target, targetSide, obstacles);
  const stops = [a, ...(waypoints ?? []), b];
  let middle: Point[] = [];
  let adjusted = false;
  for (let i = 1; i < stops.length; i++) {
    const part = between(stops[i - 1], stops[i], obstacles);
    if (!part) {
      middle = [];
      adjusted = !!waypoints?.length;
      break;
    }
    middle.push(...part);
  }
  if (!middle.length && adjusted) middle = between(a, b, obstacles) ?? [];
  const blocked = !middle.length;
  if (blocked) middle = [a, { x: b.x, y: a.y }, b];
  // Keep endpoint stubs even when collinear, so side constraints are explicit.
  return { points: [source, ...simplify(middle), target], blocked, adjusted };
}
export function roundedPath(points: Point[], radius = 8) {
  const p = simplify(points);
  if (!p.length) return "";
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 1; i < p.length - 1; i++) {
    const a = p[i - 1],
      b = p[i],
      c = p[i + 1],
      l1 = Math.hypot(b.x - a.x, b.y - a.y),
      l2 = Math.hypot(c.x - b.x, c.y - b.y),
      r = Math.min(radius, l1 / 2, l2 / 2);
    if (!l1 || !l2) continue;
    d += ` L ${b.x - ((b.x - a.x) / l1) * r} ${b.y - ((b.y - a.y) / l1) * r} Q ${b.x} ${b.y} ${b.x + ((c.x - b.x) / l2) * r} ${b.y + ((c.y - b.y) / l2) * r}`;
  }
  return d + ` L ${p.at(-1)!.x} ${p.at(-1)!.y}`;
}

/** React Flow places reconnect hit targets one radius outside the attachment. */
export function reconnectControlPosition(
  point: Point,
  side: Side,
  zoom: number,
): Point {
  const distance = 16 / zoom;
  return {
    x:
      point.x + (side === "right" ? distance : side === "left" ? -distance : 0),
    y:
      point.y + (side === "bottom" ? distance : side === "top" ? -distance : 0),
  };
}
