/**
 * Layer 3: Semantic Quality Validation for AI-generated diagrams.
 *
 * This module enforces quality rules on top of the schema-level sanitization
 * already done in `route.ts`. These checks catch problems the LLM produces
 * even when the JSON is structurally valid:
 *
 *  - Diamond nodes misused as single-output decisions (convert to rectangle)
 *  - Diamond outgoing edges missing labels (auto-fill yes/no)
 *  - Duplicate labels within the same add_nodes batch
 *  - Generic / placeholder labels like "Process", "Step 1", "Node"
 *  - Orphan nodes (no incoming AND no outgoing edges after processing)
 *  - Runaway decompositions (cap total new nodes per generation)
 *
 * Each function is pure: it takes a `GenerateResult` and returns a new one.
 * They're composed in `runQualityValidation()` in a deliberate order.
 */

// ── Shared types (mirrors route.ts) ────────────────────────────────────────────

export interface AINode {
  id: string;
  label: string;
  type: string;
}

export interface AIEdge {
  source: string;
  target: string;
  label?: string;
}

export interface AIUpdateNode {
  id: string;
  label?: string;
  type?: string;
}

export interface AIRemoveEdge {
  source: string;
  target: string;
}

export interface GenerateResult {
  add_nodes: AINode[];
  add_edges: AIEdge[];
  update_nodes: AIUpdateNode[];
  remove_nodes: string[];
  remove_edges: AIRemoveEdge[];
}

export interface ExistingEdge {
  source: string;
  target: string;
  label?: string;
}

export interface ValidationContext {
  existingNodeIds: Set<string>;
  existingEdges: ExistingEdge[];
  isExpanding: boolean;
  focusedNodeId?: string;
}

export interface ValidationReport {
  result: GenerateResult;
  warnings: string[];
}

// ── Configuration ──────────────────────────────────────────────────────────────

/** Cap total NEW nodes per single generation. Prevents runaway decomposition. */
const MAX_NEW_NODES = 25;

/**
 * Labels the LLM uses as placeholders. Case-insensitive.
 * A node with one of these labels adds no semantic value.
 */
const GENERIC_LABELS = new Set([
  "process",
  "step",
  "step 1",
  "step 2",
  "step 3",
  "start",
  "end",
  "node",
  "task",
  "item",
  "action",
  "thing",
  "todo",
  "placeholder",
  "decision",
  "outcome",
  "actor",
  "user",
  "system",
]);

// ── Utilities ──────────────────────────────────────────────────────────────────

/** Normalize a label for semantic comparison: lowercase, strip articles, sort words. */
export function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/\b(the|a|an)\b/g, "")
    .trim()
    .split(/\s+/)
    .sort()
    .join(" ");
}

/** Remap every reference to `oldId` in the result to `newId` (add_edges + remove_edges). */
function remapId(result: GenerateResult, oldId: string, newId: string): GenerateResult {
  return {
    ...result,
    add_edges: result.add_edges.map((e) => ({
      ...e,
      source: e.source === oldId ? newId : e.source,
      target: e.target === oldId ? newId : e.target,
    })),
    remove_edges: result.remove_edges.map((e) => ({
      ...e,
      source: e.source === oldId ? newId : e.source,
      target: e.target === oldId ? newId : e.target,
    })),
  };
}

// ── Check 1: Dedupe duplicate labels within add_nodes ─────────────────────────

/**
 * If two NEW nodes have the same normalized label, merge them: keep the first,
 * remap edges pointing to the duplicate. Prevents "Validate Input" and
 * "Input Validation" from both appearing in the same generation.
 */
