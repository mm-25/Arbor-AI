import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GENERATE_SYSTEM_PROMPT, GENERATE_FEW_SHOT, getFocusedNodeInstruction } from "@/lib/prompts";

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

    // Build existing node list prominently so the LLM can't miss them
    const existingNodeIds = new Set<string>();
    const existingNodeLabels = new Map<string, string>(); // label lowercase → id
    let graphContext = "Current graph: empty.";

    if (currentNodes?.length > 0) {
      const nodeList = currentNodes.map((n: NodeInfo) => {
        existingNodeIds.add(n.id);
        existingNodeLabels.set(n.data.label.toLowerCase(), n.id);
        return `  - ${n.id}: "${n.data.label}" (${n.data.type})`;
      });

      const edgeList = (currentEdges || []).map((e: EdgeInfo) =>
        `  - ${e.source} → ${e.target} [${e.label || ""}]`
      );

      graphContext = `EXISTING NODES ON CANVAS (DO NOT recreate these — reuse their IDs):\n${nodeList.join("\n")}\n\nEXISTING EDGES:\n${edgeList.join("\n")}`;
    }

    // Format conversation
    const conversationText = conversation
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "User" : "Assistant"}: "${m.content}"`
      )
      .join("\n");

    // Build focused node instruction if user selected a node
    const focusInstruction = focusedNode
      ? "\n\n" + getFocusedNodeInstruction(focusedNode)
      : "";

    // Include any attached document text as additional context
    const docSection = documentContext
      ? `\n\nATTACHED DOCUMENTS (use as context for generating nodes):\n${documentContext}`
      : "";

    const userPrompt = focusedNode
      ? `${graphContext}${docSection}\n\nConversation to analyze:\n${conversationText}\n\nGenerate new nodes that BRANCH FROM the focused node "${focusedNode.label}" (${focusedNode.id}). DO NOT recreate existing nodes.`
      : `${graphContext}${docSection}\n\nConversation to analyze:\n${conversationText}\n\nGenerate the map from this conversation. Remember: DO NOT create nodes that already exist on the canvas.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: GENERATE_SYSTEM_PROMPT + focusInstruction },
        ...GENERATE_FEW_SHOT,
        {
          role: "user",
          content: userPrompt,
        },
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

    const parsed = JSON.parse(content);

    // Ensure all arrays exist
    parsed.add_nodes = parsed.add_nodes || [];
    parsed.add_edges = parsed.add_edges || [];
    parsed.update_nodes = parsed.update_nodes || [];
    parsed.remove_nodes = parsed.remove_nodes || [];
    parsed.remove_edges = parsed.remove_edges || [];

    // POST-PROCESSING: Remove any duplicate nodes the AI created despite instructions
    if (parsed.add_nodes.length > 0 && currentNodes?.length > 0) {
      parsed.add_nodes = (parsed.add_nodes as AINode[]).filter((newNode) => {
        // Skip if ID already exists
        if (existingNodeIds.has(newNode.id)) return false;

        // Skip if a node with a very similar label already exists
        const newLabel = newNode.label.toLowerCase().trim();
        if (existingNodeLabels.has(newLabel)) {
          // Remap any edges that reference this duplicate to the existing node
          const existingId = existingNodeLabels.get(newLabel)!;
          if (parsed.add_edges) {
            parsed.add_edges = (parsed.add_edges as AIEdge[]).map((edge: AIEdge) => ({
              ...edge,
              source: edge.source === newNode.id ? existingId : edge.source,
              target: edge.target === newNode.id ? existingId : edge.target,
            }));
          }
          return false;
        }

        return true;
      });
    }

    // POST-PROCESSING: Remove edges that reference non-existent nodes
    if (parsed.add_edges.length > 0) {
      const allNodeIds = new Set([
        ...existingNodeIds,
        ...(parsed.add_nodes as AINode[]).map((n: AINode) => n.id),
      ]);

      parsed.add_edges = (parsed.add_edges as AIEdge[]).filter(
        (edge: AIEdge) => allNodeIds.has(edge.source) && allNodeIds.has(edge.target)
      );

      // Remove duplicate edges (same source → target)
      const seenEdges = new Set<string>();
      parsed.add_edges = (parsed.add_edges as AIEdge[]).filter((edge: AIEdge) => {
        const key = `${edge.source}->${edge.target}`;
        if (seenEdges.has(key)) return false;
        seenEdges.add(key);
        return true;
      });
    }

    // POST-PROCESSING: Validate update_nodes — only keep entries with existing IDs
    if (parsed.update_nodes.length > 0) {
      parsed.update_nodes = (parsed.update_nodes as AIUpdateNode[]).filter(
        (u: AIUpdateNode) => existingNodeIds.has(u.id)
      );
    }

    // POST-PROCESSING: Validate remove_nodes — only keep entries with existing IDs
    if (parsed.remove_nodes.length > 0) {
      parsed.remove_nodes = (parsed.remove_nodes as string[]).filter(
        (id: string) => existingNodeIds.has(id)
      );
    }

    // POST-PROCESSING: Validate remove_edges — only keep entries where both nodes exist
    if (parsed.remove_edges.length > 0) {
      parsed.remove_edges = (parsed.remove_edges as AIRemoveEdge[]).filter(
        (e: AIRemoveEdge) => existingNodeIds.has(e.source) && existingNodeIds.has(e.target)
      );
    }

    // Flag whether this response contains modifications to existing graph
    const has_changes =
      (parsed.update_nodes as AIUpdateNode[]).length > 0 ||
      (parsed.remove_nodes as string[]).length > 0 ||
      (parsed.remove_edges as AIRemoveEdge[]).length > 0;

    return NextResponse.json({ ...parsed, has_changes });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
