import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const EXPORT_SYSTEM_PROMPT = `You are a senior systems architect. Your job is to produce a clear, well-structured system design document in Markdown format.

You will receive:
1. A mind map graph (nodes and edges representing a system)
2. A conversation between a user and their thinking mentor about the system

Your task: Synthesize BOTH the graph structure AND the conversation insights into a comprehensive system design document.

## DOCUMENT STRUCTURE

Produce the following sections:

### 1. Overview
A 2-3 sentence summary of what the system does and its primary purpose.

### 2. Actors & Components
List all actors, services, and key components. For each, provide a brief description of their role based on the conversation context.

### 3. Core Flows
Describe the main processes as step-by-step flows. Use numbered lists. Include the happy path and any alternative/error paths discussed.

### 4. Decision Points
List each decision/branching point in the system. For each, explain:
- The condition being evaluated
- What happens on each branch

### 5. Known Issues & Risks
Any problems, bottlenecks, or risks identified in the graph (problem nodes) or discussed in conversation.

### 6. Open Questions
Any unresolved topics from the conversation that need further exploration.

## RULES

- Write in clear, professional language
- Use the conversation for CONTEXT and REASONING — it often contains "why" behind the design
- Use the graph for STRUCTURE — it shows the concrete nodes and connections
- If the conversation discussed something not on the graph, include it in "Open Questions"
- If the graph has elements not discussed in conversation, still include them but note they need further definition
- Use proper Markdown: headers, bold, lists, code blocks where helpful
- Keep it concise but thorough — aim for a document someone could hand off to an engineer`;

export async function POST(request: NextRequest) {
  try {
    const { nodes, edges, conversation } = await request.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      );
    }

    if ((!nodes || nodes.length === 0) && (!conversation || conversation.length === 0)) {
      return NextResponse.json(
        { error: "Need at least a graph or conversation to generate a design document" },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });

    // Format graph context
    let graphSection = "## Graph\nNo nodes on the canvas yet.";
    if (nodes?.length > 0) {
      const nodeList = nodes
        .map((n: { id: string; data: { label: string; type: string } }) =>
          `- **${n.data.label}** (${n.data.type}) [id: ${n.id}]`
        )
        .join("\n");

      const edgeList = (edges || [])
        .map((e: { source: string; target: string; label?: string }) =>
          `- ${e.source} → ${e.target}${e.label ? ` [${e.label}]` : ""}`
        )
        .join("\n");

      graphSection = `## Graph\n\n### Nodes (${nodes.length}):\n${nodeList}\n\n### Connections (${(edges || []).length}):\n${edgeList}`;
    }

    // Format conversation
    let conversationSection = "## Conversation\nNo conversation history.";
    if (conversation?.length > 0) {
      const convoText = conversation
        .map((m: { role: string; content: string }) =>
          `**${m.role === "user" ? "User" : "MapMind"}**: ${m.content}`
        )
        .join("\n\n");
      conversationSection = `## Conversation\n\n${convoText}`;
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: EXPORT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `${graphSection}\n\n---\n\n${conversationSection}\n\n---\n\nGenerate the system design document in Markdown.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 4096,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ markdown: content });
  } catch (error) {
    console.error("Export design error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
