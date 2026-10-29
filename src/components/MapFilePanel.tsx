"use client";
import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/store/chat-store";
import { useMindMapStore } from "@/store/mindmap-store";
import { useEditorStore } from "@/store/editor-store";
import { serializeGraph, parseGraphFile } from "@/lib/graph-file";
export default function MapFilePanel() {
  const [error, setError] = useState<string | null>(null),
    [status, setStatus] = useState("");
  const readId = useRef(0);
  useEffect(
    () => () => {
      readId.current++;
    },
    [],
  );
  return (
    <div className="space-y-4 p-6 text-sm">
      <p>
        Save an editable backup with the exact node positions, connections,
        styles and manual bends. This file contains the map; the conversation
        stays in Arbor.
      </p>
      <button
        className="rounded-lg bg-blue-600 text-white px-4 py-2"
        onClick={() => {
          const url = URL.createObjectURL(
            new Blob([serializeGraph(useMindMapStore.getState())], {
              type: "application/json",
            }),
          );
          const link = document.createElement("a");
          link.href = url;
          link.download = "arbor-ai-map.json";
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          setStatus("Map backup downloaded.");
        }}
      >
        Download editable map
      </button>
      <div className="border-t pt-4 space-y-2">
        <label className="block font-medium" htmlFor="import-map">
          Import a map backup
        </label>
        <p className="text-gray-600">
          Import replaces the current map. Undo restores its previous contents.
        </p>
        <input
          id="import-map"
          aria-label="Import map backup"
          type="file"
          accept=".json,application/json"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const input = event.target;
            const token = ++readId.current;
            const owner = useChatStore.getState();
            const currentRead = () =>
              token === readId.current &&
              owner.activeSessionId ===
                useChatStore.getState().activeSessionId &&
              owner.sessionEpoch === useChatStore.getState().sessionEpoch;
            setError(null);
            try {
              if (file.size > 20_000_000)
                throw new Error(
                  "This backup is too large to import (20 MB maximum).",
                );
              const text = await file.text();
              if (!currentRead()) return;
              const graph = parseGraphFile(text);
              useMindMapStore
                .getState()
                .setNodesAndEdges(graph.nodes, graph.edges);
              useEditorStore.getState().requestFit();
              setStatus(
                `Imported ${graph.nodes.length} nodes and ${graph.edges.length} connections.`,
              );
            } catch (error) {
              if (!currentRead()) return;
              setError(
                error instanceof Error
                  ? error.message
                  : "Could not import this map.",
              );
            }
            if (currentRead()) input.value = "";
          }}
        />
      </div>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="text-green-700">
          {status}
        </p>
      )}
    </div>
  );
}
