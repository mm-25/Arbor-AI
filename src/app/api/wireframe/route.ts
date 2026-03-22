import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const WIREFRAME_SYSTEM_PROMPT = `You are a UI/UX wireframe generator. Your job is to create a low-fidelity wireframe as self-contained HTML using Tailwind CSS.

You will receive:
1. Target node(s) — the system component(s) to create a wireframe for
2. Full graph context — all nodes and edges in the system design
3. Conversation context — discussion about the system

Your task: Generate a single self-contained HTML wireframe representing a UI screen for the target node(s).

## RULES

- Generate ONLY valid HTML — no explanations, no markdown, no code fences
- Use Tailwind CSS utility classes for all styling
- Include this CDN link at the very top: <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
- The wireframe should be LOW-FIDELITY: use gray/neutral colors, simple shapes
- Use these colors: bg-gray-50, bg-gray-100, bg-gray-200, bg-white, border-gray-300, text-gray-700, text-gray-500
- Accent color for primary actions: bg-blue-500, text-blue-600 (use sparingly)
- Include typical UI elements appropriate for the screen: navigation bars, forms, buttons, lists, cards, tables, modals
- Use placeholder text (e.g. "Lorem ipsum", "User Name", "email@example.com")
- Use Unicode symbols for icons: ☰ (menu), 🔍 (search), 👤 (user), ⚙️ (settings), ✕ (close), ← (back), → (forward), + (add), ✓ (check), ⬇ (download), 🔔 (notification)
- Wrap everything in a single <div> with max-width: 1024px and margin: auto
- Make it look like a realistic app screen, not just a list of elements
- Include realistic section structure: header/nav, main content area, possibly a sidebar or footer
- The wireframe should be responsive and look good at various widths
- DO NOT include any <script> tags
- DO NOT include any JavaScript
- Start your response with the <link> tag, then the HTML

Also provide a short title (2-4 words) for this wireframe on the very first line, followed by a newline, then the HTML.

Example first line format:
Login Page
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
<div style="max-width: 1024px; margin: auto;" class="...">
...
</div>`;

export async function POST(request: NextRequest) {
  try {
    const { targetNodes, allNodes, allEdges, conversation } =
      await request.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      );
    }

    if (!targetNodes || targetNodes.length === 0) {
      return NextResponse.json(
        { error: "No target nodes specified" },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });

    // Format target nodes
    const targetSection = targetNodes
      .map(
        (n: { id: string; label: string; type: string }) =>
          `- **${n.label}** (${n.type}) [id: ${n.id}]`
      )
      .join("\n");

    // Format full graph for context
    let graphSection = "No other nodes in the graph.";
    if (allNodes?.length > 0) {
      const nodeList = allNodes
        .map(
          (n: { id: string; data: { label: string; type: string } }) =>
            `- ${n.data.label} (${n.data.type}) [id: ${n.id}]`
        )
        .join("\n");

      const edgeList = (allEdges || [])
        .map(
          (e: { source: string; target: string; label?: string }) =>
            `- ${e.source} → ${e.target}${e.label ? ` [${e.label}]` : ""}`
        )
        .join("\n");

      graphSection = `Nodes:\n${nodeList}\n\nConnections:\n${edgeList}`;
    }

    // Format conversation
    let conversationSection = "No conversation history.";
    if (conversation?.length > 0) {
      const convoText = conversation
        .slice(-10) // Last 10 messages for context
        .map(
          (m: { role: string; content: string }) =>
            `${m.role === "user" ? "User" : "AI"}: ${m.content}`
        )
        .join("\n");
      conversationSection = convoText;
    }

    const userPrompt = `## Target Node(s) — Generate wireframe for:
${targetSection}

## Full System Graph Context:
${graphSection}

## Recent Conversation:
${conversationSection}

Generate the wireframe now. Remember: first line is the title, then the HTML.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: WIREFRAME_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      max_tokens: 4096,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    // Parse title from first line, rest is HTML
    const firstNewline = content.indexOf("\n");
    let title = "Wireframe";
    let html = content;

    if (firstNewline > 0 && firstNewline < 80) {
      const firstLine = content.slice(0, firstNewline).trim();
      // Check if the first line looks like a title (not HTML)
      if (!firstLine.startsWith("<")) {
        title = firstLine;
        html = content.slice(firstNewline + 1).trim();
      }
    }

    // Clean up any markdown code fences the model might have added
    html = html
      .replace(/^```html?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    return NextResponse.json({ html, title });
  } catch (error) {
    console.error("Wireframe generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
