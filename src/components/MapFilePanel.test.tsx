// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import MapFilePanel from "./MapFilePanel";
import { useChatStore as chat } from "@/store/chat-store";
import { useMindMapStore as graph } from "@/store/mindmap-store";
const node = (id: string) => ({
  id,
  position: { x: 0, y: 0 },
  data: { label: id, type: "rectangle" as const, source: "manual" as const },
});
afterEach(cleanup);
it("rejects an import read that finishes after activating another map", async () => {
  chat.setState({ activeSessionId: "original", sessionEpoch: 400 });
  graph.setState({ nodes: [node("original")], edges: [] });
  render(<MapFilePanel />);
  let resolve!: (text: string) => void;
  const text = new Promise<string>((done) => {
    resolve = done;
  });
  fireEvent.change(screen.getByLabelText("Import map backup"), {
    target: { files: [{ size: 100, text: () => text }] },
  });
  act(() => {
    chat.setState({ activeSessionId: "other", sessionEpoch: 401 });
    graph.setState({ nodes: [node("other")], edges: [] });
  });
  await act(async () =>
    resolve(
      JSON.stringify({
        app: "Arbor AI",
        version: 1,
        graph: { nodes: [node("imported")], edges: [] },
      }),
    ),
  );
  expect(graph.getState().nodes.map((n) => n.id)).toEqual(["other"]);
});
it("does not commit an import after the import panel is closed", async () => {
  chat.setState({ activeSessionId: "original", sessionEpoch: 500 });
  graph.setState({ nodes: [node("original")], edges: [] });
  const view = render(<MapFilePanel />);
  let resolve!: (text: string) => void;
  const text = new Promise<string>((done) => {
    resolve = done;
  });
  fireEvent.change(screen.getByLabelText("Import map backup"), {
    target: { files: [{ size: 100, text: () => text }] },
  });
  view.unmount();
  await act(async () =>
    resolve(
      JSON.stringify({
        app: "Arbor AI",
        version: 1,
        graph: { nodes: [node("imported")], edges: [] },
      }),
    ),
  );
  expect(graph.getState().nodes.map((n) => n.id)).toEqual(["original"]);
});
