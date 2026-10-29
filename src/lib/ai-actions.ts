import {
  useChatStore as chat,
  type MessageAttachment,
} from "@/store/chat-store";
import { useMindMapStore as graph } from "@/store/mindmap-store";
import {
  useProposalStore as proposals,
  type Proposal,
} from "@/store/proposal-store";
import { cleanSnapshot } from "./workspace";
import { parseLayoutCommand } from "./layout-command";
import type { GenerateResult } from "./generate-validation";

type Origin = NonNullable<Proposal["origin"]>;
const fingerprint = () => JSON.stringify(cleanSnapshot(graph.getState()));
const origin = (): Origin => ({
  sessionId: chat.getState().activeSessionId,
  epoch: chat.getState().sessionEpoch,
  graph: fingerprint(),
});
const sameMap = (from: Origin) =>
  from.sessionId === chat.getState().activeSessionId &&
  from.epoch === chat.getState().sessionEpoch;
const unchanged = (from: Origin) =>
  sameMap(from) && from.graph === fingerprint();
const conversation = () => chat.getState().getConversationForAPI();

async function request(path: string, body: unknown, from: Origin) {
  const abort = new AbortController();
  const stop = chat.subscribe(() => {
    if (!sameMap(from)) abort.abort();
  });
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: abort.signal,
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || `Request failed (${response.status}).`);
    return result;
  } finally {
    stop();
  }
}

/** Owns a whole turn, so UI rerenders cannot append the latest message twice. */
export async function sendChatTurn(
  text: string,
  attachments?: MessageAttachment[],
) {
  if (chat.getState().isLoading || chat.getState().isGenerating) return;
  chat.getState().addUserMessage(text, attachments);
  const from = origin();
  chat.getState().setLoading(true);
  chat.getState().setError(null);
  try {
    const result = await request(
      "/api/chat",
      {
        messages: conversation(),
        currentGraph: cleanSnapshot(graph.getState()),
      },
      from,
    );
    if (sameMap(from)) chat.getState().addAssistantMessage(result.message);
  } catch (error) {
    if (sameMap(from))
      chat
        .getState()
        .setError(
          error instanceof Error ? error.message : "Chat request failed.",
        );
  } finally {
    if (sameMap(from)) chat.getState().setLoading(false);
  }
}

