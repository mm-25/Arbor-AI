export interface Point {
  x: number;
  y: number;
}
export interface Size {
  width: number;
  height: number;
}
export interface Box extends Point, Size {}
export interface SizedNode {
  position?: Point;
  data: { label: string; type: string; icon?: unknown; role?: unknown };
  measured?: Partial<Size>;
}

/** Shared initial dimensions; the renderer uses these same boxes before measurement. */
export function nodeSize(node: SizedNode): Size {
  const { label, type, icon } = node.data;
  const square = type === "diamond" || type === "circle";
  const contentWidth = square ? 120 : 176;
  let lines = 1,
    used = 0;
  for (const word of label.split(/\s+/)) {
    const length = Math.max(1, [...word].length) * 7.5;
    if (used && used + length + 7.5 > contentWidth) {
      lines++;
      used = 0;
    }
    lines += Math.max(0, Math.ceil(length / contentWidth) - 1);
    used = length > contentWidth ? length % contentWidth : used + length + 7.5;
  }
  const textHeight =
    lines * 20 +
    (icon ? 24 : 0) +
    (node.data.role === "suggestion" || node.data.role === "question" ? 20 : 0);
  const base = square
    ? {
        width: Math.max(type === "diamond" ? 208 : 176, textHeight * 2 + 40),
        height: 0,
      }
    : { width: 208, height: Math.max(72, textHeight + 32) };
  if (square) base.height = base.width;
  return {
    width: node.measured?.width ?? base.width,
    height: node.measured?.height ?? base.height,
  };
}
export function nodeBox(
  node: SizedNode & { position: Point },
  padding = 0,
): Box {
  const size = nodeSize(node);
  return {
    x: node.position.x - padding,
    y: node.position.y - padding,
    width: size.width + padding * 2,
    height: size.height + padding * 2,
  };
}
export function graphBounds(nodes: (SizedNode & { position: Point })[]): Box {
  if (!nodes.length) return { x: 0, y: 0, width: 1, height: 1 };
  const boxes = nodes.map((n) => nodeBox(n));
  const x = Math.min(...boxes.map((b) => b.x)),
    y = Math.min(...boxes.map((b) => b.y));
  return {
    x,
    y,
    width: Math.max(...boxes.map((b) => b.x + b.width)) - x,
    height: Math.max(...boxes.map((b) => b.y + b.height)) - y,
  };
}
export function fitViewport(
  bounds: Box,
  canvas: Size,
  insets: { left: number; right: number; bottom?: number } = {
    left: 0,
    right: 0,
  },
  padding = 24,
) {
  const width = Math.max(
    1,
    canvas.width - insets.left - insets.right - padding * 2,
  );
  const height = Math.max(
    1,
    canvas.height - (insets.bottom ?? 0) - padding * 2,
  );
  const zoom = Math.max(
    0.01,
    Math.min(
      1.25,
      width / Math.max(1, bounds.width),
      height / Math.max(1, bounds.height),
    ),
  );
  return {
    zoom,
    x: insets.left + padding + width / 2 - (bounds.x + bounds.width / 2) * zoom,
    y: padding + height / 2 - (bounds.y + bounds.height / 2) * zoom,
  };
}
export function intersects(a: Box, b: Box, gap = 0) {
  return (
    a.x < b.x + b.width + gap &&
    a.x + a.width + gap > b.x &&
    a.y < b.y + b.height + gap &&
    a.y + a.height + gap > b.y
  );
}
export function segmentHitsBox(a: Point, b: Point, box: Box) {
  const epsilon = 0.01;
  if (Math.abs(a.x - b.x) < epsilon)
    return (
      a.x > box.x + epsilon &&
      a.x < box.x + box.width - epsilon &&
      Math.max(a.y, b.y) > box.y + epsilon &&
      Math.min(a.y, b.y) < box.y + box.height - epsilon
    );
  if (Math.abs(a.y - b.y) < epsilon)
    return (
      a.y > box.y + epsilon &&
      a.y < box.y + box.height - epsilon &&
      Math.max(a.x, b.x) > box.x + epsilon &&
      Math.min(a.x, b.x) < box.x + box.width - epsilon
    );
  return true;
}
