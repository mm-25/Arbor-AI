"use client";

import { sendChatTurn, generateMap, acceptProposal } from "@/lib/ai-actions";
import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useChatStore, type MessageAttachment } from "@/store/chat-store";
import { useMindMapStore } from "@/store/mindmap-store";
import { useProposalStore } from "@/store/proposal-store";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import {
  processFile,
  isSupportedFile,
  isImageFile,
  formatFileSize,
  type Attachment,
} from "@/lib/file-utils";
import ReactMarkdown from "react-markdown";
import ProposalMessage from "./ProposalMessage";

const MIN_CHAT_WIDTH = 280;
const MAX_CHAT_WIDTH = 720;
const DEFAULT_CHAT_WIDTH = 384; // w-96

export default function ChatPanel() {
  const [input, setInput] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Resize drag handle ────────────────────────────────────────────────────
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = chatWidth;

      const onMove = (moveEvent: MouseEvent) => {
        const delta = startX - moveEvent.clientX; // dragging left = wider
        setChatWidth(
          Math.min(
            MAX_CHAT_WIDTH,
            Math.max(MIN_CHAT_WIDTH, startWidth + delta),
          ),
        );
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [chatWidth],
  );

  // ── Copy message to clipboard ─────────────────────────────────────────────
  const handleCopyMessage = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  }, []);

  // File attachments for the current message being composed
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>(
    [],
  );
  const [attachError, setAttachError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const {
    isRecording,
    isTranscribing,
    transcript,
    error: speechError,
    startRecording,
    stopRecording,
    resetTranscript,
    clearError: clearSpeechError,
  } = useSpeechToText();

  // When recording stops and we have a transcript, insert it into the input
  useEffect(() => {
    if (!isRecording && transcript) {
      // Synchronize a completed external speech recording with the composer.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput((prev) => {
        const separator = prev.trim() ? " " : "";
        return (prev + separator + transcript).trim();
      });
      resetTranscript();
    }
  }, [isRecording, transcript, resetTranscript]);

  const handleMicToggle = useCallback(() => {
    clearSpeechError();
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording, clearSpeechError]);

  const { messages, isLoading, isGenerating, error, addAssistantMessage } =
    useChatStore();
  const { nodes, onNodesChange, clearAllHighlights } = useMindMapStore();
  const {
    pending: pendingProposal,
    clearPending,
    resolveProposal,
  } = useProposalStore();

  // Detect the first selected node as the "focused node"
  const focusedNode = nodes.find((n) => n.selected) || null;

  const handleDeselectNode = useCallback(() => {
    if (focusedNode) {
      onNodesChange([{ id: focusedNode.id, type: "select", selected: false }]);
    }
  }, [focusedNode, onNodesChange]);

  // Accept a pending proposal
  const handleAcceptProposal = useCallback(() => {
    acceptProposal();
  }, []);

  // Reject a pending proposal
  const handleRejectProposal = useCallback(() => {
    if (!pendingProposal) return;
    clearAllHighlights();
    resolveProposal("rejected");
    clearPending();
    addAssistantMessage("Got it — what would you like to change instead?");
  }, [
    pendingProposal,
    clearAllHighlights,
    resolveProposal,
    clearPending,
    addAssistantMessage,
  ]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  // ── File attachment handlers ──────────────────────────────────────────────
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setAttachError(null);
    const fileArray = Array.from(files);
    const unsupported = fileArray.filter(
      (f) => !isSupportedFile(f) || isImageFile(f),
    );
    if (unsupported.length > 0) {
      setAttachError(
        `Unsupported: ${unsupported.map((f) => f.name).join(", ")}. Use readable PDFs or text files.`,
      );
    }

    const supported = fileArray.filter(
      (f) => isSupportedFile(f) && !isImageFile(f),
    );
    for (const file of supported) {
      try {
        const attachment = await processFile(file);
        setPendingAttachments((prev) => [...prev, attachment]);
      } catch (err) {
        setAttachError(
          err instanceof Error ? err.message : "Failed to process file",
        );
      }
    }
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Drag-and-drop over the chat panel
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) setIsDraggingFile(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only leave if we're actually leaving the container (not entering a child)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setIsDraggingFile(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        // Reset the input so the same file can be re-selected
        e.target.value = "";
      }
    },
    [handleFiles],
  );

  const handleSend = useCallback(async () => {
    if (
      (!input.trim() && !pendingAttachments.length) ||
      isLoading ||
      isGenerating
    )
      return;
    const attachments: MessageAttachment[] = pendingAttachments.map((a) => ({
      id: a.id,
      type: a.type,
      name: a.name,
      mimeType: a.mimeType,
      size: a.size,
      ...(a.type === "document" && { textContent: a.data }),
    }));
    const text = input.trim() || `[Attached ${attachments.length} document(s)]`;
    setInput("");
    setPendingAttachments([]);
    setAttachError(null);
    await sendChatTurn(text, attachments);
  }, [input, pendingAttachments, isLoading, isGenerating]);

  const handleGenerate = useCallback(async () => {
    if (isGenerating || isLoading) return;
    const attachments: MessageAttachment[] = pendingAttachments.map((a) => ({
      id: a.id,
      type: a.type,
      name: a.name,
      mimeType: a.mimeType,
      size: a.size,
      ...(a.type === "document" && { textContent: a.data }),
    }));
    const text = input.trim();
    setInput("");
    setPendingAttachments([]);
    setAttachError(null);
    await generateMap(text, focusedNode?.id, attachments);
  }, [input, pendingAttachments, focusedNode?.id, isGenerating, isLoading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const lines = input.split("\n");
        const lastLine = lines[lines.length - 1];

        // Match list markers: "- ", "* ", "1. ", "a. ", "A. " etc.
        const bulletMatch = lastLine.match(/^(\s*)([-*])\s+/);
        const numMatch = lastLine.match(/^(\s*)(\d+)\.\s+/);
        const letterMatch = lastLine.match(/^(\s*)([a-zA-Z])\.\s+/);

        const match = bulletMatch || numMatch || letterMatch;

        if (match) {
          const fullMarker = match[0]; // e.g. "- " or "1. "
          const contentAfterMarker = lastLine.slice(fullMarker.length);

          if (contentAfterMarker.length > 0) {
            // User typed content — auto-insert the next marker
            e.preventDefault();
            let nextMarker: string;

            if (bulletMatch) {
              // Same bullet: "- " or "* "
              nextMarker = `${bulletMatch[1]}${bulletMatch[2]} `;
            } else if (numMatch) {
              // Increment number: "1. " → "2. "
              const nextNum = parseInt(numMatch[2], 10) + 1;
              nextMarker = `${numMatch[1]}${nextNum}. `;
            } else {
              // Increment letter: "a. " → "b. ", "A. " → "B. "
              const char = letterMatch![2];
              const nextChar = String.fromCharCode(char.charCodeAt(0) + 1);
              nextMarker = `${letterMatch![1]}${nextChar}. `;
            }

            setInput(input + "\n" + nextMarker);
            return;
          } else {
            // Empty marker only (e.g. just "- " with nothing after)
            // Remove the marker line and stop — don't send
            e.preventDefault();
            setInput(lines.slice(0, -1).join("\n"));
            return;
          }
        }

        e.preventDefault();
        handleSend();
      }
    },
    [handleSend, input],
  );

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm border rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow text-sm font-medium text-gray-600"
      >
        Show Chat
      </button>
    );
  }

  return (
    <div
      className="absolute top-4 right-4 bottom-4 z-10 bg-white/95 backdrop-blur-sm border rounded-xl shadow-lg flex flex-col"
      data-canvas-panel="right"
      style={{ width: chatWidth }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Resize drag handle — left edge */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="absolute left-0 top-2 bottom-2 w-1 cursor-ew-resize rounded-full hover:bg-blue-400/50 transition-colors z-10 group"
        title="Drag to resize"
      />
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-semibold text-gray-700">Arbor AI</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
          title="Hide chat"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            <p className="font-medium text-gray-500 mb-1">
              Hi, I&apos;m Arbor AI
            </p>
            <p>
              Tell me about the system, flow, or process you&apos;re thinking
              about. I&apos;ll help you think through it.
            </p>
            <p className="mt-2 text-xs">
              When we&apos;re ready, hit <strong>Generate Map</strong> to
              visualize it.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            <div
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Wrap in group so copy button can react to hover */}
              <div className="group relative max-w-[85%]">
                <div
                  className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white rounded-br-md"
                      : "bg-gray-100 text-gray-800 rounded-bl-md"
                  }`}
                >
                  {/* Attachment previews in message */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {msg.attachments.map((att) => (
                        <div key={att.id}>
                          {att.type === "image" && att.previewUrl ? (
                            <img
                              src={att.previewUrl}
                              alt={att.name}
                              className="rounded-md max-h-20 max-w-[120px] object-cover border border-white/20"
                            />
                          ) : (
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] ${
                                msg.role === "user"
                                  ? "bg-blue-400/30"
                                  : "bg-gray-200"
                              }`}
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
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              {att.name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-1.5 last:mb-0">{children}</p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold">{children}</strong>
                      ),
                      em: ({ children }) => <em>{children}</em>,
                      ul: ({ children }) => (
                        <ul className="list-disc pl-4 mb-1.5 last:mb-0 space-y-0.5">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-4 mb-1.5 last:mb-0 space-y-0.5">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => <li>{children}</li>,
                      code: ({ children }) => (
                        <code
                          className={`px-1 py-0.5 rounded text-xs ${
                            msg.role === "user"
                              ? "bg-blue-400/30"
                              : "bg-gray-200"
                          }`}
                        >
                          {children}
                        </code>
                      ),
                      h1: ({ children }) => (
                        <p className="font-semibold mb-1">{children}</p>
                      ),
                      h2: ({ children }) => (
                        <p className="font-semibold mb-1">{children}</p>
                      ),
                      h3: ({ children }) => (
                        <p className="font-semibold mb-1">{children}</p>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Copy button — appears on hover, below the bubble */}
                <button
                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                  title="Copy message"
                  className={`absolute -bottom-5 ${msg.role === "user" ? "right-0" : "left-0"} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 py-0.5`}
                >
                  {copiedMsgId === msg.id ? (
                    <>
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <svg
                        width="11"
                        height="11"
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
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {/* Render proposal card if this message has a proposalId */}
            {msg.proposalId && pendingProposal?.id === msg.proposalId && (
              <ProposalMessage
                proposal={pendingProposal}
                onAccept={handleAcceptProposal}
                onReject={handleRejectProposal}
              />
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-3 py-2 text-sm text-gray-500">
              <span className="inline-flex gap-1">
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "0ms" }}
                >
                  ·
                </span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "150ms" }}
                >
                  ·
                </span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "300ms" }}
                >
                  ·
                </span>
              </span>
            </div>
          </div>
        )}

        {(error || speechError) && (
          <div className="text-xs text-red-500 bg-red-50 rounded-lg p-2">
            {speechError || error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Focused node pill */}
      {focusedNode && (
        <div className="px-3 py-1.5 border-t bg-purple-50 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-purple-700 min-w-0">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span className="font-medium truncate">
                Focused: {focusedNode.data.label}
              </span>
            </div>
            <button
              onClick={handleDeselectNode}
              className="text-purple-400 hover:text-purple-600 p-0.5 shrink-0"
              title="Remove focus"
            >
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Generate Map button */}
      {(messages.length > 0 ||
        input.trim().length > 0 ||
        pendingAttachments.length > 0) && (
        <div className="px-3 py-2 border-t shrink-0 flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || isLoading}
            className="flex-1 text-xs bg-green-600 hover:bg-green-700"
            size="sm"
          >
            {isGenerating
              ? "Generating..."
              : focusedNode
                ? `Expand "${focusedNode.data.label}"`
                : "Generate Map"}
          </Button>
        </div>
      )}

      {/* Recording / Transcribing indicator */}
      {(isRecording || isTranscribing) && (
        <div
          className={`px-3 py-1.5 border-t shrink-0 ${isTranscribing ? "bg-blue-50" : "bg-red-50"}`}
        >
          <div
            className={`flex items-center gap-2 text-xs ${isTranscribing ? "text-blue-600" : "text-red-600"}`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isTranscribing ? "bg-blue-400" : "bg-red-400"}`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isTranscribing ? "bg-blue-500" : "bg-red-500"}`}
              />
            </span>
            <span className="font-medium">
              {isTranscribing ? "Transcribing..." : "Recording..."}
            </span>
          </div>
        </div>
      )}

      {/* Pending attachment previews */}
      {pendingAttachments.length > 0 && (
        <div className="px-3 py-2 border-t shrink-0 bg-gray-50/50">
          <div className="flex flex-wrap gap-2">
            {pendingAttachments.map((att) => (
              <div key={att.id} className="relative group">
                {att.type === "image" && att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="h-14 w-14 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-14 px-2.5 flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-[11px] text-gray-600 max-w-[140px]">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-gray-400"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{att.name}</p>
                      <p className="text-[9px] text-gray-400">
                        {formatFileSize(att.size)}
                      </p>
                    </div>
                  </div>
                )}
                {/* Remove button */}
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] leading-none"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachment error */}
      {attachError && (
        <div className="px-3 py-1 shrink-0">
          <div className="text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1">
            {attachError}
            <button
              onClick={() => setAttachError(null)}
              className="ml-1 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t shrink-0">
        <div className="flex gap-2 items-end">
          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isGenerating}
            title="Attach a readable PDF or text file"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,application/pdf,.txt,.md,.json,.csv,.js,.jsx,.ts,.tsx,.py,.html,.css,.xml,.yaml,.yml,.sql,.sh,.toml,.log"
            className="hidden"
            onChange={handleFileInputChange}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your system or ask a question..."
            className="flex-1 resize-none rounded-lg border p-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 max-h-[120px]"
            rows={1}
            disabled={isLoading || isGenerating}
          />
          {/* Mic button */}
          <button
            onClick={handleMicToggle}
            disabled={isLoading || isGenerating || isTranscribing}
            title={
              isRecording
                ? "Stop recording"
                : isTranscribing
                  ? "Transcribing..."
                  : "Start voice input"
            }
            className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${
              isRecording
                ? "bg-red-500 border-red-500 text-white hover:bg-red-600"
                : isTranscribing
                  ? "bg-blue-100 border-blue-300 text-blue-400 cursor-wait"
                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="currentColor"
              >
                <rect x="1" y="1" width="10" height="10" rx="1" />
              </svg>
            ) : isTranscribing ? (
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
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="1" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <line x1="12" y1="17" x2="12" y2="21" />
                <line x1="8" y1="21" x2="16" y2="21" />
              </svg>
            )}
          </button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={
              (!input.trim() && pendingAttachments.length === 0) ||
              isLoading ||
              isGenerating
            }
            className="text-xs shrink-0"
          >
            Send
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          Enter to send · Attach files · Mic for voice
        </p>
      </div>

      {/* Drag-and-drop overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-20 bg-blue-500/10 backdrop-blur-[2px] border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg px-4 py-3 shadow-lg text-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto text-blue-500 mb-1"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-sm font-medium text-blue-700">Drop files here</p>
            <p className="text-[10px] text-gray-400">Images or text files</p>
          </div>
        </div>
      )}
    </div>
  );
}
