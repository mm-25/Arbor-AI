import type { MindMapNode, MindMapEdge } from "@/store/mindmap-store";
import { getLayoutedElements, type LayoutDirection } from "./auto-layout";
import { graphBounds, nodeBox, intersects } from "./canvas-geometry";
export interface LayoutCommand {
  scope: "all" | "selection" | "branch";
  direction: LayoutDirection;
  includesContent: boolean;
}

/** Deliberately narrow affirmative command grammar. Questions about tidying,
 * conditionals and negated instructions never become automatic mutations. */
export function parseLayoutCommand(input: string): LayoutCommand | null {
  const text = input.trim().toLowerCase();
  const match = text.match(
    /^(?:please\s+)?(?:(?:can|could|would)\s+you\s+|i(?:'d| would)\s+like\s+you\s+to\s+)?(?:please\s+)?(?:tidy(?:\s+up)?|clean\s+up|align|arrange|rearrange|reorganize)\s+(?:(?:the|this|my|our)\s+)?(?:selected\s+nodes|graph|map|canvas|diagram|selection|branch|selected\s+branch)\b/,
  );
  if (!match) return null;
  const tail = text.slice(match[0].length).trim();
  if (
    /\b(?:if|unless|hypothetically|later|after|before|until|not now|not yet|don't|do not|never|but not|not vertically|not horizontally|not top|not left)\b/.test(
      tail,
    )
  )
    return null;
  const compound = tail.match(
    /\b(?:and|then)\s+(?:add|create|remove|delete|rename|expand|connect|disconnect|change|replace)\b/,
  );
  const layoutTail = (compound ? tail.slice(0, compound.index) : tail).trim();
  const directionOnly =
    /^(?:[,;:]?\s*(?:(?:from )?(?:top[ -](?:to[ -])?bottom|top[ -]down|left[ -](?:to[ -])?right)|vertically|horizontally|automatically))?\s*[.!]?$/;
  const knownReason =
    /^,?\s*i am not able to understand (?:the connections|how the connections are being made)(?:,\s*there are overlapping connectors?(?: and also there isn't any alignment)?)?[.!]?$/;
  // Unknown tails go through ordinary generation; never drop their meaning by
  // treating a matched prefix as a complete, free local layout request.
  if (!directionOnly.test(layoutTail) && !knownReason.test(layoutTail))
    return null;
  const scope = /\bbranch\b/.test(match[0])
    ? "branch"
    : /\b(?:selection|selected)\b/.test(match[0])
      ? "selection"
      : "all";
  const direction = /top[ -]?(?:to[ -]?)?bottom|top[ -]down|vertically/.test(
    text,
  )
    ? "TB"
    : /left[ -]?(?:to[ -]?)?right|horizontally/.test(text)
      ? "LR"
      : "AUTO";
  return {
    scope,
    direction,
    includesContent: !!compound,
  };
}
export function layoutDocument(
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  command: LayoutCommand,
  selectedIds: string[] = [],
) {
  if (command.scope === "all")
    return getLayoutedElements(nodes, edges, command.direction);
  const selected = new Set(
    selectedIds.filter((id) => nodes.some((n) => n.id === id)),
  );
  if (!selected.size)
    throw new Error("Select a node or branch before arranging the selection.");
  if (command.scope === "branch") {
    const queue = [...selected];
    for (let i = 0; i < queue.length; i++)
      for (const e of edges)
        if (
          e.source === queue[i] &&
          e.data?.relation !== "reference" &&
          !selected.has(e.target)
        ) {
          selected.add(e.target);
          queue.push(e.target);
        }
  }
  const original = nodes.filter((n) => selected.has(n.id));
  const partial = getLayoutedElements(
    original,
    edges.filter((e) => selected.has(e.source) && selected.has(e.target)),
    command.direction,
  );
  const old = graphBounds(original),
    fresh = graphBounds(partial.nodes);
  let dx = old.x - fresh.x,
    dy = old.y - fresh.y;
  const outside = nodes.filter((n) => !selected.has(n.id));
  const overlaps = () =>
    partial.nodes.some((n) =>
      outside.some((other) =>
        intersects(
          nodeBox({
            ...n,
            position: { x: n.position.x + dx, y: n.position.y + dy },
          }),
          nodeBox(other),
          24,
        ),
      ),
    );
  if (overlaps()) {
    dx = graphBounds(nodes).x + graphBounds(nodes).width + 80 - fresh.x;
    dy = old.y - fresh.y;
  }
  const arranged = new Map(
    partial.nodes.map((n) => [
      n.id,
      { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } },
    ]),
  );
  const edgeMap = new Map(partial.edges.map((e) => [e.id, e]));
  return {
    nodes: nodes.map((n) => arranged.get(n.id) ?? n),
    edges: edges.map((e) => edgeMap.get(e.id) ?? e),
  };
}
