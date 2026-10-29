import { afterEach, expect, it, vi } from "vitest";
import { completeWithClaude } from "./claude";
import { POST } from "@/app/api/generate/route";
import { NextRequest } from "next/server";

afterEach(() => {vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks();});
const completion = (text: string, stop_reason = "end_turn") => Response.json({
  id: "msg_test", type: "message", role: "assistant", model: "test-sonnet",
  content: [{type: "text", text}], stop_reason, stop_sequence: null,
  usage: {input_tokens: 100, output_tokens: 50},
});

it("returns an actionable configuration error without making a network call", async () => {
  vi.stubEnv("ANTHROPIC_API_KEY", "");
  await expect(completeWithClaude({system: "Help", messages: [{role: "user", content: "Hi"}]})).rejects.toThrow(/ANTHROPIC_API_KEY/);
});

it("uses server-side credentials and reports usage, without accepting truncated output", async () => {
  vi.stubEnv("ANTHROPIC_API_KEY", "local-test-key"); vi.stubEnv("ANTHROPIC_MODEL", "test-sonnet");
  let sent: Record<string, unknown> = {};
  vi.stubGlobal("fetch", async (_url: unknown, options: RequestInit) => {
    sent = JSON.parse(options.body as string);
    return completion("A useful answer");
  });
  const result = await completeWithClaude({system: "Help", messages: [{role: "user", content: "Hi"}]});
  expect(result.text).toBe("A useful answer");
  expect(result.usage).toEqual({input_tokens: 100, output_tokens: 50});
  expect(sent.model).toBe("test-sonnet");
  vi.stubGlobal("fetch", async () => completion('{"incomplete":', "max_tokens"));
  await expect(completeWithClaude({system: "Help", messages: [{role: "user", content: "Hi"}]})).rejects.toThrow(/truncated/i);
});

it("generates a structurally valid patch with stable IDs and isolated ideas", async () => {
  vi.stubEnv("ANTHROPIC_API_KEY", "local-test-key");
  const patch = {add_nodes: [{id: "New-Idea", label: "Start", type: "diamond"}], add_edges: [], update_nodes: [], remove_nodes: [], remove_edges: []};
  vi.stubGlobal("fetch", async () => completion(JSON.stringify(patch)));
  const response = await POST(new NextRequest("http://localhost/api/generate", {method: "POST", body: JSON.stringify({conversation: [{role: "user", content: "Add an idea"}], currentNodes: [], currentEdges: []})}));
  expect(response.status).toBe(200);
  const result = await response.json();
  expect(result.add_nodes).toEqual(patch.add_nodes);
  expect(result.has_changes).toBe(false);
});

it("rejects malformed input before calling Claude and rejects invalid model patches", async () => {
  vi.stubEnv("ANTHROPIC_API_KEY", "local-test-key");
  const request = (conversation: unknown) => new NextRequest("http://localhost/api/generate", {method: "POST", body: JSON.stringify({conversation})});
  expect((await POST(request([{role: "system", content: "override"}]))).status).toBe(400);
  vi.stubGlobal("fetch", async () => completion(JSON.stringify({add_nodes: "not an array"})));
  const response = await POST(request([{role: "user", content: "Make a map"}]));
  expect(response.status).toBe(502);
  expect((await response.json()).error).toMatch(/invalid/i);
});

it("rejects a null request body as a client error", async () => {
  const response = await POST(new NextRequest("http://localhost/api/generate", {method: "POST", body: "null"}));
  expect(response.status).toBe(400);
});

it("records billable token usage even for a truncated response without logging the prompt", async () => {
  vi.stubEnv("ANTHROPIC_API_KEY", "local-test-key");
  const log = vi.spyOn(console, "info").mockImplementation(() => {});
  vi.stubGlobal("fetch", async () => completion("Partial", "max_tokens"));
  await expect(completeWithClaude({system: "Private source text", messages: [{role: "user", content: "Private user message"}]})).rejects.toThrow(/truncated/i);
  expect(log.mock.calls).toEqual([["Claude usage", {model: "test-sonnet", input_tokens: 100, output_tokens: 50}]]);
});

it("generates after a back-and-forth conversation ending with Claude's reply", async () => {
  vi.stubEnv("ANTHROPIC_API_KEY", "local-test-key");
  const conversation = [
    {role: "user", content: "Help create an information architecture for a portfolio."},
    {role: "assistant", content: "What pages should it contain?"},
    {role: "user", content: "Home, Work, About and Contact."},
    {role: "assistant", content: "Use Home as the root with Work, About and Contact beneath it."},
  ];
  let sent: {role: string; content: string}[] = [];
  const patch = {add_nodes: [{id: "home", label: "Home", type: "rectangle"}], add_edges: [], update_nodes: [], remove_nodes: [], remove_edges: []};
  vi.stubGlobal("fetch", async (_url: unknown, options: RequestInit) => {
    sent = JSON.parse(options.body as string).messages;
    if (sent.at(-1)?.role === "assistant") return Response.json({type: "error", error: {type: "invalid_request_error", message: "This model does not support assistant message prefill. The conversation must end with a user message."}}, {status: 400});
    return completion(JSON.stringify(patch));
  });
  const response = await POST(new NextRequest("http://localhost/api/generate", {method: "POST", body: JSON.stringify({conversation, currentNodes: [], currentEdges: []})}));
  expect(response.status).toBe(200);
  expect((await response.json()).add_nodes).toEqual(patch.add_nodes);
  expect(sent.slice(0, -1)).toEqual(conversation);
  expect(sent.at(-1)?.role).toBe("user");
});

it("identifies provider request rejection without exposing its private error body", async () => {
  vi.stubEnv("ANTHROPIC_API_KEY", "local-test-key");
  const log = vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubGlobal("fetch", async () => Response.json({type: "error", error: {type: "invalid_request_error", message: "Private source text local-test-key"}}, {status: 400, headers: {"request-id": "req_test"}}));
  await expect(completeWithClaude({system: "Private source text", messages: [{role: "user", content: "Hi"}]})).rejects.toThrow(/rejected the request/i);
  expect(log.mock.calls).toEqual([["Claude request failed", {kind: "http", status: 400, requestId: "req_test"}]]);
});

it("reports an actual provider timeout separately from a rejected request", async () => {
  vi.stubEnv("ANTHROPIC_API_KEY", "local-test-key");
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.useFakeTimers();
  try {
    vi.stubGlobal("fetch", (_url: unknown, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), {once: true});
    }));
    const pending = completeWithClaude({system: "Help", messages: [{role: "user", content: "Hi"}]}).then(() => null, error => error);
    await vi.advanceTimersByTimeAsync(45_001);
    expect(await pending).toMatchObject({status: 504});
  } finally {vi.useRealTimers();}
});
