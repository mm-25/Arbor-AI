import { NextRequest } from "next/server";
import { AIError, completeWithClaude } from "@/lib/claude";
import { parseConversation, parseGraph, graphContext, errorResponse, parseRequestBody } from "@/lib/ai-contract";

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
    const body = parseRequestBody(await request.json());
    const graph = parseGraph(body.nodes, body.edges);
    const conversation = body.conversation === undefined || (Array.isArray(body.conversation) && !body.conversation.length) ? [] : parseConversation(body.conversation);
    if (!graph.nodes.length && !conversation.length) throw new AIError("Provide a graph or conversation to generate a report.", 400);
    const response = await completeWithClaude({system: EXPORT_SYSTEM_PROMPT,
      messages: [{role: "user", content: JSON.stringify({graph: JSON.parse(graphContext(graph)), conversation})}], maxTokens: 4096});
    return Response.json({markdown: response.text, model: response.model, usage: response.usage});
  } catch (error) {return errorResponse(error);}
}
