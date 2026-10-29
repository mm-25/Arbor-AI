"use client";

import { documentBounds } from "@/lib/connector-endpoints";
import MapFilePanel from "./MapFilePanel";
import { useState, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { toBlob } from "html-to-image";
import { useMindMapStore } from "@/store/mindmap-store";
import { useChatStore } from "@/store/chat-store";
import { graphToFigmaJSON, graphToMermaid } from "@/lib/figma-export";

type ExportTab = "report" | "png" | "figma" | "map";

export default function ExportDesignModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ExportTab>("report");
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pngExporting, setPngExporting] = useState(false);

  // Figma tab state
  const [figmaCopied, setFigmaCopied] = useState<"json" | "mermaid" | null>(
    null,
  );
  const [showMermaidPreview, setShowMermaidPreview] = useState(false);

  const { nodes, edges } = useMindMapStore();
  const hasFreeConnectors = edges.some(
    (edge) => edge.source === "" || edge.target === "",
  );
  const { getConversationForAPI } = useChatStore();

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/export-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes,
          edges,
          conversation: getConversationForAPI(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setMarkdown(data.markdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges, getConversationForAPI]);

  const handleCopy = useCallback(() => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [markdown]);

  const handleDownloadMd = useCallback(() => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "system-design.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [markdown]);

  const handleDownloadPng = useCallback(async () => {
    setPngExporting(true);
    setError(null);
    let originalTransform: string | undefined;
    let exportViewport: HTMLElement | null = null;

    try {
      const viewport = document.querySelector(
        ".react-flow__viewport",
      ) as HTMLElement | null;
      if (!viewport) {
        throw new Error("Could not find the diagram on the canvas.");
      }

      // Save the current viewport transform so we can restore it after
      originalTransform = viewport.style.transform;
      exportViewport = viewport;

      const padding = 60;
      const bounds = documentBounds(nodes, edges);
      const minX = bounds.x,
        minY = bounds.y;
      const graphWidth = bounds.width + padding * 2,
        graphHeight = bounds.height + padding * 2;

      // Use scale 1 so nodes render at their natural size
      const scale = 1;
      const translateX = -minX + padding;
      const translateY = -minY + padding;
      viewport.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

      // Wait for the browser to paint the new transform
      await new Promise((r) => setTimeout(r, 150));

      const blob = await toBlob(viewport, {
        backgroundColor: "#f9fafb",
        pixelRatio: 2,
        width: Math.ceil(graphWidth),
        height: Math.ceil(graphHeight),
        fontEmbedCSS: "",
        filter: (node) => {
          const classes = node.classList?.toString() || "";
          return (
            !classes.includes("react-flow__minimap") &&
            !classes.includes("react-flow__controls") &&
            !classes.includes("react-flow__attribution") &&
            !classes.includes("react-flow__panel") &&
            !classes.includes("react-flow__handle") &&
            !(
              node instanceof Element &&
              (node.hasAttribute("data-endpoint-control") ||
                node.getAttribute("aria-label") === "Adjust connector segment")
            )
          );
        },
      });

      // Restore original viewport transform
      viewport.style.transform = originalTransform;

      const a = document.createElement("a");
      if (!blob) throw new Error("Could not render the diagram image.");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = "arbor-ai-diagram.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export PNG");
    } finally {
      if (exportViewport && originalTransform !== undefined)
        exportViewport.style.transform = originalTransform;
      setPngExporting(false);
    }
  }, [nodes, edges]);

  // ── Figma export handlers ──────────────────────────────────────────────────

  const handleCopyFigmaJSON = useCallback(() => {
    const payload = graphToFigmaJSON(nodes, edges);
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setFigmaCopied("json");
    setTimeout(() => setFigmaCopied(null), 2000);
  }, [nodes, edges]);

  const handleCopyMermaid = useCallback(() => {
    const mermaid = graphToMermaid(nodes, edges);
    navigator.clipboard.writeText(mermaid);
    setFigmaCopied("mermaid");
    setTimeout(() => setFigmaCopied(null), 2000);
  }, [nodes, edges]);

  const handleDownloadJSON = useCallback(() => {
    const payload = graphToFigmaJSON(nodes, edges);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "arbor-ai-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[680px] h-[70vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-sm font-semibold text-gray-800">Export</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b shrink-0">
          <button
            onClick={() => setActiveTab("map")}
            className={`px-4 py-2 text-sm border-b-2 ${activeTab === "map" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"}`}
          >
            Editable map
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === "report"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Design Report
          </button>
          <button
            onClick={() => setActiveTab("png")}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === "png"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Diagram PNG
          </button>
          <button
            onClick={() => setActiveTab("figma")}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === "figma"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Figma
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {activeTab === "map" && <MapFilePanel />}
          {activeTab === "report" && (
            <>
              {!markdown && !isLoading && !error && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-3">
                    Generate a system design document from your mind map and
                    conversation with Arbor AI.
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    The AI will analyze both the graph structure and your chat
                    history to create a comprehensive design brief.
                  </p>
                  <button
                    onClick={handleGenerate}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Generate Design Document
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="animate-spin"
                    >
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    Generating design document...
                  </div>
                </div>
              )}

              {error && activeTab === "report" && (
                <div className="text-center py-8">
                  <p className="text-sm text-red-500 mb-3">{error}</p>
                  <button
                    onClick={handleGenerate}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {markdown && (
                <div className="prose prose-sm max-w-none text-gray-800">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-lg font-bold mt-4 mb-2 text-gray-900 first:mt-0">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base font-semibold mt-4 mb-1.5 text-gray-800">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-semibold mt-3 mb-1 text-gray-700">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 text-sm leading-relaxed">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 mb-2 space-y-0.5 text-sm">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 mb-2 space-y-0.5 text-sm">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-sm">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold">{children}</strong>
                      ),
                      code: ({ children }) => (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                          {children}
                        </code>
                      ),
                      hr: () => <hr className="my-3 border-gray-200" />,
                    }}
                  >
                    {markdown}
                  </ReactMarkdown>
                </div>
              )}
            </>
          )}

          {activeTab === "png" && (
            <div className="text-center py-8">
              {nodes.length === 0 && edges.length === 0 ? (
                <>
                  <p className="text-sm text-gray-500 mb-3">
                    No diagram on the canvas yet.
                  </p>
                  <p className="text-xs text-gray-400">
                    Generate a mind map first, then come back to export it as
                    PNG.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-3">
                    Download your mind map diagram as a high-resolution PNG
                    image.
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    The export captures all {nodes.length} nodes and{" "}
                    {edges.length} connections at 2x resolution.
                  </p>
                  {error && activeTab === "png" && (
                    <p className="text-sm text-red-500 mb-3">{error}</p>
                  )}
                  <button
                    onClick={handleDownloadPng}
                    disabled={pngExporting}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {pngExporting ? (
                      <>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="animate-spin"
                        >
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                          <path d="M12 2a10 10 0 0 1 10 10" />
                        </svg>
                        Exporting...
                      </>
                    ) : (
                      "Download PNG"
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === "figma" && (
            <div className="py-2">
              {nodes.length === 0 && edges.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-3">
                    No diagram on the canvas yet.
                  </p>
                  <p className="text-xs text-gray-400">
                    Generate a mind map first, then export it to Figma.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Summary */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"
                          fill="#F24E1E"
                        />
                        <path
                          d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"
                          fill="#FF7262"
                        />
                        <path
                          d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"
                          fill="#1ABCFE"
                        />
                        <path
                          d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"
                          fill="#0ACF83"
                        />
                        <path
                          d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"
                          fill="#A259FF"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {nodes.length} nodes, {edges.length} connections
                      </p>
                      <p className="text-xs text-gray-500">
                        Ready to export to Figma
                      </p>
                    </div>
                  </div>

                  {/* Option 1: Figma Plugin */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">
                          Figma Plugin Import
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Creates proper Figma frames with auto-layout and
                          connector arrows. Best for editable, structured
                          designs.
                        </p>
                      </div>
                    </div>
                    <div className="ml-8 space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopyFigmaJSON}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                        >
                          {figmaCopied === "json" ? (
                            <>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect
                                  x="9"
                                  y="9"
                                  width="13"
                                  height="13"
                                  rx="2"
                                  ry="2"
                                />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                              Copy for Figma Plugin
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleDownloadJSON}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 border hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          Download JSON
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        Open the Arbor AI Import plugin in Figma, paste the
                        copied JSON, and click Import. The plugin creates
                        frames, text labels, and connector arrows preserving
                        your graph structure.
                      </p>
                    </div>
                  </div>

                  {hasFreeConnectors && (
                    <p
                      role="status"
                      className="text-sm text-amber-800 bg-amber-50 p-3 rounded"
                    >
                      Mermaid requires node-attached connections. Use editable
                      map, PNG or Figma JSON to preserve free endpoints.
                    </p>
                  )}
                  {/* Option 2: FigJam / Mermaid */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">
                          Mermaid Diagram
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Copy as Mermaid.js syntax for FigJam, GitHub, Notion,
                          or any Mermaid-compatible tool.
                        </p>
                      </div>
                    </div>
                    <div className="ml-8 space-y-2">
                      <button
                        disabled={hasFreeConnectors}
                        onClick={handleCopyMermaid}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        {figmaCopied === "mermaid" ? (
                          <>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                                ry="2"
                              />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            Copy Mermaid Syntax
                          </>
                        )}
                      </button>

                      {/* Preview */}
                      <div className="mt-2">
                        <button
                          disabled={hasFreeConnectors}
                          onClick={() => setShowMermaidPreview((p) => !p)}
                          className="text-[10px] text-blue-500 hover:text-blue-600 font-medium inline-flex items-center gap-1"
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`transition-transform ${showMermaidPreview ? "rotate-90" : ""}`}
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                          {showMermaidPreview ? "Hide preview" : "Show preview"}
                        </button>
                        {showMermaidPreview && !hasFreeConnectors && (
                          <MermaidPreview code={graphToMermaid(nodes, edges)} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Setup instructions */}
                  <details className="text-xs text-gray-500 border-t pt-3">
                    <summary className="cursor-pointer font-medium text-gray-600 hover:text-gray-800">
                      How to set up the Figma plugin
                    </summary>
                    <ol className="mt-2 space-y-1.5 pl-4 list-decimal text-[11px] leading-relaxed">
                      <li>
                        Download the{" "}
                        <code className="bg-gray-100 px-1 rounded">
                          figma-plugin
                        </code>{" "}
                        folder from the Arbor AI project
                      </li>
                      <li>
                        In Figma, go to{" "}
                        <strong>
                          Plugins &rarr; Development &rarr; Import plugin from
                          manifest...
                        </strong>
                      </li>
                      <li>
                        Select the{" "}
                        <code className="bg-gray-100 px-1 rounded">
                          manifest.json
                        </code>{" "}
                        file from the downloaded folder
                      </li>
                      <li>
                        Run the plugin:{" "}
                        <strong>
                          Plugins &rarr; Development &rarr; Arbor AI Import
                        </strong>
                      </li>
                      <li>
                        Copy the JSON from here and paste it into the plugin
                      </li>
                    </ol>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with report actions */}
        {activeTab === "report" && markdown && (
          <div className="flex items-center justify-end gap-2 p-3 border-t shrink-0">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Regenerate
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copied ? "Copied!" : "Copy Markdown"}
            </button>
            <button
              onClick={handleDownloadMd}
              className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Download .md
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mermaid visual preview (rendered via iframe + CDN) ──────────────────────

function MermaidPreview({ code }: { code: string }) {
  const srcDoc = useMemo(() => {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return `<!DOCTYPE html>
<html><head>
<style>
  body { margin: 0; padding: 12px; background: #f9fafb; display: flex; flex-direction: column; gap: 8px; }
  .tabs { display: flex; gap: 4px; }
  .tab { padding: 4px 10px; font-size: 10px; font-family: -apple-system, sans-serif; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; color: #374151; font-weight: 500; }
  .tab.active { background: #3b82f6; color: #fff; border-color: #3b82f6; }
  #diagram { display: block; }
  #syntax { display: none; }
  pre { margin: 0; padding: 8px; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 10px; font-family: "SF Mono", monospace; overflow: auto; color: #374151; line-height: 1.6; white-space: pre-wrap; }
  .mermaid svg { max-width: 100%; height: auto; }
  .error { color: #ef4444; font-size: 11px; font-family: sans-serif; }
</style>
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
  try {
    const { svg } = await mermaid.render('mmd', ${JSON.stringify(code)});
    document.getElementById('diagram').innerHTML = svg;
  } catch (e) {
    document.getElementById('diagram').innerHTML = '<div class="error">Render error: ' + e.message + '</div>';
  }

  // Tab switching
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.target;
      document.getElementById('diagram').style.display = target === 'diagram' ? 'block' : 'none';
      document.getElementById('syntax').style.display = target === 'syntax' ? 'block' : 'none';
    });
  });
</script>
</head>
<body>
  <div class="tabs">
    <button class="tab active" data-target="diagram">Diagram</button>
    <button class="tab" data-target="syntax">Syntax</button>
  </div>
  <div id="diagram"></div>
  <div id="syntax"><pre>${escaped}</pre></div>
</body></html>`;
  }, [code]);

  return (
    <iframe
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50"
      style={{ height: 220 }}
      title="Mermaid diagram preview"
    />
  );
}
