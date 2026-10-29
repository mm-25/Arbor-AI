// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import ExportDesignModal from "./ExportDesignModal";
import { useMindMapStore as graph } from "@/store/mindmap-store";
const image = vi.hoisted(() => ({
  toBlob: vi.fn(),
  toPng: vi.fn(async () => "data:image/png;base64,AA=="),
}));
vi.mock("html-to-image", () => image);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.querySelector(".react-flow__viewport")?.remove();
});
it("downloads a PNG blob for a zero-node map and restores the live canvas on success or failure", async () => {
  const viewport = document.createElement("div");
  viewport.className = "react-flow__viewport";
  viewport.style.transform = "translate(-40px, 12px) scale(0.5)";
  document.body.append(viewport);
  graph.setState({
    nodes: [],
    edges: [
      {
        id: "line",
        source: "",
        target: "",
        data: {
          sourcePoint: { x: -40, y: 80 },
          targetPoint: { x: 320, y: 180 },
        },
      },
    ],
  });
  const png = new Blob(["png"], { type: "image/png" });
  image.toBlob.mockResolvedValue(png);
  const create = vi.fn(() => "blob:test-png"),
    revoke = vi.fn();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: create,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revoke,
  });
  const downloads: string[] = [];
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloads.push(this.href);
  });
  render(<ExportDesignModal onClose={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Diagram PNG" }));
  fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));
  await waitFor(() => expect(downloads).toEqual(["blob:test-png"]));
  expect(create).toHaveBeenCalledWith(png);
  expect(viewport.style.transform).toBe("translate(-40px, 12px) scale(0.5)");
  image.toBlob.mockRejectedValueOnce(new Error("Image generation failed"));
  fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));
  await screen.findByText("Image generation failed");
  expect(viewport.style.transform).toBe("translate(-40px, 12px) scale(0.5)");
});