export async function generateMap(
  text = "",
  focusedId?: string,
  attachments?: MessageAttachment[],
) {
  if (chat.getState().isGenerating || chat.getState().isLoading) return;
  if (text.trim() || attachments?.length)
    chat
      .getState()
      .addUserMessage(
        text.trim() || `[Attached ${attachments!.length} document(s)]`,
        attachments,
      );
  if (!chat.getState().messages.length) {
    chat.getState().setError("Start a conversation first, then generate.");
    return;
  }
  const instruction =
    text.trim() ||
    [...chat.getState().messages].reverse().find((m) => m.role === "user")
      ?.content ||
    "";
  const layout = parseLayoutCommand(instruction);
  // Layout owns the entire captured selection; the composer’s single focus
  // remains a separate hint for semantic expansion.
  const selectedIds = graph
    .getState()
    .nodes.filter((n) => n.selected)
    .map((n) => n.id);
  const layoutNodeIds = selectedIds.length
    ? selectedIds
    : focusedId
      ? [focusedId]
      : [];
  if (layout && !layout.includesContent) {
    if (!graph.getState().nodes.length) {
      chat
        .getState()
        .addAssistantMessage(
          graph.getState().edges.length
            ? "Free connectors keep their canvas positions. Drag either endpoint to rearrange them."
            : "There are no nodes to arrange yet. Add nodes or draw a connector on the canvas.",
        );
      return;
    }
    try {
      graph.getState().tidyGraph(layout, layoutNodeIds);
      chat
        .getState()
        .addAssistantMessage(
          "Arranged the map. Ideas, connections and chosen styles are unchanged. Undo restores the previous arrangement.",
        );
    } catch (error) {
      chat
        .getState()
        .setError(
          error instanceof Error
            ? error.message
            : "Could not arrange this selection.",
        );
    }
    return;
  }
  const from = origin();
  chat.getState().setGenerating(true);
  chat.getState().setError(null);
  try {
    const current = graph.getState();
    const focused = current.nodes.find((n) => n.id === focusedId);
    const diff: GenerateResult = await request(
      "/api/generate",
      {
        conversation: conversation(),
        currentNodes: current.nodes,
        currentEdges: current.edges,
        ...(focused && { focusedNode: { id: focused.id } }),
      },
      from,
    );
    if (!sameMap(from)) return;
    if (!unchanged(from)) {
      chat
        .getState()
        .setError(
          "The map changed while Claude was working. Generate again to use your latest edits.",
        );
      return;
    }
    if (
      ![
        diff.add_nodes,
        diff.add_edges,
        diff.update_nodes,
        diff.remove_nodes,
        diff.remove_edges,
        diff.update_edges,
      ].some((items) => items?.length)
    ) {
      if (layout) {
        graph.getState().tidyGraph(layout, layoutNodeIds);
        chat
          .getState()
          .addAssistantMessage(
            "Arranged the map. No content changes were needed.",
          );
      } else
        chat
          .getState()
          .addAssistantMessage(
            "The current map already covers this request; no graph changes were returned.",
          );
      return;
    }
    const proposal: Proposal = {
      ...diff,
      id: crypto.randomUUID(),
      status: "pending",
      origin: from,
      ...(layout ? { layout, layoutNodeIds } : {}),
    };
    if (
      diff.update_nodes.length ||
      diff.remove_nodes.length ||
      diff.remove_edges.length ||
      diff.update_edges?.length
    ) {
      proposals.getState().setPending(proposal);
      graph
        .getState()
        .setNodeHighlights(
          new Map([
            ...diff.update_nodes.map((n) => [n.id, "update"] as const),
            ...diff.remove_nodes.map((id) => [id, "remove"] as const),
          ]),
        );
      graph
        .getState()
        .setEdgeHighlights(
          new Map([
            ...diff.remove_edges.map(
              (e) =>
                [
                  e.id ?? `${e.source}->${e.target}`,
                  "remove" as const,
                ] as const,
            ),
            ...(diff.update_edges ?? []).map(
              (e) => [e.id, "update" as const] as const,
            ),
          ]),
        );
      chat
        .getState()
        .addAssistantMessage(
          `Review these changes: add ${diff.add_nodes.length} nodes and ${diff.add_edges.length} connections, update ${diff.update_nodes.length} nodes and ${diff.update_edges?.length ?? 0} connection labels, remove ${diff.remove_nodes.length} nodes and ${diff.remove_edges.length} connections.`,
          proposal.id,
        );
    } else {
      graph.getState().applyProposal(proposal);
      chat
        .getState()
        .addAssistantMessage(
          `Added ${diff.add_nodes.length} nodes and ${diff.add_edges.length} connections. Existing positions and styling are preserved.`,
        );
    }
  } catch (error) {
    if (sameMap(from))
      chat
        .getState()
        .setError(
          error instanceof Error ? error.message : "Generation failed.",
        );
  } finally {
    if (sameMap(from)) chat.getState().setGenerating(false);
  }
}

export function acceptProposal(): boolean {
  const proposal = proposals.getState().pending;
  if (!proposal) return false;
  if (!proposal.origin || !unchanged(proposal.origin)) {
    proposals.getState().clearPending();
    graph.getState().clearAllHighlights();
    chat
      .getState()
      .setError(
        "The map changed after this proposal. Generate again to use your latest edits.",
      );
    return false;
  }
  graph.getState().applyProposal(proposal);
  proposals.getState().clearPending();
  return true;
}
