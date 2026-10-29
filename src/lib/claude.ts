import Anthropic from "@anthropic-ai/sdk";

export class AIError extends Error {
  constructor(message: string, public readonly status = 502) { super(message); }
}

interface CompletionInput {
  system: string;
  messages: {role: "user" | "assistant"; content: string}[];
  schema?: Record<string, unknown>;
  maxTokens?: number;
}

/** Server-only provider boundary. No automatic retries that can multiply spend. */
export async function completeWithClaude(input: CompletionInput) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new AIError("ANTHROPIC_API_KEY is not configured. Add it to .env.local and restart the server.", 503);
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
  const client = new Anthropic({apiKey, maxRetries: 0, timeout: 45_000, fetch: globalThis.fetch});
  try {
    const response = await client.messages.create({
      model, system: input.system, messages: input.messages,
      max_tokens: input.maxTokens ?? 4096,
      output_config: {effort: "medium", ...(input.schema && {format: {type: "json_schema", schema: input.schema}})},
    });
    // Record usage before rejecting partial output: those tokens are still billed.
    // Deliberately exclude prompts, source documents, credentials and response text.
    console.info("Claude usage", {model: response.model, input_tokens: response.usage.input_tokens, output_tokens: response.usage.output_tokens});
    if (response.stop_reason === "max_tokens") throw new AIError("Claude's response was truncated. Try a smaller change; the map has not been changed.");
    if (response.stop_reason !== "end_turn") throw new AIError("Claude did not finish a usable response. Please try again.");
    const text = response.content.filter(block => block.type === "text").map(block => block.text).join("\n").trim();
    if (!text) throw new AIError("Claude returned an empty response. Please try again.");
    return {text, model: response.model, usage: {input_tokens: response.usage.input_tokens, output_tokens: response.usage.output_tokens}};
  } catch (error) {
    if (error instanceof AIError) throw error;
    const kind = error instanceof Anthropic.APIConnectionTimeoutError ? "timeout"
      : error instanceof Anthropic.APIConnectionError ? "connection"
      : error instanceof Anthropic.APIError ? "http" : "unknown";
    const status = error instanceof Anthropic.APIError ? error.status ?? null : null;
    const rawRequestId = error instanceof Anthropic.APIError ? error.requestID : null;
    const requestId = rawRequestId && /^req_[a-zA-Z0-9_-]+$/.test(rawRequestId) ? rawRequestId : null;
    // Safe diagnostics identify the failure without logging provider bodies,
    // credentials, prompts, source content or generated text.
    console.warn("Claude request failed", {kind, status, requestId});
    if (kind === "timeout") throw new AIError("Claude took too long to respond. Try generating again or use a smaller request.", 504);
    if (kind === "connection") throw new AIError("Could not connect to Claude. Check the server connection and try again.", 503);
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) throw new AIError("Claude is rate limited or the account has reached its usage limit. Try again later.", 429);
      if (error.status === 401 || error.status === 403) throw new AIError("Claude rejected the configured credentials. Check the server's Anthropic key and account access.");
      if (error.status === 400 || error.status === 422) throw new AIError("Claude rejected the request format or options. Please report this error so the application request can be corrected.");
      if (error.status === 404) throw new AIError("The configured Claude model is unavailable. Check ANTHROPIC_MODEL on the server.", 503);
    }
    // Never return raw provider errors: they can contain request/source details.
    throw new AIError("Claude is temporarily unavailable. Please try again shortly. Your saved map is unchanged.", 503);
  }
}
