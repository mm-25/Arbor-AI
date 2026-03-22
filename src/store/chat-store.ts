import { create } from "zustand";
import type { MindMapNode, MindMapEdge } from "./mindmap-store";
import type { Wireframe } from "./wireframe-store";

/** Lightweight attachment metadata stored per message (no heavy data in localStorage) */
export interface MessageAttachment {
  id: string;
  type: "image" | "document";
  name: string;
  mimeType: string;
  size: number;
  /** For images: thumbnail data URI for display in chat history */
  previewUrl?: string;
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
  // Wireframes associated with this chat
  wireframes: Wireframe[];
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  // Current session
  activeSessionId: string | null;
  messages: ChatMessage[];
  sessions: ChatSession[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;

  // Message actions
  addUserMessage: (content: string, attachments?: MessageAttachment[]) => void;
  addAssistantMessage: (content: string, proposalId?: string) => void;
  setLoading: (loading: boolean) => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
  getConversationForAPI: () => { role: string; content: string; attachments?: MessageAttachment[] }[];

  // Session actions
  createNewChat: () => void;
  switchChat: (sessionId: string) => void;
  deleteChat: (sessionId: string) => void;
  renameChat: (sessionId: string, title: string) => void;
  loadSessions: () => void;

  // Graph persistence per chat
  saveGraphToSession: (nodes: MindMapNode[], edges: MindMapEdge[]) => void;
  getActiveSessionGraph: () => { nodes: MindMapNode[]; edges: MindMapEdge[] } | null;

  // Wireframe persistence per chat
  saveWireframesToSession: (wireframes: Wireframe[]) => void;
  getActiveSessionWireframes: () => Wireframe[];
}

const STORAGE_KEY = "mindmap-chat-sessions";
const ACTIVE_KEY = "mindmap-active-chat";

function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function saveSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function loadSessionsFromStorage(): ChatSession[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ChatSession[];
  } catch {
    return [];
  }
}

function saveActiveId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(ACTIVE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

function loadActiveId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
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
  messages: [],
  sessions: [],
  isLoading: false,
  isGenerating: false,
  error: null,

  addUserMessage: (content, attachments?) => {
    const message: ChatMessage = {
      id: `msg_${Date.now()}_user`,
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
      id: `msg_${Date.now()}_assistant`,
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
      ...(m.attachments && m.attachments.length > 0 && { attachments: m.attachments }),
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
      wireframes: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const sessions = [...get().sessions, newSession];
    saveSessions(sessions);
    saveActiveId(newId);
    set({
      activeSessionId: newId,
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
      messages: activeSession.messages,
    });
  },

  saveGraphToSession: (nodes, edges) => {
    const { sessions, activeSessionId } = get();
    if (!activeSessionId) return;

    const updated = sessions.map((s) =>
      s.id === activeSessionId
        ? { ...s, graphNodes: nodes, graphEdges: edges, updatedAt: Date.now() }
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

  saveWireframesToSession: (wireframes) => {
    const { sessions, activeSessionId } = get();
    if (!activeSessionId) return;

    const updated = sessions.map((s) =>
      s.id === activeSessionId
        ? { ...s, wireframes, updatedAt: Date.now() }
        : s
    );
    saveSessions(updated);
    set({ sessions: updated });
  },

  getActiveSessionWireframes: () => {
    const { sessions, activeSessionId } = get();
    const session = sessions.find((s) => s.id === activeSessionId);
    if (!session) return [];
    return session.wireframes || [];
  },
}));
