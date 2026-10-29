/** Structural graph integrity only. Labels and shapes are user content,
 * not a basis for merging concepts, deleting ideas or inventing branches. */
export interface AINode {
  id: string;
  label: string;
  type: string;
  role?: "concept" | "question" | "suggestion";
}

export interface AIEdge {
  source: string;
  target: string;
  label?: string;
  relation?: "contains" | "transition" | "association" | "reference";
}

export interface AIUpdateNode {
  id: string;
  label?: string;
  type?: string;
}

export interface AIRemoveEdge {
  id?: string;
  source: string;
  target: string;
}

export interface GenerateResult {
  add_nodes: AINode[];
  add_edges: AIEdge[];
  update_nodes: AIUpdateNode[];
  remove_nodes: string[];
  remove_edges: AIRemoveEdge[];
  update_edges?: { id: string; label?: string; relation?: string }[];
  layout?: import("./layout-command").LayoutCommand;
  layoutNodeIds?: string[];
}

export interface ExistingEdge {
  id?: string;
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

export function runQualityValidation(
  result: GenerateResult,
  context: ValidationContext,
): ValidationReport {
  const warnings: string[] = [];
  const removed = new Set(
    result.remove_nodes.filter((id) => {
      if (context.existingNodeIds.has(id)) return true;
      warnings.push(`Ignored removal of unavailable node: ${id}`);
      return false;
    }),
  );
  const remove_edges = result.remove_edges.filter((edge) => {
    const matches = context.existingEdges.filter(
      (existing) =>
        existing.source === edge.source &&
        existing.target === edge.target &&
        (!edge.id || edge.id === existing.id),
    );
    if (matches.length === 1) return true;
    warnings.push(
      `Ignored unavailable or ambiguous edge removal: ${edge.source} → ${edge.target}`,
    );
    return false;
  });
  const known = new Set(
    [...context.existingNodeIds].filter((id) => !removed.has(id)),
  );
  const add_nodes = result.add_nodes.filter((node) => {
    if (
      !node.id.trim() ||
      !node.label.trim() ||
      known.has(node.id) ||
      removed.has(node.id)
    ) {
      warnings.push(`Ignored invalid or colliding node ID: ${node.id}`);
      return false;
    }
    known.add(node.id);
    return true;
  });
  const edgeKey = (edge: AIEdge) =>
    JSON.stringify([edge.source, edge.target, edge.label ?? ""]);
  const edgeRemoved = (edge: ExistingEdge) =>
    removed.has(edge.source) ||
    removed.has(edge.target) ||
    remove_edges.some(
      (removal) =>
        removal.source === edge.source &&
        removal.target === edge.target &&
        (!removal.id || removal.id === edge.id),
    );
  const seenUpdates = new Set<string>();
  const update_edges = (result.update_edges ?? []).filter((update) => {
    const edge = context.existingEdges.find(
      (existing) => existing.id === update.id,
    );
    if (!edge || edgeRemoved(edge) || seenUpdates.has(update.id)) {
      warnings.push(
        `Ignored unavailable or conflicting edge update: ${update.id}`,
      );
      return false;
    }
    seenUpdates.add(update.id);
    return true;
  });
  const seenEdges = new Set(
    context.existingEdges
      .filter((edge) => !edgeRemoved(edge))
      .map((edge) => {
        const update = update_edges.find(
          (candidate) => candidate.id === edge.id,
        );
        return edgeKey({
          ...edge,
          ...(update?.label !== undefined ? { label: update.label } : {}),
        });
      }),
  );
  const add_edges = result.add_edges.filter((edge) => {
    if (!known.has(edge.source) || !known.has(edge.target)) {
      warnings.push(`Ignored dangling edge: ${edge.source} → ${edge.target}`);
      return false;
    }
    const key = edgeKey(edge);
    if (seenEdges.has(key)) {
      warnings.push(`Ignored duplicate edge: ${edge.source} → ${edge.target}`);
      return false;
    }
    seenEdges.add(key);
    return true;
  });
  const update_nodes = result.update_nodes.filter((node) => {
    if (context.existingNodeIds.has(node.id) && !removed.has(node.id))
      return true;
    warnings.push(`Ignored update to unavailable node: ${node.id}`);
    return false;
  });
  return {
    result: {
      add_nodes,
      add_edges,
      update_nodes,
      remove_nodes: [...removed],
      remove_edges,
      ...(result.update_edges ? { update_edges } : {}),
    },
    warnings,
  };
}
