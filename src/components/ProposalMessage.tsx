"use client";

import { Button } from "@/components/ui/button";
import type { Proposal } from "@/store/proposal-store";
import { useMindMapStore } from "@/store/mindmap-store";

interface ProposalMessageProps {
  proposal: Proposal;
  onAccept: () => void;
  onReject: () => void;
}

export default function ProposalMessage({ proposal, onAccept, onReject }: ProposalMessageProps) {
  const nodes = useMindMapStore((s) => s.nodes);

  const getNodeLabel = (id: string) => {
    const node = nodes.find((n) => n.id === id);
    return node ? node.data.label : id;
  };

  const addCount = proposal.add_nodes.length;
  const updateCount = proposal.update_nodes.length;
  const removeCount = proposal.remove_nodes.length;
  const isPending = proposal.status === "pending";

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm space-y-2">
      <p className="font-semibold text-amber-800 text-xs uppercase tracking-wide">
        Proposed Changes
      </p>

      <div className="space-y-1">
        {addCount > 0 && (
          <div className="flex items-center gap-1.5 text-green-700">
            <span className="text-xs font-mono">+{addCount}</span>
            <span className="text-xs">
              new node{addCount > 1 ? "s" : ""}: {proposal.add_nodes.map((n) => n.label).join(", ")}
            </span>
          </div>
        )}

        {updateCount > 0 && (
          <div className="flex items-start gap-1.5 text-orange-700">
            <span className="text-xs font-mono shrink-0">~{updateCount}</span>
            <span className="text-xs">
              update{updateCount > 1 ? "s" : ""}:{" "}
              {proposal.update_nodes.map((u) => {
                const current = getNodeLabel(u.id);
                const changes = [];
                if (u.label && u.label !== current) changes.push(`"${current}" → "${u.label}"`);
                if (u.type) changes.push(`type → ${u.type}`);
                return changes.length > 0 ? changes.join(", ") : `"${current}"`;
              }).join("; ")}
            </span>
          </div>
        )}

        {removeCount > 0 && (
          <div className="flex items-center gap-1.5 text-red-700">
            <span className="text-xs font-mono">-{removeCount}</span>
            <span className="text-xs">
              remove{removeCount > 1 ? "s" : ""}: {proposal.remove_nodes.map(getNodeLabel).join(", ")}
            </span>
          </div>
        )}
      </div>

      {isPending ? (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={onAccept}
            className="text-xs bg-green-600 hover:bg-green-700 flex-1"
          >
            Accept Changes
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            className="text-xs flex-1"
          >
            Reject
          </Button>
        </div>
      ) : (
        <p className={`text-xs font-medium ${
          proposal.status === "accepted" ? "text-green-600" : "text-gray-500"
        }`}>
          {proposal.status === "accepted" ? "Changes applied" : "Changes rejected"}
        </p>
      )}
    </div>
  );
}
