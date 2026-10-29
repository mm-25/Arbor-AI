import fs from "node:fs";
// @ts-expect-error jsdom is supplied by the test runtime without bundled declarations
import { JSDOM } from "jsdom";
import { expect, it, vi } from "vitest";
it("accepts a valid connector-only payload through the actual plugin input form", () => {
  const html = fs.readFileSync(
    new URL("../../figma-plugin/ui.html", import.meta.url),
    "utf8",
  );
  const dom = new JSDOM(html, { runScripts: "dangerously" });
  const input = dom.window.document.getElementById(
    "json-input",
  ) as HTMLTextAreaElement;
  const button = dom.window.document.getElementById(
    "import-btn",
  ) as HTMLButtonElement;
  const post = vi.fn();
  dom.window.parent.postMessage = post;
  const data = {
    appName: "Arbor AI",
    version: 1,
    nodes: [],
    edges: [
      {
        source: "",
        target: "",
        sourcePoint: { x: -40, y: 80 },
        targetPoint: { x: 320, y: 180 },
      },
    ],
  };
  input.value = JSON.stringify(data);
  input.dispatchEvent(new dom.window.Event("input"));
  expect(button.disabled).toBe(false);
  button.click();
  expect(post).toHaveBeenCalledWith(
    { pluginMessage: { type: "import", payload: data } },
    "*",
  );
  for (const edges of [
    [],
    [{ ...data.edges[0], targetPoint: { x: null, y: 80 } }],
  ]) {
    input.value = JSON.stringify({ ...data, edges });
    input.dispatchEvent(new dom.window.Event("input"));
    expect(button.disabled).toBe(true);
  }
  dom.window.close();
});
