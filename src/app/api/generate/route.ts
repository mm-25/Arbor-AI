import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import {
  GENERATE_SYSTEM_PROMPT,
  GENERATE_FEW_SHOT,
  getFocusedNodeInstruction,
} from "@/lib/prompts";
import {
  runQualityValidation,
  normalizeLabel,
  type ValidationContext,
} from "@/lib/generate-validation";

// ── Types ──────────────────────────────────────────────────────────────────────

interface NodeInfo {
  id: string;
  data: { label: string; type: string };
}

interface EdgeInfo {
  source: string;
  target: string;
  label?: string;
}

interface AINode {
  id: string;
  label: string;
  type: string;
}

interface AIEdge {
  source: string;
  target: string;
  label?: string;
}

interface AIUpdateNode {
  id: string;
  label?: string;
  type?: string;
}

interface AIRemoveEdge {
  source: string;
  target: string;
}

interface GenerateResult {
  add_nodes: AINode[];
  add_edges: AIEdge[];
  update_nodes: AIUpdateNode[];
  remove_nodes: string[];
  remove_edges: AIRemoveEdge[];
}

// Valid shape types — anything else gets mapped to the closest match or "rectangle"
const VALID_TYPES = new Set(["circle", "rectangle", "diamond", "rounded-rect"]);

// Map common AI-invented types to valid shapes
const TYPE_ALIASES: Record<string, string> = {
  // Old semantic types (backwards compat)
  actor: "circle",
  process: "rectangle",
  decision: "diamond",
  outcome: "rounded-rect",
  problem: "rounded-rect",
  // Common LLM inventions
  start: "rounded-rect",
  end: "rounded-rect",
  start_end: "rounded-rect",
  terminal: "rounded-rect",
  input: "rectangle",
  output: "rounded-rect",
  input_output: "rectangle",
  io: "rectangle",
  action: "rectangle",
  step: "rectangle",
  event: "rounded-rect",
  entity: "circle",
  system: "circle",
  user: "circle",
  person: "circle",
  role: "circle",
  service: "circle",
  api: "circle",
  database: "rectangle",
  condition: "diamond",
  branch: "diamond",
  check: "diamond",
  gate: "diamond",
  state: "rounded-rect",
  result: "rounded-rect",
  milestone: "rounded-rect",
  goal: "rounded-rect",
  "rounded-rectangle": "rounded-rect",
  roundedrect: "rounded-rect",
  rounded_rect: "rounded-rect",
  rect: "rectangle",
  square: "rectangle",
  box: "rectangle",
  rhombus: "diamond",
};

// ── Schema validation & sanitization ───────────────────────────────────────────

/** Sanitize a node type — map aliases, default to rectangle */
function sanitizeNodeType(raw: unknown): string {
  if (typeof raw !== "string") return "rectangle";
  const lower = raw.toLowerCase().trim().replace(/\s+/g, "_");
  if (VALID_TYPES.has(lower)) return lower;
  return TYPE_ALIASES[lower] ?? "rectangle";
}

/** Sanitize a node ID — ensure it's a valid snake_case string */
function sanitizeNodeId(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  // Replace spaces/hyphens with underscores, strip non-word chars
  return raw.trim().replace(/[\s-]+/g, "_").replace(/[^\w]/g, "").toLowerCase();
}

/** Sanitize a label — trim, enforce length */
function sanitizeLabel(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  return raw.trim().slice(0, 100); // cap at 100 chars
}

