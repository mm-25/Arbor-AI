import { expect, it } from "vitest";
import { parseLayoutCommand, layoutDocument } from "./layout-command";
import { intranetFixture } from "./fixtures/intranet";
it("recognizes a direct scoped tidy command but does not act on discussion or negation", () => {
  expect(
    parseLayoutCommand(
      "Can you tidy up the graph, I am not able to understand the connections",
    ),
  ).toMatchObject({ scope: "all", direction: "AUTO", includesContent: false });
  expect(
    parseLayoutCommand("Please arrange the selected nodes top to bottom"),
  ).toMatchObject({ scope: "selection", direction: "TB" });
  for (const text of [
    "What does Tidy Up do?",
    "Don't tidy the map",
    "If we tidy the map, what changes?",
    "Can you explain how to tidy the map?",
    "Can you tidy the graph if I approve later?",
  ])
    expect(parseLayoutCommand(text), text).toBeNull();
});
it("separates a compound content request from a layout-only command", () => {
  expect(
    parseLayoutCommand("Tidy the graph and add a checkout step"),
  ).toMatchObject({ includesContent: true });
});
it("tidies only a selected branch while retaining the rest of the graph and all content", () => {
  const fixture = intranetFixture();
  fixture.nodes.forEach((n, i) => (n.position = { x: i * 320, y: 100 }));
  const untouched = fixture.nodes.find((n) => n.id === "site2")!;
  const result = layoutDocument(
    fixture.nodes,
    fixture.edges,
    { scope: "branch", direction: "TB", includesContent: false },
    ["hq"],
  );
  expect(result.nodes.find((n) => n.id === "site2")).toBe(untouched);
  expect(result.nodes.map((n) => n.data)).toEqual(
    fixture.nodes.map((n) => n.data),
  );
  expect(result.edges.map((e) => [e.id, e.source, e.target, e.label])).toEqual(
    fixture.edges.map((e) => [e.id, e.source, e.target, e.label]),
  );
});

it("does not fast-path qualified directions, delayed approval or unknown compound content", () => {
  for (const text of [
    "Tidy the map but not vertically",
    "Tidy the map only after I approve",
    "Tidy the map after tomorrow",
    "Tidy the map and invent an onboarding flow",
    "Tidy the map unless I object",
  ])
    expect(parseLayoutCommand(text), text).toBeNull();
  expect(
    parseLayoutCommand("Tidy the map and create a checkout step"),
  ).toMatchObject({ includesContent: true });
});

it("accepts the audited tidy request with its explanation of unreadable connections", () => {
  expect(
    parseLayoutCommand(
      "Can you tidy up the graph, I am not able to understand how the connections are being made, there are overlapping connector and also there isn't any alignment",
    ),
  ).toMatchObject({ scope: "all", includesContent: false });
});
