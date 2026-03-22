"use client";

import { useCallback, useRef, useState } from "react";
import { useWireframeStore, type Wireframe } from "@/store/wireframe-store";
import { useChatStore } from "@/store/chat-store";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";

function WireframeCard({ wireframe, onDelete }: { wireframe: Wireframe; onDelete: () => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDownloadPng = useCallback(async () => {
    if (!iframeRef.current?.contentDocument?.body) return;

    try {
      // Get the content div inside iframe
      const contentEl = iframeRef.current.contentDocument.body.firstElementChild as HTMLElement;
      if (!contentEl) return;

      const dataUrl = await toPng(contentEl, {
        backgroundColor: "#ffffff",
        width: 1024,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `${wireframe.title.replace(/\s+/g, "-").toLowerCase()}-wireframe.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export wireframe as PNG:", err);
    }
  }, [wireframe.title]);

  const handleDelete = useCallback(() => {
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  }, [confirmDelete, onDelete]);

  const createdDate = new Date(wireframe.createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Build full HTML document for the iframe
  const iframeDoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; }
  * { box-sizing: border-box; }
</style>
</head>
<body>
${wireframe.html}
</body>
</html>`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-gray-50">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 truncate">
            {wireframe.title}
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {createdDate} · {wireframe.sourceNodeIds.length} node{wireframe.sourceNodeIds.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Live HTML preview */}
      <div className="relative bg-white" style={{ height: "400px" }}>
        <iframe
          ref={iframeRef}
          srcDoc={iframeDoc}
          title={wireframe.title}
          className="w-full h-full border-0"
          sandbox="allow-same-origin"
        />
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPng}
          className="text-[11px] h-7 gap-1.5"
        >
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PNG
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          className={`text-[11px] h-7 ${
            confirmDelete
              ? "text-red-600 border-red-300 hover:bg-red-50"
              : "text-gray-500 hover:text-red-500"
          }`}
        >
          {confirmDelete ? "Confirm Delete?" : "Delete"}
        </Button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b bg-gray-50">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-2.5 w-20 bg-gray-100 rounded animate-pulse mt-1.5" />
      </div>
      <div className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin text-blue-500"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <span className="text-sm text-gray-400">Generating wireframe...</span>
        </div>
      </div>
      <div className="px-3 py-2 border-t bg-gray-50">
        <div className="h-7 w-full bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function DesignView() {
  const { wireframes, isGenerating, removeWireframe } = useWireframeStore();
  const { saveWireframesToSession } = useChatStore();

  const handleDelete = useCallback(
    (id: string) => {
      removeWireframe(id);
      const updated = useWireframeStore
        .getState()
        .wireframes;
      saveWireframesToSession(updated);
    },
    [removeWireframe, saveWireframesToSession]
  );

  return (
    <div className="w-full h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Wireframes</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {wireframes.length} wireframe{wireframes.length !== 1 ? "s" : ""} in this session
          </p>
        </div>

        {wireframes.length === 0 && !isGenerating ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              No wireframes yet
            </p>
            <p className="text-xs text-gray-400 max-w-xs">
              Right-click a node in the System view and select
              &ldquo;Generate Wireframe&rdquo; to get started.
            </p>
          </div>
        ) : (
          /* Grid of wireframe cards */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {isGenerating && <SkeletonCard />}
            {wireframes
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((wf) => (
                <WireframeCard
                  key={wf.id}
                  wireframe={wf}
                  onDelete={() => handleDelete(wf.id)}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