/** Parse and validate the AI's JSON response into a clean GenerateResult */
function validateAndSanitize(raw: unknown): GenerateResult {
  const obj = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;

  // ── add_nodes ──
  const rawAddNodes = Array.isArray(obj.add_nodes) ? obj.add_nodes : [];
  const addNodes: AINode[] = [];
  const seenNodeIds = new Set<string>();

  for (const n of rawAddNodes) {
    if (typeof n !== "object" || n === null) continue;
    const rec = n as Record<string, unknown>;
    const id = sanitizeNodeId(rec.id);
    const label = sanitizeLabel(rec.label);
    if (!id || !label) continue;
    if (seenNodeIds.has(id)) continue; // skip duplicates
    seenNodeIds.add(id);
    addNodes.push({
      id,
      label,
      type: sanitizeNodeType(rec.type),
    });
  }

  // ── add_edges ──
  const rawAddEdges = Array.isArray(obj.add_edges) ? obj.add_edges : [];
  const addEdges: AIEdge[] = [];
  const seenEdges = new Set<string>();

  for (const e of rawAddEdges) {
    if (typeof e !== "object" || e === null) continue;
    const rec = e as Record<string, unknown>;
    const source = sanitizeNodeId(rec.source);
    const target = sanitizeNodeId(rec.target);
    if (!source || !target || source === target) continue; // skip self-loops
    const key = `${source}->${target}`;
    if (seenEdges.has(key)) continue; // skip duplicate edges
    seenEdges.add(key);
    const label = typeof rec.label === "string" && rec.label.trim() ? rec.label.trim() : undefined;
    addEdges.push({ source, target, ...(label ? { label } : {}) });
  }

  // ── update_nodes ──
  const rawUpdateNodes = Array.isArray(obj.update_nodes) ? obj.update_nodes : [];
  const updateNodes: AIUpdateNode[] = [];

  for (const u of rawUpdateNodes) {
    if (typeof u !== "object" || u === null) continue;
    const rec = u as Record<string, unknown>;
    const id = sanitizeNodeId(rec.id);
    if (!id) continue;
    const update: AIUpdateNode = { id };
    if (typeof rec.label === "string" && rec.label.trim()) update.label = rec.label.trim();
    if (rec.type !== undefined) update.type = sanitizeNodeType(rec.type);
    updateNodes.push(update);
  }

  // ── remove_nodes ──
  const rawRemoveNodes = Array.isArray(obj.remove_nodes) ? obj.remove_nodes : [];
  const removeNodes: string[] = rawRemoveNodes
    .map((id) => sanitizeNodeId(id))
    .filter((id): id is string => id !== null);

  // ── remove_edges ──
  const rawRemoveEdges = Array.isArray(obj.remove_edges) ? obj.remove_edges : [];
  const removeEdges: AIRemoveEdge[] = [];

  for (const e of rawRemoveEdges) {
    if (typeof e !== "object" || e === null) continue;
    const rec = e as Record<string, unknown>;
    const source = sanitizeNodeId(rec.source);
    const target = sanitizeNodeId(rec.target);
    if (!source || !target) continue;
    removeEdges.push({ source, target });
  }

  return { add_nodes: addNodes, add_edges: addEdges, update_nodes: updateNodes, remove_nodes: removeNodes, remove_edges: removeEdges };
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { conversation, currentNodes, currentEdges, focusedNode, documentContext } = await request.json();

    if (!conversation?.length) {
      return NextResponse.json(
        { error: "No conversation provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured. Add it to .env.local" },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });

    // ── Build context ──────────────────────────────────────────────────────────
    const hasExistingGraph = currentNodes?.length > 0;
    const isExpanding = hasExistingGraph && !!focusedNode;

    const existingNodeIds = new Set<string>();
    const existingNodeLabels = new Map<string, string>();
    let graphContext = "";

    if (hasExistingGraph) {
      const nodeList = currentNodes.map((n: NodeInfo) => {
        existingNodeIds.add(n.id);
        existingNodeLabels.set(n.data.label.toLowerCase(), n.id);
        return `  - ${n.id}: "${n.data.label}" (${n.data.type})`;
      });

      const edgeList = (currentEdges || []).map((e: EdgeInfo) =>
        `  - ${e.source} → ${e.target}${e.label ? ` [${e.label}]` : ""}`
      );

      graphContext = `EXISTING NODES ON CANVAS (DO NOT recreate these — reuse their IDs):\n${nodeList.join("\n")}\n\nEXISTING EDGES:\n${edgeList.join("\n")}`;
    }

    // Format conversation
    const conversationText = conversation
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "User" : "Assistant"}: "${m.content}"`
      )
      .join("\n");

    // Focus instruction
    const focusInstruction = focusedNode
      ? "\n\n" + getFocusedNodeInstruction(focusedNode)
      : "";

    // Document context
    const docSection = documentContext
      ? `\n\nATTACHED DOCUMENTS (use as context):\n${documentContext}`
      : "";

    // ── Build user prompt ──────────────────────────────────────────────────────
    let userPrompt: string;

    if (isExpanding) {
      userPrompt = `${graphContext}${docSection}\n\nConversation to analyze:\n${conversationText}\n\nGenerate a diagram that BRANCHES FROM the focused node "${focusedNode.label}" (${focusedNode.id}). Create NEW nodes that extend from it. Do NOT recreate existing nodes. Use existing node IDs in edges to connect new nodes to the existing graph.`;
    } else if (hasExistingGraph) {
      userPrompt = `${graphContext}${docSection}\n\nConversation to analyze:\n${conversationText}\n\nGenerate updates to the existing map. DO NOT create nodes that already exist — reuse their IDs in edges.`;
    } else {
      userPrompt = `${docSection ? docSection + "\n\n" : ""}Conversation to analyze:\n${conversationText}\n\nGenerate the diagram from this conversation.`;
    }

    // ── Call LLM ───────────────────────────────────────────────────────────────
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: GENERATE_SYSTEM_PROMPT + focusInstruction },
        ...GENERATE_FEW_SHOT,
        { role: "user", content: userPrompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    // ── Parse & validate ───────────────────────────────────────────────────────
    let parsed: GenerateResult;
    try {
      const rawJson = JSON.parse(content);
      parsed = validateAndSanitize(rawJson);
    } catch {
      console.error("Failed to parse AI JSON response:", content.slice(0, 500));
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 500 }
      );
    }

    // ── Post-processing: deduplication & edge validation ───────────────────────

    // For expansion: filter out nodes that already exist on canvas
    if (isExpanding || hasExistingGraph) {
      parsed.add_nodes = parsed.add_nodes.filter((n) => {
        if (existingNodeIds.has(n.id)) return false;

        // Semantic dedup: check if an existing node has the same label
        const labelKey = n.label.toLowerCase().trim();
        const normalized = normalizeLabel(n.label);

        for (const [existingLabel, existingId] of existingNodeLabels) {
          if (labelKey === existingLabel || normalizeLabel(existingLabel) === normalized) {
            // Remap edges referencing this duplicate to the existing node
            parsed.add_edges = parsed.add_edges.map((e) => ({
              ...e,
              source: e.source === n.id ? existingId : e.source,
              target: e.target === n.id ? existingId : e.target,
            }));
            return false;
          }
        }
        return true;
      });
    }

    // Build complete node ID set for edge validation
    const allNodeIds = new Set([
      ...existingNodeIds,
      ...parsed.add_nodes.map((n) => n.id),
    ]);

    // Validate edge endpoints exist
    parsed.add_edges = parsed.add_edges.filter(
      (e) => allNodeIds.has(e.source) && allNodeIds.has(e.target)
    );

    // For expansion: remove edges that already exist
    if (isExpanding) {
      const existingEdgeKeys = new Set(
        (currentEdges || []).map((e: EdgeInfo) => `${e.source}->${e.target}`)
      );
      parsed.add_edges = parsed.add_edges.filter(
        (e) => !existingEdgeKeys.has(`${e.source}->${e.target}`)
      );
    }

    // Fan-out limiter: cap outgoing edges per node at 4
    const outgoing = new Map<string, number>();
    // Count existing outgoing edges first
    if (hasExistingGraph) {
      for (const e of (currentEdges || []) as EdgeInfo[]) {
        outgoing.set(e.source, (outgoing.get(e.source) || 0) + 1);
      }
    }
    parsed.add_edges = parsed.add_edges.filter((e) => {
      const count = (outgoing.get(e.source) || 0) + 1;
      outgoing.set(e.source, count);
      return count <= 4;
    });

    // Validate update_nodes reference existing IDs
    parsed.update_nodes = parsed.update_nodes.filter(
      (u) => existingNodeIds.has(u.id)
    );

    // Validate remove_nodes reference existing IDs
    parsed.remove_nodes = parsed.remove_nodes.filter(
      (id) => existingNodeIds.has(id)
    );

    // Validate remove_edges reference existing node IDs
    parsed.remove_edges = parsed.remove_edges.filter(
      (e) => existingNodeIds.has(e.source) && existingNodeIds.has(e.target)
    );

    // ── Layer 3: Semantic quality validation ──────────────────────────────────
    const validationContext: ValidationContext = {
      existingNodeIds,
      existingEdges: (currentEdges || []) as EdgeInfo[],
      isExpanding,
      focusedNodeId: focusedNode?.id,
    };
    const { result: validated, warnings } = runQualityValidation(
      parsed,
      validationContext
    );
    parsed = validated;

    if (warnings.length > 0) {
      console.log("[Layer 3] Quality validation warnings:", warnings);
    }

    // ── Determine if this is a "change" proposal ──────────────────────────────
    const has_changes =
      parsed.update_nodes.length > 0 ||
      parsed.remove_nodes.length > 0 ||
      parsed.remove_edges.length > 0;

    return NextResponse.json({ ...parsed, has_changes });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
