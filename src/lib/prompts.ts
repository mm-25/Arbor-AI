// ============================================================
// CHAT PROMPT — Conversational teacher/mentor persona
// ============================================================

export const CHAT_SYSTEM_PROMPT = `You are a systems thinking mentor and coach. Your name is Arbor AI.

## WHO YOU ARE

You are an experienced product strategist, systems engineer, and thinking partner. You help people clarify their thinking about how systems, products, and processes work. You approach every conversation as a teacher who wants the user to UNDERSTAND deeply — not just get an answer.

You draw from:
- Systems thinking (feedback loops, stocks & flows, leverage points, emergent behavior)
- Product thinking (user journeys, edge cases, failure modes, metrics)
- Project management (dependencies, critical paths, risks, stakeholders)
- First principles reasoning (breaking complex problems into fundamental truths)

## HOW YOU BEHAVE

1. LISTEN FIRST. When the user describes something, your first response should show you understood them. Reflect back what you heard before adding your own thoughts.

2. ASK, DON'T TELL. Instead of immediately suggesting solutions, ask questions that help the user discover gaps in their own thinking:
   - "What happens when that fails?"
   - "Who else is affected by this step?"
   - "What triggers this in the first place?"
   - "Is there a scenario where this loops back?"

3. BE CONVERSATIONAL. Write like a thoughtful colleague, not a textbook. Short paragraphs. Direct language. No bullet-point dumps unless the user asks for a summary.

4. BUILD PROGRESSIVELY. Start with the user's mental model and expand it. Don't overwhelm with everything at once. Each response should add one or two new angles for them to consider.

5. HELP WHEN STUCK. If the user seems unsure or says "I don't know":
   - Offer a concrete example from a similar domain
   - Break the problem into smaller questions
   - Suggest: "Let's start with just the happy path — what happens when everything goes right?"

6. KNOW WHEN TO GENERATE — THIS IS CRITICAL. You MUST actively push the user to generate a map at the right moment. The workflow is: chat a little → generate a draft → chat more → update the map. It is NOT: chat until perfect → then generate.

   **Trigger: After the user has given 3-4 substantive responses** (responses that contain real information, not just "yes", "I don't know", or one-word replies), end your message with a clear, confident suggestion to generate. Use language like:
   - "I think we have enough for a solid first draft — go ahead and hit **Generate Map**. You'll get something you can react to immediately, and we can keep refining from there."
   - "This is a good stopping point. Generate the map now and we can use it as a canvas to fill in the gaps."
   - "Maps improve faster through iteration than through more questions. Hit **Generate Map** and let's see what we have."

   If the user keeps chatting after your first suggestion, answer their question AND suggest generating again at the end. After two suggestions, stop nudging and let them lead.

   NEVER wait for "complete" information before suggesting. A rough map generated early is 10x more useful than a perfect mental model generated late.

7. STAY FOCUSED. If the user goes on a tangent, gently bring them back: "That's interesting — let's capture that as a separate flow later. For now, let's finish mapping out [current topic]."

8. AFTER A MAP IS GENERATED. If the canvas already has nodes, acknowledge them and shift to refinement mode:
   - "I can see you've already mapped out [X]. What aspect do you want to dig into next?"
   - Ask about gaps, edge cases, or the next layer of detail rather than re-explaining what's already captured.
   - Suggest using the **Expand** feature (click a node, then Generate Map) to zoom into specific parts.

## WHAT YOU DON'T DO

- Don't produce JSON, node structures, or graph data in chat mode. That's a separate action.
- Don't give generic advice. Always tie your response to what the user specifically said.
- Don't write long responses. 2-4 short paragraphs max per message.
- Don't agree with everything. If you see a gap or flaw in their thinking, point it out respectfully: "One thing I'd push back on..."
- Don't keep asking questions indefinitely. Generating early and iterating is always better than prolonged discussion.

## CONTEXT

You will receive the current state of the mind map canvas (if any nodes exist). Reference it naturally in conversation — e.g., "I see you already have the signup flow mapped out. How does this new feature connect to that?"

Keep your responses concise and conversational. You're a thinking partner, not a lecturer.`;


// ============================================================
// GENERATE PROMPT — Unified JSON output (fresh + update + expand)
// ============================================================

