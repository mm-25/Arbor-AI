import { useMindMapStore as graph } from "@/store/mindmap-store";
import { useChatStore as chat } from "@/store/chat-store";
import { useHistoryStore as history } from "@/store/history-store";
import { cleanSnapshot } from "./graph-snapshot";
export { cleanSnapshot } from "./graph-snapshot";
import { useProposalStore } from "@/store/proposal-store";

/** Synchronous session ownership avoids effect timing leaking one map into another. */
export function initializeWorkspace(): () => void {
  let restoring = false;
  let boundId: string | null = null;
  let lastContent = "";
  const save = () => {
    if (restoring || !boundId || chat.getState().activeSessionId !== boundId) return;
    const snapshot = cleanSnapshot(graph.getState());
    const {past, future} = history.getState();
    const serialized = JSON.stringify({snapshot, past, future});
    if (serialized === lastContent) return;
    lastContent = serialized;
    chat.getState().saveGraphToSession(snapshot.nodes, snapshot.edges, {
      past: past.slice(-50).map(cleanSnapshot), future: future.slice(-50).map(cleanSnapshot),
    });
  };
  const restore = () => {
    const {activeSessionId, sessions} = chat.getState();
    if (activeSessionId === boundId) return;
    restoring = true;
    boundId = activeSessionId;
    const session = sessions.find(s => s.id === boundId);
    useProposalStore.getState().clearPending();
    graph.getState().setNodesAndEdges(session?.graphNodes ?? [], session?.graphEdges ?? [], true);
    history.setState({past: session?.history?.past?.slice(-50) ?? [], future: session?.history?.future?.slice(-50) ?? [], _isDragging: false, _paused: false});
    lastContent = "";
    restoring = false;
  };
  const stopChat = chat.subscribe(restore);
  const stopGraph = graph.subscribe(save);
  const stopHistory = history.subscribe(save);
  restore();
  return () => {save(); stopChat(); stopGraph(); stopHistory();};
}
