import { useMindMapStore as graph } from "@/store/mindmap-store";
import { useChatStore as chat } from "@/store/chat-store";
import { connectionHandles } from "./edge-routing";

/** A connector gesture belongs to the map activation where its source was chosen. */
export function connectNodes(
  source: string,
  target: string,
  epoch: number,
): boolean {
  if (epoch !== chat.getState().sessionEpoch) return false;
  const { nodes, onConnect } = graph.getState();
  if (
    !nodes.some((n) => n.id === source) ||
    !nodes.some((n) => n.id === target)
  )
    return false;
  onConnect({ source, target, ...connectionHandles(nodes, source, target) });
  return true;
}

import {
  connectionFromEndpoints,
  type ConnectorEndpoint,
} from "./connector-endpoints";
export function connectEndpoints(
  source: ConnectorEndpoint,
  target: ConnectorEndpoint,
  epoch: number,
): boolean {
  if (epoch !== chat.getState().sessionEpoch) return false;
  const connection = connectionFromEndpoints(
    source,
    target,
    graph.getState().nodes,
  );
  if (!connection) return false;
  const before = graph.getState().edges.length;
  graph.getState().onConnect(connection);
  return graph.getState().edges.length > before;
}
