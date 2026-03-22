import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompts";

// Text model (fast, no vision)
const TEXT_MODEL = "llama-3.3-70b-versatile";
// Vision model (handles images)
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

interface AttachmentPayload {
  id: string;
  type: "image" | "document";
  name: string;
  mimeType: string;
  /** base64 data URI for images; text content for documents */
  data: string;
}

interface MessagePayload {
  role: string;
  content: string;
  attachments?: AttachmentPayload[];
}

export async function POST(request: NextRequest) {
  try {
    const { messages, currentGraph } = await request.json();

    if (!messages?.length) {
      return NextResponse.json(
        { error: "No messages provided" },
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

    // Build context about existing graph
    const graphContext =
      currentGraph?.nodes?.length > 0
        ? `\n[Current canvas has ${currentGraph.nodes.length} nodes: ${currentGraph.nodes
            .map((n: { data: { label: string; type: string } }) => `${n.data.label} (${n.data.type})`)
            .join(", ")}]`
        : "\n[Canvas is currently empty]";

    // Check if ANY message in the conversation has image attachments
    let hasAnyImages = false;
    for (const m of messages as MessagePayload[]) {
      if (m.attachments?.some((a) => a.type === "image")) {
        hasAnyImages = true;
        break;
      }
    }

    // Choose model — use vision model if any message in conversation has images
    const model = hasAnyImages ? VISION_MODEL : TEXT_MODEL;

    // Build conversation messages for the API
    const apiMessages: Groq.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: CHAT_SYSTEM_PROMPT + graphContext,
      },
    ];

    // Process each message — build multimodal content for any user message with attachments
    for (const m of messages as MessagePayload[]) {
      if (m.role !== "user" || !m.attachments || m.attachments.length === 0) {
        // Plain text message (user or assistant)
        apiMessages.push({
          role: m.role as "user" | "assistant",
          content: m.content,
        });
        continue;
      }

      // User message WITH attachments — build multimodal content
      const imageAtts = m.attachments.filter((a) => a.type === "image");
      const docAtts = m.attachments.filter((a) => a.type === "document");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contentParts: any[] = [];

      // Add document text as context
      if (docAtts.length > 0) {
        const docContext = docAtts
          .map((d) => `--- ${d.name} ---\n${d.data}`)
          .join("\n\n");
        contentParts.push({
          type: "text",
          text: `[Attached documents]\n\n${docContext}\n\n---\n\n${m.content}`,
        });
      } else {
        contentParts.push({ type: "text", text: m.content });
      }

      // Add image attachments
      for (const img of imageAtts) {
        contentParts.push({
          type: "image_url",
          image_url: { url: img.data },
        });
      }

      apiMessages.push({ role: "user", content: contentParts });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: apiMessages,
      model,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: content });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