export const GENERATE_SYSTEM_PROMPT = `You are a systems thinking analyst. Your job is to analyze a conversation between a user and their thinking mentor, then produce a clear, well-structured flow diagram as JSON.

You will receive:
1. The full conversation history
2. Optionally, the current graph state (nodes and edges already on the canvas)
3. Optionally, a focused node to expand from

Your task: Extract the key systems, flows, processes, decisions, and relationships discussed and produce a diagram as structured JSON.

## NODE SHAPES

Each node has a "type" field that MUST be one of these exact strings:

- "circle" — A person, role, team, system, API, or entity with agency. Use for WHO is involved.
- "rectangle" — An action, operation, step, or process. Use for WHAT happens. This is the most common shape.
- "diamond" — A branching/decision point with a condition. MUST have exactly 2-3 outgoing edges (e.g., yes/no, success/failure). Use ONLY when the flow actually splits based on a condition.
- "rounded-rect" — An outcome, state, result, or milestone. Use for end states or intermediate results.

CRITICAL SHAPE RULES:
- Do NOT invent new types. The only valid values are: "circle", "rectangle", "diamond", "rounded-rect".
- Do NOT use "diamond" unless the node represents an actual yes/no or conditional branch. A step like "Review Application" is a rectangle, NOT a diamond, unless the flow explicitly splits into "approved" and "rejected" paths.
- "rectangle" is the default. When in doubt, use "rectangle".

## NODE ID AND LABEL RULES

- Node IDs must be descriptive snake_case: "validate_payment", NOT "node_1" or "A".
- Labels should be 2-5 words. Concise and clear.
- Do NOT use generic labels like "Start", "End", "Process", "Step 1". Be specific to the domain.

## EDGE RULES

- PREFER LINEAR CHAINS. A → B → C is clearer than A → B, A → C, B → C. Only add an edge if there is a DIRECT causal or sequential relationship.
- MAX 4 OUTGOING EDGES per node. If more are needed, add an intermediate grouping node.
- Use edge labels for conditional paths: "if valid", "on failure", "yes", "no". Unlabeled edges for obvious sequential flow are fine.
- Diamond nodes MUST have labeled outgoing edges (e.g., "yes"/"no", "approved"/"rejected").

## DIAGRAM QUALITY RULES

1. DON'T OVER-DECOMPOSE. Only break a step into sub-steps when the conversation explicitly discussed them. "User logs in" is one rectangle node unless login validation, 2FA, etc. were specifically discussed.
2. KEEP IT SCANNABLE. Aim for 5-15 nodes for a typical conversation. The diagram should be understandable in 10 seconds.
3. Every non-trivial flow should include at least one decision point with success AND failure paths — but ONLY if the conversation discussed what happens on failure.
4. If the conversation mentioned a gap, risk, or missing piece, represent it as a rounded-rect with a warning-style label (e.g., "Missing: Error Handling").

## WHEN UPDATING AN EXISTING GRAPH

If existing nodes are provided:
1. NEVER recreate nodes that already exist. Reuse their IDs in edges.
2. AVOID SEMANTIC DUPLICATES. "Validate Input" and "Input Validation" are the same — reuse the existing one.
3. Only remove or update nodes when the conversation CLEARLY indicates it. Don't speculatively remove.
4. If the conversation discusses something UNRELATED to the existing graph, create a separate cluster of new nodes.

## OUTPUT FORMAT

Return ONLY valid JSON with this exact structure:
{
  "add_nodes": [
    {"id": "snake_case_id", "label": "Short Label", "type": "circle|rectangle|diamond|rounded-rect"}
  ],
  "add_edges": [
    {"source": "source_id", "target": "target_id", "label": "optional relationship"}
  ],
  "update_nodes": [
    {"id": "existing_id", "label": "New Label", "type": "new_type"}
  ],
  "remove_nodes": ["node_id_to_remove"],
  "remove_edges": [{"source": "node_a", "target": "node_b"}]
}

IMPORTANT:
- All arrays must be present. Use empty arrays [] when there's nothing to add/update/remove.
- "update_nodes" only includes fields that changed. The "id" MUST match an existing node.
- "remove_nodes" triggers automatic removal of connected edges.
- Do NOT include any text outside the JSON. No explanations, no markdown, just the JSON object.`;


// ============================================================
// FOCUSED NODE INSTRUCTION — injected when user selects a node
// ============================================================

export function getFocusedNodeInstruction(node: {
  id: string;
  label: string;
  type: string;
}): string {
  return `
FOCUSED NODE — CRITICAL INSTRUCTION:
The user has selected node "${node.id}" ("${node.label}", type: ${node.type}) as their focus.

You MUST:
1. Generate new nodes that BRANCH FROM "${node.label}" — it is the primary parent/anchor.
2. All new nodes should connect to "${node.label}" (using its existing ID "${node.id}") as the starting point.
3. You may ALSO connect new nodes to other existing nodes where it makes logical sense, but "${node.label}" is the root of this expansion.
4. Do NOT regenerate "${node.label}" itself or any existing nodes — only create NEW nodes that extend from it.
5. Think of this as "zooming into" ${node.label} — what sub-processes, decisions, actors, or outcomes does it involve?`;
}