function dedupeAddNodesByLabel(
  result: GenerateResult,
  warnings: string[]
): GenerateResult {
  const seenLabel = new Map<string, string>(); // normalized label -> kept id
  const keptNodes: AINode[] = [];
  let working = result;

  for (const node of result.add_nodes) {
    const key = normalizeLabel(node.label);
    const existingId = seenLabel.get(key);
    if (existingId) {
      warnings.push(
        `Merged duplicate node "${node.label}" (${node.id}) into "${existingId}"`
      );
      working = remapId(working, node.id, existingId);
      continue;
    }
    seenLabel.set(key, node.id);
    keptNodes.push(node);
  }

  return { ...working, add_nodes: keptNodes };
}

// ── Check 2: Filter generic / placeholder labels ──────────────────────────────

/**
 * Drop add_nodes whose label is a meaningless placeholder. Cascades to
 * remove any edges touching the dropped nodes.
 */
function filterGenericLabels(
  result: GenerateResult,
  warnings: string[]
): GenerateResult {
  const droppedIds = new Set<string>();
  const keptNodes: AINode[] = [];

  for (const node of result.add_nodes) {
    const normalized = node.label.toLowerCase().trim();
    if (GENERIC_LABELS.has(normalized)) {
      droppedIds.add(node.id);
      warnings.push(`Dropped generic-labeled node: "${node.label}" (${node.id})`);
      continue;
    }
    keptNodes.push(node);
  }

  if (droppedIds.size === 0) return result;

  return {
    ...result,
    add_nodes: keptNodes,
    add_edges: result.add_edges.filter(
      (e) => !droppedIds.has(e.source) && !droppedIds.has(e.target)
    ),
  };
}

// ── Check 3: Cap total new node count ─────────────────────────────────────────

/**
 * Cap the number of new nodes per generation. When over the cap, drop the
 * least-connected nodes first (fewest incoming + outgoing edges in add_edges).
 */
function capNodeCount(
  result: GenerateResult,
  warnings: string[]
): GenerateResult {
  if (result.add_nodes.length <= MAX_NEW_NODES) return result;

  // Score each node by edge connections — nodes with more edges are more important
  const edgeCount = new Map<string, number>();
  for (const e of result.add_edges) {
    edgeCount.set(e.source, (edgeCount.get(e.source) || 0) + 1);
    edgeCount.set(e.target, (edgeCount.get(e.target) || 0) + 1);
  }

  const sorted = [...result.add_nodes].sort(
    (a, b) => (edgeCount.get(b.id) || 0) - (edgeCount.get(a.id) || 0)
  );
  const kept = sorted.slice(0, MAX_NEW_NODES);
  const droppedIds = new Set(sorted.slice(MAX_NEW_NODES).map((n) => n.id));

  warnings.push(
    `Capped at ${MAX_NEW_NODES} nodes — dropped ${droppedIds.size} least-connected`
  );

  return {
    ...result,
    add_nodes: kept,
    add_edges: result.add_edges.filter(
      (e) => !droppedIds.has(e.source) && !droppedIds.has(e.target)
    ),
  };
}

// ── Check 4: Enforce diamond rules ────────────────────────────────────────────

/**
 * Diamond nodes must represent real branches — 2 or 3 outgoing edges.
 *
 *  - 0 or 1 outgoing edges → convert to rectangle (it's not actually a decision)
 *  - 2-3 outgoing but some edges missing labels → auto-fill "yes"/"no" when 2 edges
 *  - >3 outgoing edges is already handled by the fan-out limiter in route.ts
 *
 * Also checks update_nodes that are changing something to a diamond.
 */
