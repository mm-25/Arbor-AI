import { expect, it } from "vitest";
import { fitViewport, nodeSize } from "./canvas-geometry";
it("fits all bounds inside the usable canvas even below 50 percent zoom", () => {
  const view = fitViewport(
    { x: -100, y: -200, width: 2000, height: 4000 },
    { width: 1200, height: 800 },
    { left: 240, right: 400 },
  );
  expect(view.zoom).toBeLessThan(0.5);
  expect(-100 * view.zoom + view.x).toBeGreaterThanOrEqual(264);
  expect(1900 * view.zoom + view.x).toBeLessThanOrEqual(776);
  expect(-200 * view.zoom + view.y).toBeGreaterThanOrEqual(24);
  expect(3800 * view.zoom + view.y).toBeLessThanOrEqual(776);
});
it("reserves enough square area for a long diamond label and honors actual measurements", () => {
  const n = {
    data: { label: "Who publishes content at each location?", type: "diamond" },
  };
  const size = nodeSize(n);
  expect(size.width).toBe(size.height);
  expect(size.width).toBeGreaterThan(160);
  expect(nodeSize({ ...n, measured: { width: 280, height: 290 } })).toEqual({
    width: 280,
    height: 290,
  });
});

it("keeps the lowest node clear of the bottom toolbars", () => {
  const bounds = { x: 0, y: 0, width: 200, height: 4000 };
  const viewport = fitViewport(
    bounds,
    { width: 1200, height: 800 },
    { left: 250, right: 400, bottom: 110 },
  );
  expect(viewport.y + bounds.height * viewport.zoom).toBeLessThanOrEqual(690);
});
