import { expect, it } from "vitest";
import { parseMermaidToGraph } from "./mermaid-parser";

it("retains every node and edge in a chained process", () => {
  const graph = parseMermaidToGraph("flowchart LR\nreceive[Receive] --> pick[Pick] --> ship[Ship]");
  expect(graph.nodes.map(n => n.label)).toEqual(["Receive", "Pick", "Ship"]);
  expect(graph.edges).toEqual([{ source: "receive", target: "pick" }, { source: "pick", target: "ship" }]);
});

it("upgrades a bare reference with a later explicit shape even when its label matches", () => {
  const graph = parseMermaidToGraph("flowchart LR\nReady --> Done\nReady{Ready}\nDone((Done))");
  expect(graph.nodes.map(n => n.type)).toEqual(["diamond", "circle"]);
});

it("keeps arrows and semicolons inside quoted labels and labels each chained edge", () => {
  const graph = parseMermaidToGraph('flowchart LR; a["Input --> review; then act"] -->|ready| b{Go?} -- "later" --> c[Wait]');
  expect(graph.nodes.map(n => n.label)).toEqual(["Input --> review; then act", "Go?", "Wait"]);
  expect(graph.edges.map(e => e.label)).toEqual(["ready", "later"]);
});
