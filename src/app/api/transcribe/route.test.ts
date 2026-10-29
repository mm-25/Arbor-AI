import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

afterEach(() => vi.unstubAllEnvs());
it("starts without Groq credentials and returns an actionable error on voice use", async () => {
  vi.stubEnv("GROQ_API_KEY", "");
  const {POST} = await import("./route");
  const body = new FormData(); body.set("audio", new File(["sample"], "audio.webm"));
  const response = await POST(new NextRequest("http://localhost/api/transcribe", {method: "POST", body}));
  expect(response.status).toBe(503);
  expect((await response.json()).error).toMatch(/GROQ_API_KEY/);
});
