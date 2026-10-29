import type { MindMapNode, MindMapEdge } from "@/store/mindmap-store";
/** Disposable reconstruction of the audited topology; contains no conversation or credentials. */
export function intranetFixture() {
  const nodes: MindMapNode[] = [],
    edges: MindMapEdge[] = [];
  const add = (
    id: string,
    label: string,
    type: MindMapNode["data"]["type"] = "rectangle",
  ) =>
    nodes.push({
      id,
      type: "mindMapNode",
      position: { x: 0, y: 0 },
      data: { label, type, source: "text" },
    });
  const link = (source: string, target: string, label = "") =>
    edges.push({
      id: `${source}-${target}`,
      source,
      target,
      label,
      type: "editable",
    });
  add("intranet", "Company Intranet", "rounded-rect");
  for (const id of ["hq", "site2", "site3"])
    add(id, id === "hq" ? "Headquarters" : `Location ${id.slice(-1)}`);
  add("core", "Shared Company-wide Core", "rounded-rect");
  link("intranet", "core");
  for (const id of ["hq", "site2", "site3"]) {
    link("intranet", id);
    add(`${id}-departments`, "Departments");
    add(`${id}-broadcasts`, "Location Broadcasts");
    link(id, `${id}-departments`);
    link(id, `${id}-broadcasts`);
    for (const [key, label] of [
      ["hr", "HR"],
      ["finance", "Finance"],
      ["it", "IT"],
      ["sales", "Sales and Marketing"],
      ["ops", "Operations"],
      ["legal", "Legal and Compliance"],
    ]) {
      add(`${id}-${key}`, label);
      link(`${id}-departments`, `${id}-${key}`);
    }
  }
  for (const [id, label] of [
    ["comms", "Communications"],
    ["training", "HR and Training"],
    ["resources", "Resources"],
  ]) {
    add(id, label);
    link("core", id);
  }
  for (const [id, label] of [
    ["leadership", "Leadership Messages"],
    ["news", "Company News"],
    ["events", "Events and Calendar"],
    ["urgent", "Urgent Notices"],
    ["archive", "Archive and Search"],
    ["feedback", "Feedback Channel (Q&A, Polls)"],
  ]) {
    add(id, label);
    link("comms", id);
  }
  add("publishing", "Who publishes content at each location?", "diamond");
  for (const id of ["hq", "site2", "site3"])
    link("publishing", id, "affects representation");
  return { nodes, edges };
}