function enforceDiamondRules(
  result: GenerateResult,
  context: ValidationContext,
  warnings: string[]
): GenerateResult {
  // Build outgoing-edge count across all edges this node will have after apply
  const allOutgoing = new Map<string, AIEdge[]>();
  for (const e of result.add_edges) {
    const list = allOutgoing.get(e.source) || [];
    list.push(e);
    allOutgoing.set(e.source, list);
  }
  // Include existing edges for update_nodes that are becoming diamonds
  for (const e of context.existingEdges) {
    const list = allOutgoing.get(e.source) || [];
    list.push({ source: e.source, target: e.target, label: e.label });
    allOutgoing.set(e.source, list);
  }

  // Mutate add_nodes: downgrade misused diamonds to rectangles
  const fixedAddNodes = result.add_nodes.map((node) => {
    if (node.type !== "diamond") return node;
    const outgoing = allOutgoing.get(node.id) || [];
    if (outgoing.length < 2) {
      warnings.push(
        `Converted diamond "${node.label}" (${node.id}) to rectangle — had ${outgoing.length} outgoing edges`
      );
      return { ...node, type: "rectangle" };
    }
    return node;
  });

  // Same check for update_nodes promoting to diamond
  const fixedUpdateNodes = result.update_nodes.map((u) => {
    if (u.type !== "diamond") return u;
    const outgoing = allOutgoing.get(u.id) || [];
    if (outgoing.length < 2) {
      warnings.push(
        `Prevented update to diamond on "${u.id}" — only ${outgoing.length} outgoing edges`
      );
      return { ...u, type: "rectangle" };
    }
    return u;
  });

  // Auto-label diamond outgoing edges if they have exactly 2 unlabeled edges
  const diamondIds = new Set([
    ...fixedAddNodes.filter((n) => n.type === "diamond").map((n) => n.id),
    ...fixedUpdateNodes.filter((u) => u.type === "diamond").map((u) => u.id),
  ]);

  const fixedAddEdges = result.add_edges.map((e) => {
    if (!diamondIds.has(e.source) || e.label) return e;
    const outgoing = allOutgoing.get(e.source) || [];
    if (outgoing.length !== 2) return e;
    // Assign "yes" to the first, "no" to the second
    const index = outgoing.indexOf(e);
    const autoLabel = index === 0 ? "yes" : "no";
    warnings.push(`Auto-labeled diamond edge ${e.source}→${e.target} as "${autoLabel}"`);
    return { ...e, label: autoLabel };
  });

  return {
    ...result,
    add_nodes: fixedAddNodes,
    add_edges: fixedAddEdges,
    update_nodes: fixedUpdateNodes,
  };
}

// ── Check 5: Remove orphan new nodes ──────────────────────────────────────────

/**
 * An orphan is a NEW node that — after all edge processing — has zero incoming
 * AND zero outgoing edges, and isn't referenced by any existing edge either.
 * It adds no value to the diagram. Keep the focused node exempt during expansion.
 */
function removeOrphanNodes(
  result: GenerateResult,
  context: ValidationContext,
  warnings: string[]
): GenerateResult {
  const connected = new Set<string>();

  for (const e of result.add_edges) {
    connected.add(e.source);
    connected.add(e.target);
  }
  for (const e of context.existingEdges) {
    connected.add(e.source);
    connected.add(e.target);
  }

  const keptNodes = result.add_nodes.filter((n) => {
    if (connected.has(n.id)) return true;
    if (context.isExpanding && n.id === context.focusedNodeId) return true;
    warnings.push(`Removed orphan node "${n.label}" (${n.id}) — no edges`);
    return false;
  });

  return { ...result, add_nodes: keptNodes };
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

/**
 * Run the full quality validation pipeline. Order matters:
 *
 *  1. Dedupe by label  — remove semantic duplicates first
 *  2. Filter generic   — drop placeholders (cascades edge removal)
 *  3. Cap node count   — trim over-decomposition
 *  4. Diamond rules    — downgrade misused diamonds, auto-label decision edges
 *  5. Remove orphans   — last, after all filtering that could disconnect nodes
 */
export function runQualityValidation(
  result: GenerateResult,
  context: ValidationContext
): ValidationReport {
  const warnings: string[] = [];

  let working = result;
  working = dedupeAddNodesByLabel(working, warnings);
  working = filterGenericLabels(working, warnings);
  working = capNodeCount(working, warnings);
  working = enforceDiamondRules(working, context, warnings);
  working = removeOrphanNodes(working, context, warnings);

  return { result: working, warnings };
}
