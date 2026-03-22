"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useMindMapStore, type MindMapNode, type MindMapEdge } from "@/store/mindmap-store";
import { getLayoutedElements } from "@/lib/auto-layout";

interface AIDiff {
  add_nodes?: { id: string; label: string; type: string }[];
  add_edges?: { source: string; target: string; label?: string }[];
  clarification?: string;
}

export default function TextInputPanel() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const { nodes, edges, addNodesAndEdges, setNodesAndEdges } = useMindMapStore();

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: input.trim(),
          currentNodes: nodes,
          currentEdges: edges,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const diff: AIDiff = await response.json();

      if (diff.clarification) {
        setError(`AI needs clarification: ${diff.clarification}`);
        setLoading(false);
        return;
      }

      const newNodes: MindMapNode[] = (diff.add_nodes || []).map((n) => ({
        id: n.id,
        type: "mindMapNode",
        position: { x: 0, y: 0 },
        data: {
          label: n.label,
          type: n.type as MindMapNode["data"]["type"],
          source: "text" as const,
        },
      }));

      const newEdges: MindMapEdge[] = (diff.add_edges || []).map((e) => ({
        id: `edge_${e.source}_${e.target}_${Date.now()}`,
        source: e.source,
        target: e.target,
        type: "editable",
        label: e.label || "",
      }));

      if (newNodes.length === 0 && newEdges.length === 0) {
        setError("AI couldn't extract any nodes from your input. Try being more specific.");
        setLoading(false);
        return;
      }

      // Merge new with existing, then auto-layout all
      const allNodes = [...nodes, ...newNodes];
      const allEdges = [...edges, ...newEdges];
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(allNodes, allEdges);

      setNodesAndEdges(layoutedNodes, layoutedEdges);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [input, loading, nodes, edges, setNodesAndEdges]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm border rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow text-sm font-medium text-gray-600"
      >
        Show Text Input
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-10 w-80 bg-white/90 backdrop-blur-sm border rounded-xl shadow-lg flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Describe your system
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          Hide
        </button>
      </div>

      <div className="p-3 flex flex-col gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your flow, e.g.: 'The user submits a form, the system validates it, and if valid sends a confirmation email...'"
          className="w-full h-28 resize-none rounded-lg border p-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
          disabled={loading}
        />

        {error && (
          <div className="text-xs text-red-500 bg-red-50 rounded-lg p-2">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {loading ? "Thinking..." : "Cmd+Enter to send"}
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            className="text-xs"
          >
            {loading ? "Generating..." : "Generate"}
          </Button>
        </div>
      </div>
    </div>
  );
}
