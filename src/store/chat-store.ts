import { cleanSnapshot } from "@/lib/graph-snapshot";
import { create } from "zustand";
import type { MindMapNode, MindMapEdge } from "./mindmap-store";
import type { GraphSnapshot } from "./history-store";

/** Lightweight attachment metadata stored per message (no heavy data in localStorage) */
export interface MessageAttachment {
  id: string;
  type: "image" | "document";
  name: string;
  mimeType: string;
  size: number;
  /** For images: thumbnail data URI for display in chat history */
  previewUrl?: string;
  /** Readable source text is retained so follow-up reasoning survives reload. */
  textContent?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  proposalId?: string;
  /** Attachments sent with this message */
  attachments?: MessageAttachment[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  // Graph state associated with this chat
  graphNodes: MindMapNode[];
  graphEdges: MindMapEdge[];
  /** Retained opaquely for old saved maps; retired UI never executes this HTML. */
  wireframes?: unknown[];
  history?: { past: GraphSnapshot[]; future: GraphSnapshot[] };
  schemaVersion?: number;
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  // Current session
  activeSessionId: string | null;
  sessionEpoch: number;
  messages: ChatMessage[];
  sessions: ChatSession[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  storageError: string | null;

  // Message actions
  addUserMessage: (content: string, attachments?: MessageAttachment[]) => void;
  addAssistantMessage: (content: string, proposalId?: string) => void;
  setLoading: (loading: boolean) => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
  getConversationForAPI: () => { role: "user" | "assistant"; content: string; attachments?: {type: "document"; name: string; data: string}[] }[];

  // Session actions
  createNewChat: () => void;
  switchChat: (sessionId: string) => void;
  deleteChat: (sessionId: string) => void;
  renameChat: (sessionId: string, title: string) => void;
  loadSessions: () => void;

  // Graph persistence per chat
  saveGraphToSession: (nodes: MindMapNode[], edges: MindMapEdge[], history?: ChatSession["history"]) => void;
  getActiveSessionGraph: () => { nodes: MindMapNode[]; edges: MindMapEdge[] } | null;


}

const STORAGE_KEY = "mindmap-chat-sessions";
const ACTIVE_KEY = "mindmap-active-chat";

function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function saveSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  try {
    const previous = localStorage.getItem(STORAGE_KEY);
    if (previous) {
      try {decodeSessions(previous);} catch {
        // Preserve unreadable data before any explicit new-map save replaces it.
        localStorage.setItem(`${STORAGE_KEY}-recovery`, previous);
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    useChatStore.setState({storageError: null});
  } catch {
    useChatStore.setState({storageError: "Could not save locally. Keep this tab open, free browser storage, then make another edit to retry."});
  }
}

function decodeSessions(raw: string): ChatSession[] {
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error("Invalid saved maps");
  const isRecord = (item: unknown): item is Record<string, unknown> => !!item && typeof item === "object";
  const validGraph = (nodes: unknown, edges: unknown) => Array.isArray(nodes) && nodes.every(n => isRecord(n) && typeof n.id === "string" && isRecord(n.position) && typeof n.position.x === "number" && typeof n.position.y === "number" && isRecord(n.data) && typeof n.data.label === "string")
    && Array.isArray(edges) && edges.every(e => isRecord(e) && typeof e.id === "string" && typeof e.source === "string" && typeof e.target === "string");
  for (const session of value) {
    if (!isRecord(session) || typeof session.id !== "string" || !Array.isArray(session.messages) || !session.messages.every(m => isRecord(m) && (m.role === "user" || m.role === "assistant") && typeof m.content === "string") || !validGraph(session.graphNodes, session.graphEdges)) throw new Error("Invalid saved map");
    // Bad optional history cannot prevent recovery of an otherwise valid map.
    const h = session.history;
    if (h !== undefined && (!isRecord(h) || ![h.past, h.future].every(stack => Array.isArray(stack) && stack.every(snapshot => isRecord(snapshot) && validGraph(snapshot.nodes, snapshot.edges))))) delete session.history;
  }
  return value as ChatSession[];
}

function loadSessionsFromStorage(): ChatSession[] | null {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? decodeSessions(raw) : [];
  } catch {
    useChatStore.setState({storageError: "Could not read saved maps. Existing browser data has been retained. Keep this tab open while recovering it."});
    return null;
  }
}

function saveActiveId(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch { useChatStore.setState({storageError: "Could not save the active map locally."}); }
}

function loadActiveId(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
}

/** Derive title from first user message, truncated */
function deriveTitle(messages: ChatMessage[], currentTitle: string): string {
  // Don't override a user-set title (if it's not the default "New Chat" or auto-derived)
  if (currentTitle && currentTitle !== "New Chat") return currentTitle;
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New Chat";
  const text = firstUser.content.trim();
  return text.length > 40 ? text.slice(0, 40) + "..." : text;
}

/** Persist current messages into the session list */
function persistCurrentSession(
  sessions: ChatSession[],
  activeSessionId: string | null,
  messages: ChatMessage[]
): ChatSession[] {
  if (!activeSessionId) return sessions;

  const updated = sessions.map((s) =>
    s.id === activeSessionId
      ? {
          ...s,
          messages,
          title: deriveTitle(messages, s.title),
          updatedAt: Date.now(),
        }
      : s
  );

  saveSessions(updated);
  return updated;
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeSessionId: null,
  sessionEpoch: 0,
  messages: [],
  sessions: [],
  isLoading: false,
  isGenerating: false,
  error: null,
  storageError: null,

  addUserMessage: (content, attachments?) => {
    const message: ChatMessage = {
      id: `msg_${crypto.randomUUID()}`,
      role: "user",
      content,
      timestamp: Date.now(),
      ...(attachments && attachments.length > 0 && { attachments }),
    };
    const newMessages = [...get().messages, message];
    const sessions = persistCurrentSession(
      get().sessions,
      get().activeSessionId,
      newMessages
    );
    set({ messages: newMessages, sessions, error: null });
  },

  addAssistantMessage: (content, proposalId?) => {
    const message: ChatMessage = {
      id: `msg_${crypto.randomUUID()}`,
      role: "assistant",
      content,
      timestamp: Date.now(),
      ...(proposalId && { proposalId }),
    };
    const newMessages = [...get().messages, message];
    const sessions = persistCurrentSession(
      get().sessions,
      get().activeSessionId,
      newMessages
    );
    set({ messages: newMessages, sessions });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setError: (error) => set({ error }),

  clearChat: () => {
    get().createNewChat();
  },

  getConversationForAPI: () => {
    return get().messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.attachments?.some(a => a.type === "document" && a.textContent) && {
        attachments: m.attachments.filter(a => a.type === "document" && a.textContent).map(a => ({type: "document" as const, name: a.name, data: a.textContent!})),
      }),
    }));
  },

  createNewChat: () => {
    const newId = generateSessionId();
    const newSession: ChatSession = {
      id: newId,
      title: "New Chat",
      messages: [],
      graphNodes: [],
      graphEdges: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const sessions = [...get().sessions, newSession];
    saveSessions(sessions);
    saveActiveId(newId);
    set({
      activeSessionId: newId,
      sessionEpoch: get().sessionEpoch + 1,
      messages: [],
      sessions,
      error: null,
      isLoading: false,
      isGenerating: false,
    });
  },

  switchChat: (sessionId) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    if (!session) return;

    saveActiveId(sessionId);
    set({
      activeSessionId: sessionId,
      sessionEpoch: get().sessionEpoch + 1,
      messages: session.messages,
      error: null,
      isLoading: false,
      isGenerating: false,
    });
  },

  deleteChat: (sessionId) => {
    const { sessions, activeSessionId } = get();
    const updated = sessions.filter((s) => s.id !== sessionId);
    saveSessions(updated);

    if (activeSessionId === sessionId) {
      if (updated.length > 0) {
        const latest = updated.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        saveActiveId(latest.id);
        set({
          sessions: updated,
          activeSessionId: latest.id,
          sessionEpoch: get().sessionEpoch + 1,
          isLoading: false,
          isGenerating: false,
          messages: latest.messages,
          error: null,
        });
      } else {
        set({ sessions: updated });
        get().createNewChat();
      }
    } else {
      set({ sessions: updated });
    }
  },

  renameChat: (sessionId, title) => {
    const sessions = get().sessions.map((s) =>
      s.id === sessionId ? { ...s, title: title.trim() || "Untitled", updatedAt: Date.now() } : s
    );
    saveSessions(sessions);
    set({ sessions });
  },

  loadSessions: () => {
    const sessions = loadSessionsFromStorage();
    if (sessions === null) return;
    const savedActiveId = loadActiveId();

    if (sessions.length === 0) {
      get().createNewChat();
      return;
    }

    const activeSession =
      sessions.find((s) => s.id === savedActiveId) ||
      sessions.sort((a, b) => b.updatedAt - a.updatedAt)[0];

    saveActiveId(activeSession.id);
    set({
      sessions,
      activeSessionId: activeSession.id,
      sessionEpoch: get().sessionEpoch + 1,
      messages: activeSession.messages,
    });
  },

  saveGraphToSession: (nodes, edges, history) => {
    const { sessions, activeSessionId } = get();
    if (!activeSessionId) return;

    const snapshot = cleanSnapshot({nodes, edges});
    const updated = sessions.map((s) =>
      s.id === activeSessionId
        ? { ...s, graphNodes: snapshot.nodes, graphEdges: snapshot.edges, ...(history && {history}), schemaVersion: 2, updatedAt: Date.now() }
        : s
    );
    saveSessions(updated);
    set({ sessions: updated });
  },

  getActiveSessionGraph: () => {
    const { sessions, activeSessionId } = get();
    const session = sessions.find((s) => s.id === activeSessionId);
    if (!session) return null;
    return { nodes: session.graphNodes || [], edges: session.graphEdges || [] };
  },

}));
