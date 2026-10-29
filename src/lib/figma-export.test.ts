import { expect, it } from "vitest";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { graphToFigmaJSON, graphToMermaid } from "./figma-export";
const free = {
  id: "drawing",
  source: "",
  target: "",
  label: "free",
  data: { sourcePoint: { x: -40, y: 80 }, targetPoint: { x: 320, y: 180 } },
};
it("exports free endpoint coordinates without inventing Figma concepts", () => {
  const payload = graphToFigmaJSON([], [free]);
  expect(payload.nodes).toEqual([]);
  expect(payload.edges).toEqual([
    {
      source: "",
      target: "",
      label: "free",
      sourcePoint: { x: -40, y: 80 },
      targetPoint: { x: 320, y: 180 },
    },
  ]);
});
it("rejects a Mermaid export that cannot represent a free canvas endpoint", () => {
  expect(() => graphToMermaid([], [free])).toThrow(/free|attached/i);
});
it("hands free positions to native FigJam connectors when importing a zero-node drawing", async () => {
  const connectors: Record<string, unknown>[] = [];
  const ui: { onmessage?: (message: unknown) => Promise<void> } = {};
  const api = {
    ui,
    showUI() {},
    loadFontAsync: async () => {},
    createConnector() {
      const value = { text: {} };
      connectors.push(value);
      return value;
    },
    group() {
      return {};
    },
    currentPage: {},
    viewport: { scrollAndZoomIntoView() {} },
    notify() {},
    closePlugin() {},
  };
  {
    const source = fs.readFileSync(
      new URL("../../figma-plugin/code.ts", import.meta.url),
      "utf8",
    );
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.None,
      },
    }).outputText;
    vm.runInNewContext(compiled, { figma: api, __html__: "" });
    await ui.onmessage!({
      type: "import",
      payload: {
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
      },
    });
    expect(connectors).toHaveLength(1);
    expect(connectors[0].connectorStart).toEqual({
      position: { x: -40, y: 80 },
    });
    expect(connectors[0].connectorEnd).toEqual({
      position: { x: 320, y: 180 },
    });
  }
});
it("imports free arrows through the Figma Design vector fallback without node frames", async () => {
  const vectors: Record<string, unknown>[] = [];
  const ui: { onmessage?: (message: unknown) => Promise<void> } = {};
  const api = {
    ui,
    showUI() {},
    loadFontAsync: async () => {},
    createVector() {
      const value = { resize() {} };
      vectors.push(value);
      return value;
    },
    group() {
      return {};
    },
    currentPage: {},
    viewport: { scrollAndZoomIntoView() {} },
    notify() {},
    closePlugin() {},
  };
  const source = fs.readFileSync(
    new URL("../../figma-plugin/code.ts", import.meta.url),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
    },
  }).outputText;
  vm.runInNewContext(compiled, { figma: api, __html__: "" });
  await ui.onmessage!({
    type: "import",
    payload: {
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
    },
  });
  expect(vectors).toHaveLength(1);
  expect(vectors[0].vectorPaths).toHaveLength(2);
  expect(vectors[0].name).toBe("Free start → Free end");
});