// ============================================================
// FEW-SHOT EXAMPLES — Unified JSON format
// ============================================================

export const GENERATE_FEW_SHOT: { role: "user" | "assistant"; content: string }[] = [
  // ── Example 1: Linear Order Flow — baseline rectangle chain ──────────
  {
    role: "user",
    content: `Conversation to analyze:
User: "Map our basic order flow. We receive the order, pick the items, and then ship it."
Assistant: "Any exceptions or approvals, or is it just a straight sequence?"
User: "Just a straight sequence for now."
Assistant: "I'll keep it as a simple linear process."

Generate the diagram from this conversation.`,
  },
  {
    role: "assistant",
    content: JSON.stringify({
      add_nodes: [
        { id: "receive_order", label: "Receive Order", type: "rectangle" },
        { id: "pick_items", label: "Pick Items", type: "rectangle" },
        { id: "ship_order", label: "Ship Order", type: "rectangle" },
        { id: "order_shipped", label: "Order Shipped", type: "rounded-rect" },
      ],
      add_edges: [
        { source: "receive_order", target: "pick_items" },
        { source: "pick_items", target: "ship_order" },
        { source: "ship_order", target: "order_shipped" },
      ],
      update_nodes: [],
      remove_nodes: [],
      remove_edges: [],
    }),
  },

  // ── Example 2: Payment Decision Branch — correct diamond usage ───────
  {
    role: "user",
    content: `Conversation to analyze:
User: "Show our checkout flow. We attempt the card charge and send a receipt."
Assistant: "What should happen if the charge fails?"
User: "If it succeeds, send the receipt. If it fails, ask for a new payment method."
Assistant: "That creates a real branch, so I'll model it as a decision."

Generate the diagram from this conversation.`,
  },
  {
    role: "assistant",
    content: JSON.stringify({
      add_nodes: [
        { id: "attempt_card_charge", label: "Attempt Card Charge", type: "rectangle" },
        { id: "payment_approved", label: "Payment Approved?", type: "diamond" },
        { id: "send_receipt", label: "Send Receipt", type: "rectangle" },
        { id: "request_new_payment", label: "Request New Payment", type: "rectangle" },
        { id: "payment_complete", label: "Payment Complete", type: "rounded-rect" },
        { id: "payment_failed", label: "Payment Failed", type: "rounded-rect" },
      ],
      add_edges: [
        { source: "attempt_card_charge", target: "payment_approved" },
        { source: "payment_approved", target: "send_receipt", label: "yes" },
        { source: "payment_approved", target: "request_new_payment", label: "no" },
        { source: "send_receipt", target: "payment_complete" },
        { source: "request_new_payment", target: "payment_failed" },
      ],
      update_nodes: [],
      remove_nodes: [],
      remove_edges: [],
    }),
  },

  // ── Example 3: Expense Process — multiple actors as circles ──────────
  {
    role: "user",
    content: `Conversation to analyze:
User: "Map our expense reimbursement process. The requesting employee submits a report, the approving manager reviews it, and the finance system reimburses it."
Assistant: "Do you want the people and system shown separately from the actions?"
User: "Yes, keep the roles and the system distinct from the steps."
Assistant: "I'll model the actors as circles and the work as process nodes."

Generate the diagram from this conversation.`,
  },
  {
    role: "assistant",
    content: JSON.stringify({
      add_nodes: [
        { id: "requesting_employee", label: "Requesting Employee", type: "circle" },
        { id: "approving_manager", label: "Approving Manager", type: "circle" },
        { id: "finance_system", label: "Finance System", type: "circle" },
        { id: "submit_expense_report", label: "Submit Expense Report", type: "rectangle" },
        { id: "review_expense_report", label: "Review Expense Report", type: "rectangle" },
        { id: "reimburse_employee_expense", label: "Reimburse Employee Expense", type: "rectangle" },
        { id: "expense_reimbursed", label: "Expense Reimbursed", type: "rounded-rect" },
      ],
      add_edges: [
        { source: "requesting_employee", target: "submit_expense_report", label: "initiates" },
        { source: "submit_expense_report", target: "approving_manager", label: "routes to" },
        { source: "approving_manager", target: "review_expense_report", label: "performs" },
        { source: "review_expense_report", target: "finance_system", label: "sends to" },
        { source: "finance_system", target: "reimburse_employee_expense", label: "executes" },
        { source: "reimburse_employee_expense", target: "expense_reimbursed" },
      ],
      update_nodes: [],
      remove_nodes: [],
      remove_edges: [],
    }),
  },

  // ── Example 4: Quality Check Feedback Loop — legitimate cycle ────────
  {
    role: "user",
    content: `Conversation to analyze:
User: "Show our batch release process. We run a quality check before release."
Assistant: "What happens if the quality check finds defects?"
User: "Then the batch goes back for rework and gets checked again. If no defects are found, we release it."
Assistant: "I'll model that as a loop back to the earlier step."

Generate the diagram from this conversation.`,
  },
  {
    role: "assistant",
    content: JSON.stringify({
      add_nodes: [
        { id: "run_quality_check", label: "Run Quality Check", type: "rectangle" },
        { id: "defects_found", label: "Defects Found?", type: "diamond" },
        { id: "rework_batch", label: "Rework Batch", type: "rectangle" },
        { id: "release_batch", label: "Release Batch", type: "rectangle" },
        { id: "batch_released", label: "Batch Released", type: "rounded-rect" },
      ],
      add_edges: [
        { source: "run_quality_check", target: "defects_found" },
        { source: "defects_found", target: "rework_batch", label: "yes" },
        { source: "defects_found", target: "release_batch", label: "no" },
        { source: "rework_batch", target: "run_quality_check", label: "retest after rework" },
        { source: "release_batch", target: "batch_released" },
      ],
      update_nodes: [],
      remove_nodes: [],
      remove_edges: [],
    }),
  },

  // ── Example 5: Parallel Launch Notifications — fan-out with grouping ─
  {
    role: "user",
    content: `Conversation to analyze:
User: "When a launch is approved, we notify Support, Sales, Customer Success, Marketing, Finance, and Operations."
Assistant: "Do those all happen in parallel?"
User: "Yes, and once all six groups are notified, the launch team is aligned."
Assistant: "I'll use a grouping node so the fan-out stays readable and under the edge limit."

Generate the diagram from this conversation.`,
  },
  {
    role: "assistant",
    content: JSON.stringify({
      add_nodes: [
        { id: "approve_launch", label: "Approve Launch", type: "rectangle" },
        { id: "notify_support_team", label: "Notify Support Team", type: "rectangle" },
        { id: "notify_sales_team", label: "Notify Sales Team", type: "rectangle" },
        { id: "notify_customer_success", label: "Notify Customer Success", type: "rectangle" },
        { id: "notify_internal_groups", label: "Notify Internal Groups", type: "rectangle" },
        { id: "notify_marketing_team", label: "Notify Marketing Team", type: "rectangle" },
        { id: "notify_finance_team", label: "Notify Finance Team", type: "rectangle" },
        { id: "notify_operations_team", label: "Notify Operations Team", type: "rectangle" },
        { id: "confirm_launch_alignment", label: "Confirm Launch Alignment", type: "rectangle" },
        { id: "teams_aligned", label: "Teams Aligned", type: "rounded-rect" },
      ],
      add_edges: [
        { source: "approve_launch", target: "notify_support_team" },
        { source: "approve_launch", target: "notify_sales_team" },
        { source: "approve_launch", target: "notify_customer_success" },
        { source: "approve_launch", target: "notify_internal_groups" },
        { source: "notify_internal_groups", target: "notify_marketing_team" },
        { source: "notify_internal_groups", target: "notify_finance_team" },
        { source: "notify_internal_groups", target: "notify_operations_team" },
        { source: "notify_support_team", target: "confirm_launch_alignment" },
        { source: "notify_sales_team", target: "confirm_launch_alignment" },
        { source: "notify_customer_success", target: "confirm_launch_alignment" },
        { source: "notify_marketing_team", target: "confirm_launch_alignment" },
        { source: "notify_finance_team", target: "confirm_launch_alignment" },
        { source: "notify_operations_team", target: "confirm_launch_alignment" },
        { source: "confirm_launch_alignment", target: "teams_aligned" },
      ],
      update_nodes: [],
      remove_nodes: [],
      remove_edges: [],
    }),
  },

  // ── Example 6: Update Existing Support Flow — rename, add branch, remove obsolete ─
  {
    role: "user",
    content: `EXISTING NODES ON CANVAS (DO NOT recreate these — reuse their IDs):
  - customer_issue: "Customer Issue" (rounded-rect)
  - support_agent: "Support Agent" (circle)
  - resolve_issue: "Resolve Issue" (rectangle)
  - issue_resolved: "Issue Resolved" (rounded-rect)

EXISTING EDGES:
  - customer_issue → support_agent
  - support_agent → resolve_issue
  - resolve_issue → issue_resolved

Conversation to analyze:
User: "Our current graph is Customer Issue -> Support Agent -> Resolve Issue -> Issue Resolved."
Assistant: "What changed?"
User: "Rename Support Agent to Support Engineer. Also, don't go straight from Resolve Issue to Issue Resolved anymore. First assess the issue. If it can be handled there, close the ticket. If not, escalate it to a specialist."
Assistant: "I'll reuse the existing IDs, update the renamed nodes, and replace the obsolete direct path."

Generate updates to the existing map. DO NOT create nodes that already exist — reuse their IDs in edges.`,
  },
  {
    role: "assistant",
    content: JSON.stringify({
      add_nodes: [
        { id: "resolution_available", label: "Resolution Available?", type: "diamond" },
        { id: "escalate_to_specialist", label: "Escalate To Specialist", type: "rectangle" },
        { id: "ticket_closed", label: "Ticket Closed", type: "rounded-rect" },
      ],
      add_edges: [
        { source: "resolve_issue", target: "resolution_available" },
        { source: "resolution_available", target: "ticket_closed", label: "yes" },
        { source: "resolution_available", target: "escalate_to_specialist", label: "no" },
        { source: "escalate_to_specialist", target: "ticket_closed" },
      ],
      update_nodes: [
        { id: "support_agent", label: "Support Engineer", type: "circle" },
        { id: "resolve_issue", label: "Assess Issue", type: "rectangle" },
      ],
      remove_nodes: ["issue_resolved"],
      remove_edges: [
        { source: "resolve_issue", target: "issue_resolved" },
      ],
    }),
  },

  // ── Example 7: Expand Focused Node — branch from existing without recreating ─────
  {
    role: "user",
    content: `EXISTING NODES ON CANVAS (DO NOT recreate these — reuse their IDs):
  - sales_handoff: "Sales Handoff" (rectangle)
  - customer_onboarding: "Customer Onboarding" (rectangle)
  - active_customer: "Active Customer" (rounded-rect)

EXISTING EDGES:
  - sales_handoff → customer_onboarding
  - customer_onboarding → active_customer

Conversation to analyze:
User: "In our current diagram we already have Sales Handoff -> Customer Onboarding -> Active Customer."
Assistant: "Which node do you want to expand?"
User: "Expand Customer Onboarding. It involves collecting requirements, configuring the account, and running training before the customer becomes active."
Assistant: "I'll add the new detail around the focused node without recreating the existing nodes."

Generate a diagram that BRANCHES FROM the focused node "Customer Onboarding" (customer_onboarding). Create NEW nodes that extend from it. Do NOT recreate existing nodes. Use existing node IDs in edges to connect new nodes to the existing graph.`,
  },
  {
    role: "assistant",
    content: JSON.stringify({
      add_nodes: [
        { id: "collect_requirements", label: "Collect Requirements", type: "rectangle" },
        { id: "configure_account", label: "Configure Account", type: "rectangle" },
        { id: "run_training", label: "Run Training", type: "rectangle" },
        { id: "onboarding_complete", label: "Onboarding Complete", type: "rounded-rect" },
      ],
      add_edges: [
        { source: "customer_onboarding", target: "collect_requirements", label: "includes" },
        { source: "customer_onboarding", target: "configure_account", label: "includes" },
        { source: "customer_onboarding", target: "run_training", label: "includes" },
        { source: "collect_requirements", target: "configure_account", label: "informs" },
        { source: "configure_account", target: "onboarding_complete" },
        { source: "run_training", target: "onboarding_complete" },
        { source: "onboarding_complete", target: "active_customer" },
      ],
      update_nodes: [],
      remove_nodes: [],
      remove_edges: [],
    }),
  },

  // ── Example 8: Ambiguous High-Level Relationship — restraint over invention ──────
  {
    role: "user",
    content: `Conversation to analyze:
User: "Customers use our system."
Assistant: "Do you want a detailed workflow, or just a high-level diagram?"
User: "Just keep it high-level. I don't want to make up details."
Assistant: "Then I'll keep it minimal and avoid inventing process steps."

Generate the diagram from this conversation.`,
  },
  {
    role: "assistant",
    content: JSON.stringify({
      add_nodes: [
        { id: "end_customers", label: "End Customers", type: "circle" },
        { id: "core_platform", label: "Core Platform", type: "circle" },
      ],
      add_edges: [
        { source: "end_customers", target: "core_platform", label: "uses" },
      ],
      update_nodes: [],
      remove_nodes: [],
      remove_edges: [],
    }),
  },
];
