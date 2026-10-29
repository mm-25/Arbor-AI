# Arbor AI Architecture

Last updated: October 28, 2026, America/Detroit. The October 12 review remains historical evidence; current findings also include the implemented foundation and direct Zen interaction checks.

This file describes the application that exists locally, its technical contracts, repository state, setup, verification evidence, and known technical gaps. A description of existing behavior is not a declaration that the behavior is correct or that it belongs in the MVP. Product decisions live in [product.md](product.md), work ordering and execution status live in [plan.md](plan.md), and unresolved decisions live in [questions.md](questions.md).

The project has exactly four maintained Markdown documents: questions.md, plan.md, product.md, and architecture.md. Update these documents in place. Do not create additional Markdown logs, reviews, specifications, implementation plans, README files, or handoff documents. Third-party documentation inside installed dependencies is not project documentation and should not be edited to enforce this rule.

**Current code versus agreed direction — October 28 editor quality pass**

The local implementation now uses Claude for typed chat, structured map generation and Markdown reports. Next.js, React Flow, Zustand and Dagre remain. One graph-application path handles additions and proposals; existing geometry/style stays fixed during additions. A synchronous workspace bridge saves graph/history per map and restores both. Continuous live voice, project grouping, complete assistance settings, URL ingestion and enhanced exports are future phases. The existing microphone is still record-stop-transcribe using Groq Whisper; it is not continuous live mapping.

Wireframe UI, its store and DesignView were removed. The old endpoint returns HTTP 410 and never calls a model. Legacy saved wireframes remain opaque data in existing map records; the app neither executes nor displays that HTML. New maps omit the field. Readable text/PDF attachments now retain extracted source text in local history for later requests and reload. New image attachments are rejected; historical image metadata may still display.

The repository remains a local working branch, codex/reliable-map-foundation, with the original uncommitted experiments incorporated into the working result. No deployment, push or commit has been performed. The following historical inventory describes the October 12 baseline unless explicitly updated; this current implementation section and the dated October 27/28 verification entries supersede old behavior descriptions.

### Current reasoning boundary

- src/lib/claude.ts is imported only by server-side API code. It uses @anthropic-ai/sdk 1.3.0. ANTHROPIC_API_KEY is required for reasoning; ANTHROPIC_MODEL can override the default claude-sonnet-5-5. The model identifier and structured-output contract were checked against the installed official SDK types and [Anthropic's model documentation](https://platform.claude.com/docs/en/models/overview). Account access and basic real chat/generation were verified October 27; see the measured live verification below.
- Requests have a 45-second SDK timeout, zero automatic retries and bounded output: 2,048 tokens for chat, 4,096 for graph/report output. The adapter requests medium effort, extracts text blocks, requires a finished end_turn response, and rejects truncation rather than trying to apply partial JSON. Returned model and input/output token counts make individual live probes measurable. There is no implemented account-wide spend meter or hard $20 limiter; the $20 allocation governs deliberate engineering tests and must be recorded manually before broader trials.
- src/lib/ai-contract.ts validates request objects, conversation roles/content, readable attachments, graph IDs/endpoints and model patch types. Limits are 200 messages, 250,000 conversation characters, 1,000 existing nodes and 5,000 existing edges; oversized input is rejected visibly. New graph output uses JSON schema structured output for add_nodes, add_edges, update_nodes, update_edges, remove_nodes and remove_edges. Optional node roles and relationship kinds distinguish confirmed concepts, open questions, suggestions, containment, transitions and references. A disconnected node or repeated label is valid; distinct IDs are never merged by label, and shape choice never causes invented yes/no labels or fanout caps.
- The generate route validates structural references after parsing. Invalid model changes return HTTP 502 without applying a partial map. Request errors return 400, missing credentials 503, and rate/usage-limit failures 429. Raw provider errors are not sent to the browser. Chat includes node IDs and relationships as context. Reports preserve the existing Markdown response field.
- These local endpoints do not yet provide authenticated public-service access or a durable spending quota. The current target is local single-user development; deployment review remains required before a regularly available public service. This milestone does not provision a backend.

### Current map, history and request ownership

src/lib/workspace.ts subscribes synchronously to chat identity, graph state and history. Switching maps restores the selected graph/history before later mutation handlers can save. A restoration guard prevents writing the outgoing graph into the incoming map. Persisted snapshots strip selection, measured dimensions, dragging flags and proposal highlights. Selection and measurement updates do not create history entries. Each map stores up to 50 undo snapshots and 50 redo snapshots alongside the current graph under schemaVersion 2. This is whole-graph snapshot history, so large maps and long readable sources can still exhaust browser storage.

Storage failures leave the live graph in memory and show a persistent visible error. Failed parsing retains the original storage value. A later explicit new-map save copies unreadable content into mindmap-chat-sessions-recovery before replacing it; failed backup prevents replacement. Optional corrupt history is discarded only when the graph/chat can otherwise be recovered. Browser storage is finite and does not constitute a cross-device backup.

src/lib/ai-actions.ts owns complete typed turns. It appends each user message once, sends retained document text, and binds results to the originating session ID and activation epoch. Switching away and back invalidates the old request. Generation and proposals additionally carry a graph-content fingerprint that ignores visual previews/selection. Manual content, geometry or style changes invalidate a pending response/proposal. Outstanding browser requests are aborted on map changes; a provider request already accepted server-side may still incur usage. Replies and busy/error state from old maps do not populate the current map.

All additive patches and accepted proposals call mindmap-store.applyProposal. Empty maps receive an initial Automatic layout (a compact TB hierarchy for broad trees, otherwise LR). Nonempty maps receive incremental placement unless an explicit layout command accompanies the patch; existing node objects, positions, colors and icons remain unchanged except for explicitly requested content updates. Upstream additions are placed before their anchor; measured bounds protect existing long labels. Generated/connector-tool edges receive handles facing their endpoints. Edge color, stroke, label and route edits use the graph store, and segment dragging keeps intermediate preview points outside persisted graph state and commits one snapshot at a valid release. Deleting a node removes attached edges in the same graph transaction. Tidy Up is an explicit layout action and clears obsolete absolute corners, parallel offsets and computed dashed flags while retaining chosen edge styling.

Global graph shortcuts now defer to input, textarea and contenteditable text editing. The chat panel is keyed by map identity so unsent text and attachments do not leak into another map. Its recorded-input hook releases microphone tracks and aborts transcription on unmount, including a permission response that arrives after leaving the map.

### Current verification boundary

Automated regression coverage, browser checks and command results are recorded below and in plan.md. The Anthropic credential is now present and the first real Sonnet checks passed; see the live verification entry below. Basic model access, typed chat, schema-constrained generation and additive preservation are verified. Broader semantic quality and representative latency remain unestablished. Usage is tracked by returned token counts and safe server-side metric logs. No new product questions were needed to implement this foundation.

**Historical baseline follows**

**Evidence and scope**

The October 12 review covered all 40 first-party application/plugin source files, approximately 9,844 lines, plus configuration, both package manifests and lockfiles, existing documentation, Git history, and the six local source edits. The source files include the application CSS and the Figma plugin HTML. The review did not inspect every line of installed third-party packages, the generated PDF worker, framework build output, or binary assets. No live Groq request was made. Compilation and targeted local reproductions were performed; microphone behavior, PDF/image processing in a browser, PNG exports, and imports inside Figma remain unverified end to end.

**Repository location and comparison**

The workspace directory is `/Users/mufaddalmiyajiwala/Documents/Random/Arbor AI`. The actual Git repository and npm application are in its `arbor_ai` child directory. Run application and Git commands from that child directory. The workspace parent is not itself a Git checkout.

| Item | October 12 review snapshot |
| --- | --- |
| Public repository | https://github.com/mm-25/Arbor-AI |
| Local branch | main |
| Local HEAD | edd7c87cc6196aa7e915b104b3e54bbf1d268c59 |
| Local HEAD date | April 21, 2026 |
| Live remote main | 2fac226bdc0145663fdc25c1947541e70f2ef47d |
| Remote commit date | May 22, 2026 |
| Tracked file count before documentation consolidation | 62 in both local and remote copies |
| Newer remote change | README deployment link only |
| Existing local source changes | Six uncommitted modified files |
| Existing non-ignored untracked files before review documentation | None |

The remote comparison was verified with live branch hashes and a separate public clone in a temporary directory. The locally cached origin/main was stale. Local refs and source files were not updated by a pull, reset, merge, or fetch into this checkout.

At the original comparison, seven tracked files differed byte-for-byte: README.md and the six source files listed below. All other tracked files, including both package lockfiles, matched the remote. This is a historical source comparison. Subsequent review documentation and this four-file consolidation introduce additional documentation differences; do not describe the current entire worktree as differing in only those original seven files.

| Source file | Existing local experiment |
| --- | --- |
| src/app/api/generate/route.ts | Initial generation requests Mermaid; updates/expansion still request JSON. |
| src/lib/prompts.ts | Mermaid system instructions and five examples. |
| src/components/Canvas.tsx | Connector drawing mode based on selecting two nodes. |
| src/components/Sidebar.tsx | Draggable connector tool. |
| src/components/edges/EditableEdge.tsx | Orthogonal paths, editable segments/corners, edge colors, solid/dashed style controls. |
| src/lib/auto-layout.ts | Hierarchy colors, diamond handle distribution, parallel offsets, crossing heuristic. |

These edits total 1,036 inserted lines and 389 deleted lines against local HEAD. The user classified them as experiments to reassess. Preserve them during evaluation; their presence does not authorize retaining every experiment or treating them as finished features.

The repository began with Create Next App on February 26, 2026. A March 22 commit added the MapMind feature set. Another March 22 commit renamed the product to Arbor AI and hid Design view for an automotive rebuild. April 21 added Tidy Up, incremental proposal placement, and chat polish. May 22 changed the remote README to point at the deployment. The user has since confirmed the general systems-thinking direction; automotive comments are historical context, not active requirements.

The remote README identifies https://arbor-ai.vercel.app/ as the latest build. Its actual deployed commit, Vercel project, configuration, and runtime behavior have not been verified. A URL in a README does not prove that the deployed application matches this checkout.

**Runtime and dependencies**

| Dependency | Declared version | Responsibility |
| --- | --- | --- |
| Next.js | 16.1.6 | App Router, page rendering, server API routes, build/start workflow. |
| React / React DOM | 19.2.3 | UI rendering and component state. |
| TypeScript | ^5 | Static checking; strict mode enabled. |
| @xyflow/react | ^12.10.1 | Interactive canvas, nodes, edges, handles, selection, viewport. |
| Zustand | ^5.0.11 | Graph, sessions, history, proposals, and wireframe state. |
| @dagrejs/dagre | ^2.0.4 | Full graph layout. |
| dagre | ^0.8.5 | Also declared; application layout source imports @dagrejs/dagre. |
| groq-sdk | ^0.37.0 | Server-side chat completion and transcription calls. |
| Tailwind CSS | ^4 | Styling and design tokens. |
| radix-ui | ^1.4.3 | Button composition and tooltip primitives. |
| react-markdown | ^10.1.0 | Chat/report Markdown display. |
| html-to-image | ^1.11.13 | Diagram and wireframe PNG exports. |
| pdfjs-dist | ^5.5.207 | Client-side text extraction from PDFs. |
| lucide-react | ^0.575.0 | Available icon library. |
| shadcn / tw-animate-css | ^3.8.5 / ^1.4.0 | UI styling/building blocks and animation utilities. |

These are manifest declarations, not claims about current upstream releases. The root lockfile retains a historical mindmap package name, while package.json names arbor-ai. The plugin lockfile retains mapmind-figma-plugin, while its package.json names arbor-ai-figma-plugin. The historical names are metadata cleanup candidates, not an application behavior failure.

The main TypeScript configuration targets ES2017, includes DOM libraries, uses bundler module resolution, enables strict checking, and defines `@/*` as `./src/*`. It includes generated Next.js route types and excludes node_modules and figma-plugin. A passing root TypeScript check therefore does not verify the plugin.

next.config.ts declares groq-sdk as a serverExternalPackage. The application loads Geist and Geist Mono through next/font/google. Production compilation requires the configured font resources to be available or already cached. The restricted-network review build failed while downloading fonts; the build passed with network access.

**Source ownership**

| File or area | Responsibility |
| --- | --- |
| src/app/page.tsx | Root client page; creates ReactFlowProvider and mounts Canvas. |
| src/app/layout.tsx | Metadata, font setup, global CSS, TooltipProvider. |
| src/app/globals.css | Tailwind/theme setup, hidden connection handles, layout transitions, proposal highlights. |
| src/components/Canvas.tsx | Graph canvas, sessions, keyboard actions, copy/paste, duplication, context menus, connector mode, dormant wireframe flow. |
| src/components/Sidebar.tsx | Chat list, session actions, shape palette, connector palette, Save, Clear, undo/redo, Tidy Up, export modal. |
| src/components/ChatPanel.tsx | Chat composition, resizing, attachments, voice input, generation, node focus, proposal display and acceptance. |
| src/components/nodes/MindMapNode.tsx | Rendering, handles, label editing, and proposal highlighting for graph nodes. |
| src/components/nodes/NodeStyleToolbar.tsx | Shape, color, and emoji controls. |
| src/components/nodes/node-config.ts | Shape defaults, color presets, visual resolution. |
| src/components/edges/EditableEdge.tsx | Edge routing, drag handles, labels, line styles, proposal highlighting. |
| src/components/ProposalMessage.tsx | Proposal summary and accept/reject UI. |
| src/components/ExportDesignModal.tsx | Report generation, PNG capture, JSON/Mermaid export, preview. |
| src/components/DesignView.tsx | Dormant wireframe cards, previews, download and deletion. |
| src/components/Toolbar.tsx | Legacy toolbar; not mounted by the current root flow. |
| src/components/TextInputPanel.tsx | Legacy direct-text generator; not mounted and uses an outdated API request. |
| src/lib/prompts.ts | Mentor persona, graph generation prompts/examples, focused-node instruction. |
| src/lib/mermaid-parser.ts | Limited Mermaid flowchart parser returning node/edge arrays. |
| src/lib/generate-validation.ts | Graph-quality heuristics. |
| src/lib/auto-layout.ts | Full Dagre placement, handle assignment, computed styles. |
| src/lib/incremental-layout.ts | Adds nodes around existing anchors without moving them. |
| src/lib/file-utils.ts | Attachment detection, image processing, text/PDF extraction. |
| src/lib/figma-export.ts | Versioned plugin JSON and Mermaid serialization. |
| src/hooks/useSpeechToText.ts | Microphone recording and transcription upload. |
| figma-plugin/code.ts | Figma/FigJam node and connector reconstruction. |
| figma-plugin/ui.html | Paste/validate/import interface. |

**State and data contracts**

mindmap-store owns the live graph. A node is a React Flow Node with MindMapNodeData. Node data has label, one of four shapes, origin/source, optional icon and color, and an open extension field. The node origin is manual, text, or voice. Origin is metadata used by layout; it is not provenance linking a node to a specific source document. The renderer type is mindMapNode, distinct from the shape stored in node.data.type.

```ts
type NodeType = "rectangle" | "rounded-rect" | "circle" | "diamond";

interface MindMapNodeData {
  label: string;
  type: NodeType;
  source: "manual" | "text" | "voice";
  icon?: string;
  color?: string;
  [key: string]: unknown;
}
```

Edges currently use the general React Flow Edge type. The editable renderer consumes data fields including corners, parallelOffset, parallelAxis, strokeColor, strokeStyle, autoDashed, and transient proposalHighlight. Graph endpoints are source/target IDs; optional handle IDs select top, right, bottom, or left. Graph direction exists in data even when an edge has no visibly configured arrowhead. A semantic relationship type is not separately modeled.

chat-store owns ChatMessage and ChatSession. Messages contain id, role, content, timestamp, optional proposalId, and lightweight attachment metadata. Sessions contain id, title, messages, graphNodes, graphEdges, wireframes, createdAt, and updatedAt. Live graph state and a session's saved graph are separate state objects, which is central to the current persistence gap.

```ts
interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  graphNodes: MindMapNode[];
  graphEdges: MindMapEdge[];
  wireframes: Wireframe[];
  createdAt: number;
  updatedAt: number;
}
```

history-store keeps past/future arrays of graph snapshots, not complete project snapshots. It caps past history at 50 entries and has pause/drag/layout-animation flags. Graph actions capture snapshots before changes; continuous node dragging is debounced into a drag history entry. Changing sessions clears history. History is not persisted across reload. Several edge operations bypass the history layer.

proposal-store holds one global proposal with id, five change arrays, and pending/accepted/rejected status. There is no originating session ID or graph revision in the proposal. Chat messages retain proposalId, but the full proposal and decision history are not durably modeled in the session. The UI clears the pending object after resolving a proposal.

wireframe-store holds an array of wireframes and its generating flag. A wireframe has id, title, sourceNodeIds, HTML, and createdAt. chat-store stores per-session wireframes for reload, but the UI that reveals them is hidden.

**Storage boundaries**

| Storage key | Data | Current restore path |
| --- | --- | --- |
| mindmap-chat-sessions | All saved chat sessions with graph and wireframe snapshots | chat-store.loadSessions and Canvas session restoration. |
| mindmap-active-chat | Active chat ID | Used when choosing the initial session. |
| mindmap-data | Standalone legacy graph snapshot | Save writes it; current startup restores session graph rather than this legacy snapshot. |

Storage is browser localStorage for the application's origin. There is no server-side session database, login, cloud backup, access policy, or synchronization across browsers/devices. A localhost session and a deployment session belong to different origins. JSON parse failures are handled in some loading paths, but storage writes do not provide a consistent quota/recovery strategy. Every persist writes serialized session data; scaling behavior has not been measured.

Full attachment data lives in a ChatPanel in-memory cache keyed by attachment ID. Stored message metadata contains name, MIME type, size, type, and optional thumbnail. After reload, old attachments can still appear in history while their full original context cannot be rehydrated. This is a technical limitation, not an approved retention policy.

**Request and rendering flows**

Startup loads saved sessions, creates a new session if needed, chooses the saved active session or a recent fallback, clears undo history, and replaces the live canvas with that session's graph. Session switching saves the current graph through the sidebar's switching path before restoring the new session. That switching save does not make every ordinary edit automatically durable.

Sending chat adds the user's message to the store, hydrates attachment metadata from the in-memory cache, and posts conversation plus currentGraph to /api/chat. The route chooses a model based on image presence, injects the mentor prompt and a list of node labels/shapes, and builds text or multimodal messages. The route currently does not expose graph edges in its system context. A response appends an assistant message to whichever chat is active when the append executes. There is no request cancellation/session guard.

Generation includes unsent input text, existing nodes and edges, and the first selected node as focus. An empty graph uses Mermaid; an existing graph uses JSON operations. Server post-processing validates/sanitizes content and returns changes plus has_changes. has_changes is true for node updates, node removals, or edge removals. Pure additions do not set it.

If has_changes is true, ChatPanel creates a proposal, highlights affected graph elements, and waits for accept/reject. Acceptance applies removals/updates, places new nodes incrementally, adds edges, clears highlights, and saves the graph. Rejection clears highlights and adds a follow-up message. If has_changes is false, new nodes/edges are merged immediately, passed through full layout, and saved. Both paths can depend on a stale graph snapshot if the user edits or switches sessions while generation is pending.

**API contracts and configured models**

All five routes are POST endpoints in src/app/api. Models and limits below are configured source values; model availability, service-side retention, billing, and latency have not been verified.

| Route | Expected payload | Response | Model and generation settings |
| --- | --- | --- | --- |
| /api/chat | messages; optional currentGraph | message string, or error | llama-3.3-70b-versatile for text; meta-llama/llama-4-scout-17b-16e-instruct when images exist; temperature 0.7; max_tokens 1024. |
| /api/generate | conversation, currentNodes, currentEdges, optional focusedNode/documentContext | Five change arrays and has_changes, or error | llama-3.3-70b-versatile; temperature 0.4; max_tokens 4096. JSON response format for existing-graph path; unconstrained text for Mermaid path. |
| /api/transcribe | Multipart audio File | text string, or error | whisper-large-v3; language en; JSON transcription response. |
| /api/export-design | nodes, edges, conversation | markdown string, or error | llama-3.3-70b-versatile; temperature 0.3; max_tokens 4096. |
| /api/wireframe | targetNodes, allNodes, allEdges, conversation | title and html, or error | llama-3.3-70b-versatile; temperature 0.4; max_tokens 4096. |

Routes generally perform minimal presence checks, return 400 for some missing inputs, and return 500 for unavailable keys or upstream/parse errors. They do not use a shared runtime request schema, application-level identity, quotas, or rate limiting. Errors often expose the caught message to the client. The transcription module creates its Groq client at module scope; other routes generally check/create within the handler. The effects of malformed or excessively large inputs require focused endpoint testing.

The graph change contract is shared conceptually across prompts, generation, validation, proposals, and application code, but is repeated in multiple modules rather than governed by one runtime schema.

```ts
interface GenerateResult {
  add_nodes: { id: string; label: string; type: string }[];
  add_edges: { source: string; target: string; label?: string }[];
  update_nodes: { id: string; label?: string; type?: string }[];
  remove_nodes: string[];
  remove_edges: { source: string; target: string }[];
}
```

**Generation validation and parsing**

The JSON path maps old semantic node types and common aliases into the four supported shapes, sanitizes IDs, caps initial labels at 100 characters, removes duplicate new IDs and same-endpoint edges, and skips self-loops. It filters node updates/removals to known existing IDs and filters edge additions to known endpoints. The Mermaid path does not use exactly the same ID/label sanitization process, so the two paths can accept different representations.

Cross-graph label deduplication uses lowercased labels plus normalizeLabel, which strips articles and sorts words. That can merge genuinely equivalent labels, but word similarity alone is not proof of semantic identity. Focused expansion filters edges already present more explicitly than the general update path.

The route limits outgoing connections to four, counting existing edges before new edges. Quality validation then deduplicates new labels, drops generic labels, caps additions at 25 by connectivity, adjusts some diamonds, inserts missing yes/no labels, and drops unconnected new nodes. These rules may discard or alter meaningful user content. Counts do not consistently account for edges being removed in the same proposal. None of these checks establishes that the graph accurately describes the underlying product/system.

The Mermaid parser recognizes a limited set of line-oriented shape/arrow patterns, ignores style/class directives and subgraph markers, and returns node/edge arrays. It is not a full Mermaid parser. Chained arrows on one line are currently mishandled. Unsupported syntax is frequently skipped rather than reported as a diagnostic. Existing layout/style metadata is not imported from Mermaid.

**Layout and editing**

Full layout uses @dagrejs/dagre with LR default and TB support in its API. Shape dimensions are approximations rather than measured React Flow bounds. Spacing changes with graph size. The local experiment assigns handles from relative position, spreads some parallel edges, redistributes conflicting diamond exits, and flags heuristic crossings. It colors depth zero blue, depth one purple, depth two green, and deeper levels gray when a color is absent.

Full layout repositions nodes tagged text/voice or positioned at the origin. It can retain manual-source nodes elsewhere, while computing routes using Dagre's positions; this deserves runtime scrutiny. Tidy Up temporarily resets every position and source so all nodes are eligible, restores original source metadata afterward, and animates up to 30 nodes for approximately 400 ms. The function writes computed colors and flags into the same graph metadata that also stores user choices; computed and user-authored values are not consistently separated.

Incremental layout treats existing nodes as anchors, places additions next to an incoming parent or outgoing child, fans out sibling additions, nudges to avoid approximate bounding-box overlaps, and parks disconnected leftovers beyond the existing graph. It performs bounded placement/nudging iterations and does not provide a global optimal layout. Its current primary caller is proposal acceptance; pure additions still use full layout.

The edge experiment generates orthogonal paths, rounds corners, enforces horizontal/vertical segments, displays drag handles for segments at least 15 pixels long, and supports six stroke colors plus solid/dashed choices. Stored corners are absolute flow coordinates. Earlier saved edge waypoints are not migrated to corners. Edge label, style, and segment operations use React Flow setEdges directly and bypass the custom undo/persist abstraction.

Canvas supports selection, copy/paste within memory, Command/Ctrl+A, undo/redo, and Option/Alt drag duplication. Copied edges are those internal to copied nodes; duplication rewires connections to stay-copies while dragged originals move. User-chosen edge corners and proposal metadata may travel with copies, so behavior needs verification. Global undo shortcuts run before the text-input guard and can interfere with expected text undo. The UI is predominantly desktop/mouse-oriented; no explicit mobile canvas flow or comprehensive accessible keyboard interaction is implemented.

**Attachments and voice**

Image inputs include PNG/JPEG/GIF/WebP/SVG. Processing limits the longest dimension to 1,024 pixels. PNG/SVG retain PNG output; other accepted formats become JPEG, normally at 0.8 quality. Small thumbnails are separately generated for history display. Exported/resized MIME metadata and actual data URI format should be kept consistent when changing this flow.

Text documents have a 2 MB client-side cap and are read with FileReader. PDFs have a 10 MB cap and use pdfjs-dist with `/pdf.worker.min.mjs`. Text is extracted page by page with an approximately 60,000-character budget and a truncation note. Scanned/image-only PDFs are rejected when no text is extracted; OCR is not implemented. The limits are per-file client behavior, not a complete server request/token budget.

The chat path reuses full cached attachment content in subsequent requests during the current browser session. The generate path currently assembles documentContext from attachment filenames, not extracted text, and passes no direct image inputs. Earlier assistant text may carry indirect information, but original source grounding is missing from generation. The report/wireframe routes also synthesize text/graph context rather than a durable source collection.

Voice uses getUserMedia and MediaRecorder, chooses WebM/Opus, WebM, or MP4 based on browser support, releases microphone tracks on stop, rejects very short recordings, uploads an audio file, and inserts the returned transcript into the input. Voice does not automatically send a chat message or generate a map. English is hard-coded in the transcription request. Browser permission handling and unmount/recording lifecycle need runtime coverage.

**Exports and dormant wireframes**

Design report generation combines graph nodes/relationships and conversation into sections covering overview, components, flows, decisions, issues, and unresolved topics. Markdown is held in the modal, copied or downloaded as system-design.md. Generating this user export is an application feature; the four-file rule governs maintained repository documentation, not names of documents users export from the product.

PNG export finds the React Flow viewport, computes graph bounds with fixed dimensions, temporarily changes its transform, captures with html-to-image at 2x resolution, and downloads arbor-ai-diagram.png. Bounds can miss large shapes, dynamic labels, or routed edges. Failure handling resets the transform to an empty value rather than always restoring the original transform. Selected controls and edge labels need browser capture verification.

Figma JSON includes appName Arbor AI, version 1, exportedAt, node IDs/labels/types/positions/colors/backgrounds/icons, and edge source/target/label. It does not include chats, attachments, custom routing geometry, all edge styling, or a full project history. There is no current graph-JSON import action in the web app, so this export is not a demonstrated round-trip backup.

Mermaid serialization emits graph LR, shape expressions, edges, and node style directives. Labels are quoted and double quotes replaced, but a full escaping strategy and round-trip behavior have not been established. The preview runs Mermaid 11 from jsDelivr in a script-enabled iframe sandbox; it is isolated without allow-same-origin. Preview code uses securityLevel loose. Generated HTML and Mermaid input should be tested against their actual trust boundaries.

Wireframe generation sends target nodes, graph, and the last ten conversation messages to an HTML generator. It parses a title from the first line and strips Markdown fences. The prompt requests neutral low-fidelity Tailwind HTML with no JavaScript and a CDN stylesheet. The renderer uses srcDoc with allow-same-origin but no allow-scripts. The Design toggle, DesignView mount, and node-menu generation item are hidden; routes/stores/callbacks remain. Deciding to restore or retire them is a product question, not a technical cleanup assumption.

**Figma plugin installation and implementation**

The companion plugin is a separate npm package. Its manifest names Arbor AI Import, supports Figma and FigJam, points to generated code.js and ui.html, disables proposed APIs, and declares no network domains. It is a development plugin, not a verified publicly distributed plugin.

From the repository root:

```bash
cd figma-plugin
npm ci
npm run build
```

Build uses esbuild to bundle code.ts into code.js targeting ES6. `npm run watch` repeats the build when source changes. `npm run build:tsc` first type-checks; its current typeRoots configuration fails to load the Figma globals correctly. Importing the manifest without building code.js first will not supply the required plugin executable.

In Figma Desktop, use Plugins → Development → Import plugin from manifest, choose figma-plugin/manifest.json, and run Arbor AI Import. In Arbor, use Export → Figma → Copy for Figma Plugin, paste the JSON into the plugin, then select Import. The UI checks appName and nonempty nodes, but does not comprehensively validate every node/edge field or require a matching payload version.

The plugin loads Inter font weights, creates auto-layout rounded frames containing a title and type badge, places them at exported positions, and constructs connectors. When createConnector is available it uses native connectors; otherwise it draws vector curves/arrows and separate labels. Created nodes are grouped and zoomed into view. Existing canvas shape/color/icon fidelity is incomplete because the plugin uses older actor/process/decision/outcome/problem mappings and ignores several exported appearance fields. Error handling can notify after partial creation; rollback and exact import counts are not established.

**Application setup and operating commands**

From a fresh checkout, run npm ci in arbor_ai. Create .env.local containing GROQ_API_KEY through an appropriate local secret configuration; do not put a real key in maintained documentation, committed files, chat output, or test fixtures. The environment file is ignored by Git. No sample environment Markdown file is needed.

```bash
# Run from the arbor_ai repository root.
npm ci
npm run dev
```

Open http://localhost:3000. package.json also defines build, start, and lint. Next.js uses port 3000 by default; the existing .claude launch configuration uses next dev --turbopack on that port. Check available Node compatibility against the installed dependency/tooling when setting up a different machine. The review host used Node 26.7.0; that is an observed environment, not an agreed project requirement.

```bash
npm run build
npm run start
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm run lint
```

The October 12 production verification specifically used `npm run build -- --webpack`; a successful webpack build does not establish the result of every alternative bundler/configuration. No CI workflow, automated test command, deployment ownership configuration, or reproducible acceptance suite is present in the reviewed first-party repository.

**Technical finding history — original symptom retained, status updated**

| ID | Evidence level | Finding and consequence | Main location |
| --- | --- | --- | --- |
| A01 | Fixed; regression tested October 27 | Mermaid chain parsing collapses steps into a node label and loses a node/edge. | mermaid-parser.ts; Mermaid prompt. |
| A02 | Fixed; regression tested October 27 | addUserMessage synchronously updates state, then handleSend appends the same user message again to the API conversation. | ChatPanel.tsx. |
| A03 | Fixed for active mutation paths; store and browser checks | Ordinary graph mutations do not consistently update saved session snapshots. Reload can restore an older graph. | mindmap-store.ts; Canvas/Sidebar save paths. |
| A04 | Fixed; regression tested October 27 | Full layout changes existing text-source node positions on pure additions. | ChatPanel.tsx; auto-layout.ts. |
| A05 | Fixed; regression tested October 27 | Valid isolated concepts are dropped as orphans. Correctness depends on intended graph policy. | generate-validation.ts. |
| A06 | Fixed; regression tested October 27 | Computed dashed/parallel metadata is retained when no longer applicable. | auto-layout.ts. |
| A07 | Fixed for readable documents; images excluded by scope | Generation receives document names instead of cached text and no direct images. Source context is incomplete. | ChatPanel.tsx handleGenerate. |
| A08 | Fixed for newly attached readable text; old metadata cannot reconstruct missing source content | Full attachment content disappears on reload while metadata remains. | ChatPanel cache; chat-store. |
| A09 | Fixed; store tests and browser connector checks | Edge mutations bypass custom undo and consistent session persistence. | EditableEdge.tsx. |
| A10 | Fixed with activation epoch/content fingerprint; regression tested | Async results/proposals have no owning session/revision; switching chats or editing during requests can misapply results. | ChatPanel; proposal-store; chat-store. |
| A11 | Semantic heuristics removed; structural integrity checked | Graph validation can duplicate existing edges, merge distinct concepts, or synthesize labels/limits without user intent. | generate route; generate-validation.ts. |
| A12 | Open; source traced and current Zen failures confirmed October 28 | Auto colors share user color storage; dimensions/crossing heuristics approximate actual geometry. A new connector passed through an unrelated node. | auto-layout.ts; node-config; EditableEdge; current audit captures. |
| A13 | Absolute-corner translation resolved October 28; legacy migration remains separate | Paste and equally moved internal edges translate corners/legacy point arrays. Actual keyboard copy/paste wiring and group history are tested. Legacy waypoints are not converted to the current corners representation. | edge-routing.ts; Canvas.tsx; workspace/Canvas regressions. |
| A14 | Source traced | Figma output does not preserve full map styling/shapes/routing. | figma-export.ts; plugin code.ts. |
| A15 | Source traced | API request validation, access controls, usage protection, and context budgets are incomplete. | Five API handlers. |
| A16 | Source traced | Hidden/legacy UI code remains, including an outdated direct-generation payload. | DesignView; Toolbar; TextInputPanel. |
| A17 | Partially addressed; current interaction gaps confirmed October 28 | Text-field shortcut isolation exists. Connector activation, Shift selection, redo shortcut behavior, control sizing, reduced-motion and broader keyboard access remain incomplete. | Canvas; panels; CSS; current Zen audit. |
| A18 | Fixed; plugin compiler and bundle pass October 27 | Root checking excludes plugin; plugin typeRoots does not load API globals. | TypeScript configurations. |
| A19 | Fixed source error; vendor worker excluded; lint has warnings only | Render-time ref access introduces a source lint error; lint also includes generated/vendor assets. | EditableEdge; eslint.config.mjs. |
| A20 | Observed credential exposure | The local remote URL embeds a token that appeared in diagnostic output. Rotation/removal is unresolved. | Local Git configuration; value deliberately omitted. |

For A01, `receive_order[Receive Order] --> pick_items[Pick Items] --> ship_order[Ship Order]` produced two nodes and one edge. The second label became `Pick Items] --> ship_order[Ship Order]`; quality validation accepted it. For A03, adding one manual node left the live graph with one node and the saved session graph with zero. For A04, existing positions (800,600) and (1000,700) became (40,40) and (340,40). For A05, one meaningful Brake Controller node became zero nodes after validation. For A06, a graph with one edge retained autoDashed=true and parallelOffset=18 despite no crossing or parallel group.

These are recorded findings, not resolved issues. IDs remain stable across the four documents so work and evidence can be linked without creating separate issue Markdown files.

**Verification record**

| Check performed October 12 | Result and boundary |
| --- | --- |
| Root TypeScript no emit | Passed. Does not include plugin. |
| webpack production build with fonts available | Passed, including page generation and route collection. No live AI request. |
| Restricted-network build | Failed on Google font downloads; resolved for verification by network-enabled build. |
| ESLint src | 1 error, 19 warnings. react-hooks/refs error in EditableEdge.tsx around line 322. |
| Baseline committed EditableEdge lint in memory | 0 errors, 0 warnings; the local edge version introduces the observed error. |
| ESLint full configured scope | 11 errors, 1,622 warnings. Includes plugin, generated code.js, and vendored PDF worker. Counts depend on generated files present. |
| Plugin configured TypeScript | Fails on missing Figma globals. |
| Plugin TypeScript with explicit declaration input | 0 diagnostics, confirming configuration as the investigated cause. |
| Plugin esbuild to temporary output | Passed. Does not verify operation in either editor. |
| Existing source diff whitespace | Passed. |
| Graph/parser/store local reproductions | Produced the A01–A06 results above. |

No application bug was fixed as part of review/consolidation. Build checks changed ignored caches/generated framework files. No commit, push, PR, deployment, account mutation, or paid AI call occurred. The security token finding was reported; do not assume rotation occurred. Future verification must be recorded with the actual checked revision and result, rather than presenting this historical table as fresh evidence after source changes.

**Target architecture after the user's answers**

This section proposes component contracts for the confirmed requirements. It does not select every implementation detail, add dependencies or change runtime behavior. Confirmed product constraints are distinguished from recommended engineering choices and unresolved interaction decisions.

**Architecture decisions now established**

| Area | Confirmed constraint | Remaining engineering/design choice |
| --- | --- | --- |
| Product framing | Brainstorming first, architecture design second. | Task-aware interaction/organization for mind map, process and journey. |
| Reasoning provider | Replace current Groq reasoning; evaluate Claude Sonnet using Claude Console credits and an initial approximately $20 allocation. | Available model ID, server credentials, incremental usage/cost tracking, speech service and comparative evidence. |
| Canvas | Keep existing four shapes and user control. | Retain/refine React Flow or replace only if measured requirements justify it. |
| Semantics | Conventional shape/color meanings are optional defaults. | Model prompts and validators must distinguish integrity from soft conventions. |
| Layout | Preserve all existing geometry/style unless explicitly requested otherwise. | New-node placement, route adjustment and explicit Tidy Up algorithm. |
| Workspace | Projects organize independent maps/chats. | Schema/navigation and migration of existing chat sessions. |
| Persistence | Local first release, autosave, undo/redo, reopen as left. | Snapshot/history/view boundary, debouncing and quota/error recovery. |
| Modes | Typed discrete workflow plus desired live voice mapping. | Accepted live cadence, transcription stack, review/recovery, uncertainty and voice output. |
| Sources | Text, links, readable PDFs; no images or OCR initially. | URL fetching/private links, durable snapshots, refresh and source-budget strategy. |
| Wireframes | Retire Design/wireframe feature. | Safe source/storage migration and removal boundaries. |
| Figma | Keep current transfer; reverse import second release. | Controlled refresh release timing and edited-copy conflict contract. |
| Platform | Laptop/desktop browser first, Vercel acceptable. | Verified supported browser/environment and streaming limits. |

**Separate the failure layers**

The recommended pipeline separates input capture/source extraction, contextual interpretation, graph operation normalization, integrity validation, incremental placement, connector routing, rendering/edit interaction, history/persistence and exports. The boundaries let us replay fixed model output through the parser, fixed graph data through layout, and fixed geometry through the editor. This is necessary to determine whether a given problem belongs to Claude/Groq output, the Mermaid parser, semantic rules, Dagre, handle assignment, measured node geometry, or interaction code.

A candidate renderer must solve a demonstrated requirement. Current custom nodes already render as React/HTML elements and editable edges as SVG paths. Paper's HTML/CSS approach is therefore inspiration for a clear machine-editable object model, not evidence that Arbor's React stack cannot be edited by AI. React Flow and layout/routing are separate responsibilities; replacing one without understanding the others can preserve the same failure.

The recommended near-term baseline retains Next.js/Vercel and React Flow during isolated diagnosis. Compare alternative layout/routing strategies using the same fixed graphs, including a mind-map organization pattern rather than forcing every view into LR flowchart ranks. Replace a layer if its evidence shows a requirement cannot be met reliably; do not undertake a framework/canvas rewrite merely to imitate a reference brand without evidence that the existing renderer blocks the agreed requirements.

**Provider boundary and comparison**

A proposed reasoning interface should accept map identity/revision, a bounded conversation/context selection, source text, focused selection, requested operation and assistance policy. It should produce assistant text, complete normalized graph changes, clarification requests and usage/error metadata. Provider-specific model names, message syntax and streaming event handling belong behind that boundary. Existing handlers directly use Groq; the brief's statement that abstraction already exists is not established by source.

Server credentials remain private. A prospective Claude integration normally needs a configured server API key/model, but Claude Console access and the initial $20 allocation are confirmed by Q37; the server key, model availability and speech capability still need to be verified. Track incremental testing and use a conservative application cutoff below the allocation with headroom for in-flight usage; application estimates must not be described as a guaranteed provider-side spending cap. No Claude calls or SDK installation occurred here. The provider may be changed for chat/generation/report reasoning while speech uses a separate service; removing Groq completely requires addressing its transcription and old image/vision consumers too. Wireframe reasoning is removed product scope and should not be migrated as a retained feature by default.

Comparison inputs must be identical where possible: same conversation/source context, requested graph operations, semantic rubric and renderer. Record malformed output, omitted/invented concepts, duplicate operations, preserved positions, latency and token/request usage separately. If old Groq access is unavailable, compare saved outputs and fixed graph fixtures for deterministic layers and label the provider comparison incomplete. A reliable structured shape is not proof of semantic accuracy.

Anthropic documents incremental SSE responses and partially streamed tool-input JSON. That supports a stream transport, but incomplete parameter deltas must not be applied as finished graph mutations. Build and validate complete operations before committing them; graph completeness and model interpretation still need application checks. [Claude streaming documentation](https://platform.claude.com/docs/en/build-with-claude/streaming), [structured output documentation](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).

**Graph document and operation contract**

Recommended map state separates semantic content from positions, styles, routing and view state. Each project/map has stable identity. A project can group maps without sharing their conversation or source context. A map owns its graph, conversation, source snapshots, settings, revision and recovery history.

A proposed mutation batch carries mapId, baseRevision, request/batch ID, operation IDs, origin (manual, typed AI, live AI or explicit layout), user-intent scope and operation dependencies. It supports node/edge additions, content updates, deletions and explicit geometry/style changes. Idempotency prevents repeated stream/retry events from adding duplicates. Revision checks prevent results based on an old snapshot from overwriting newer edits. Conflicting changes need a policy rather than a blind last response wins.

A batch is complete only when endpoint references and operation dependencies are valid. Partial review can group dependent changes, such as an edge requiring an accepted new node. Rejecting one item must not leave invalid references. Single-node/disconnected maps, cycles and wide branches can be valid brainstorming content; integrity validation checks identifiers and references without enforcing the old actor/process/decision semantics or silently dropping meaningful content.

Preservation is an explicit contract: content operations do not reposition/recolor existing objects. Position/style/routing changes require an explicit request or Tidy Up origin. New nodes are placed around relevant anchors using measured bounds and collision handling. Routing may adjust necessary endpoints after a moved node, but must preserve user-authored intent and avoid collateral whole-map rearrangement. Computed layout metadata and explicit user styles should be distinct so stale crossing/depth values do not become permanent meanings.

**Mode-specific change application**

Typed mode uses a proposed preview/diff for every included AI alteration: additions, updates, removals and reconnections. The user can accept/reject all or a valid subset, with an optional auto-accept setting. The current proposal store needs ownership/revision and fuller preview support to implement that policy. Pending/accepted/rejected decisions should have a durable relationship to the map and request if history is promised.

Live mode shares the same normalized operation/integrity/preservation layer but its user-facing commit/recovery contract is not settled. It should not mechanically force an acceptance modal for every phrase, nor assume all destructive changes can commit with no feedback. Q39 now prioritizes distinguishing conversational discussion from build instructions; exact pause/recovery behavior should be refined through visible output. Assistance settings govern initiative and questioning, not graph integrity or style preservation.

Focused requests should carry stable focus IDs and intent at request start. A changed selection during a pending operation cannot silently reinterpret the old response's target. A stopped/deleted/switched map must reject late unrelated writes. Explicit user replacement is distinct from additive expansion; changing CTA wording does not change those semantics by itself.

**Live voice candidates**

| Candidate | Mechanism | Benefit | Main risks and boundary |
| --- | --- | --- | --- |
| Stable phrase updates — recommended first evaluation | Capture continuously, obtain meaningful completed speech segments, issue incremental graph batches at bounded cadence. | Can feel live without a model request on every syllable; easier committed-content boundary. | Cadence must meet the full live expectation confirmed in Q38; requires real speech/latency evidence. |
| Interim transcript updates | Reinterpret partial/corrected transcript windows, keep tentative operations and reconcile to stable text. | Earlier visible response to speech. | More duplicate/revision churn, cost and transient misleading content; needs tentative state and strong cancellation. |
| Integrated realtime speech agent | Maintain an audio interaction session and issue graph operations alongside questions/voice responses. | Potentially natural interruption and spoken interaction. | New service/protocol/browser/deployment complexity; reasoning provider change alone does not implement it. |

These are proposals, not performed spikes. The current MediaRecorder hook collects chunks but uploads only on stop. Such chunks cannot be assumed to be independently valid streaming audio requests. An actual transcription service/protocol, transcript correction behavior and browser microphone lifecycle must be selected and tested. Sonnet reasoning access is not automatically a continuous speech recognition service.

The candidate flow is listening → transcript segments → bounded interpretation queue → completed operation batch → integrity validation → revision-safe incremental placement/application → visible feedback and persistence. Maintain one logical map mutation stream, coalesce superseded input, bound in-flight work and expose backpressure/error state. Avoid shipping every unfinished token into permanent graph state.

Measure time from a spoken concept to a useful visible graph change, semantic precision, missing concepts, graph revision churn, request count, token usage, cost and user interruption. A shorter interval is not better if it creates unreadable churn or wrong assumptions. After stopping, a content-quality reconciliation can propose improvements using the full stable transcript while preserving established geometry/style; layout cleanup remains explicit.

**Uncertainty and assistance state**

Proposed state labels include listening, interpreting, updating, waiting-for-clarification, paused, stopped and error. The displayed state should tell users whether audio continues, graph commits pause, and what input resumes progress. Keep certain/uncertain/tentative content distinctions internally if the selected behavior needs them.

Q16 contains unresolved continuation behavior, and Q39 now suggests distinguishing conversation from build instructions with possible trigger phrases. Recommended design is a user-visible conversation/build state combined with contextual intent detection. Interpret negation, questions, hypotheticals and focused references; a keyword such as add is insufficient alone. Ambiguous mutations should ask or remain tentative, and silence must not automatically authorize destructive changes. Input capture and commit gating remain independent so clarification need not lose subsequent speech. This is a proposed behavior to validate with visible output, not a claimed completed policy.

Store the assistance level as user/map preference according to the selected settings design. Desired levels are full assistance, questions on key situations and strict question-led progression. Q40 confirms all three levels are required. Guided is the proposed initial default for review; exact labels/default have not been selected by the user. A live opinion should not interrupt continuously by accident; feedback pacing and spoken versus visual response require explicit design.

**Local project persistence and recovery**

Recommended schema adds project/map identity and explicit versioning around existing independent chats/maps. Migrate old sessions into compatible map records without deleting graphs. A project membership change does not merge content. All graph mutations, including edge edits, AI batches and undo/redo, should use the same history/persist path so A03/A09 cannot recur through a second setter.

The proposed persisted boundary includes project/map organization, graph content/geometry/style, chat, selected source text/metadata, assistance settings, active map and saved view state. Bounded undo/redo may persist to meet the user's recovery expectation. Pure transient state such as active microphone, network stream, hover, in-flight model text and drag intermediate events must not silently resume after reload. Exactly which selection/view details are restored is an implementation contract to document, not a reason to discard graph content.

LocalStorage is the accepted initial storage location, not a capacity guarantee. Writes should be coalesced at safe boundaries, flushed on relevant lifecycle events, versioned and recoverable; failed writes must be visible. Continuous dragging and AI streams should create logical history batches rather than enormous per-frame snapshots. Browser storage loss still needs an honest limitation and retained export pathway. Do not provision cloud/auth because Supabase/Cloudflare appeared as possibilities in Q21.

Source snapshots should live with the map where required, with content, origin URL/name, extraction timestamp, truncation/access status and optional refresh metadata. Q43 received a plain-language clarification; public-page text snapshots with private links deferred are proposed defaults, not confirmed requirements. No image/OCR intake is required initially. Source ingestion must use actual extracted text in relevant reasoning rather than append only a filename.

**Retirement and compatibility**

Planned wireframe removal includes /api/wireframe, DesignView, wireframe-store, old generation/menu/chat callbacks, per-session wireframe persistence fields and misleading text. Review old stored fields and their handling before migration; do not delete an old graph because it contains unrelated wireframe metadata. This source removal is explicitly desired, but not applied in this documentation turn.

Existing node/edge IDs, old colors, waypoints/corners and export version 1 need compatibility handling if changed. The historical brief's duplicate-ID defect is not adopted as a reproduced current finding; current manual copy and Alt-drag generate new IDs, while broader AI collision cases remain to test. Root code/source history and the latest user decisions remain separate sources of truth.

Controlled Figma refresh, if included, needs stable Arbor map/node/edge identities on imported layers, last-export revision/fingerprint and detection of edited Figma content. Q45 explicitly defers this work until export settings; refusal/copy/merge behavior can be resolved then. Existing plugin import creates a fresh group; it must not be labeled synchronization. Reverse import is second-release scope and needs its own mapping/compatibility design.

**Scale and deployment boundaries**

Infinite canvas means freedom of navigation and expression, not an infinite prompt or database. Keep the full graph locally while selecting focused neighborhoods, relevant sources and conversation summaries for bounded requests. Full-map operations such as Tidy Up or report export need their own capacity strategy. Graph neighborhood retrieval does not require a vector database in the first release; the user's AI-memory analogy is a product aspiration, not an architectural mandate.

Define measured graph/render/source/history/request budgets for representative graph/live workflows and grow them from evidence. Avoid arbitrary semantic caps that erase ideas. If a resource limit is reached, expose it, retain work and offer a continuation strategy. Streaming deployment limits, reconnect behavior and cancellation must be checked on the actual host/browser; the current Vercel URL was not verified in this session. Do not assume a long-running audio agent works because ordinary POST routes build.

**Reference research and its limits**

Google's May 19, 2026 announcement describes Stitch accepting voice/text and streaming work to a canvas while users steer iterations. It confirms the interaction reference, not Arbor's token economics, continuous-audio design or per-token graph correctness. [Official Stitch announcement](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-updates/).

Paper documents an HTML/CSS design canvas and MCP read/write access. Its HTML-paste documentation notes inline-style translation limits, which matters when reasoning about transferable object models. These support investigating clear editable structures; Paper's performance claims are its own, not a measured Arbor comparison or proof that replacing React Flow is required. [Paper MCP](https://paper.design/docs/mcp), [Paper HTML import](https://paper.design/docs/paste/html).

The external references are read-only research. No Paper/Stitch file, provider account, Google Doc or deployment was modified. No live speech/model cost benchmark occurred.

**Open target decisions and verification status**

Latest retained answers resolve the former deadline, initial model budget and scope priorities: the meeting is cancelled; Claude Console credit with about $20 initial testing is available; full live mode/all assistance levels are desired; conversation-versus-build intent needs a visible prototype; new formats/Figma refresh are lower priority. Q41/Q42 were deleted and must remain absent. Remaining details are credential/model/speech setup, tested live timing/feedback, intent/uncertainty handling, a proposed assistance default and later source-link lifecycle. These do not require another exhaustive questionnaire. The recommended next implementation milestone is reliable graph editing/persistence plus measured Claude generation before building the complete live loop.

All earlier A01–A20 findings remain open until addressed with recorded evidence. Their product implications are now better defined, especially permissive graph semantics, preservation, autosave, sources and provider boundaries. Historical build/lint results remain historical and cannot prove the target features. Documentation changes did not alter source, install dependencies, invoke paid AI, or deploy the application.

**October 27 reconciliation boundary**

Only maintained documentation was updated from the newest answers. No source, dependency, provider account or deployment was changed. Earlier checks are not fresh test results. The original professor deadline is superseded; future estimates should come from the selected implementation work rather than the cancelled schedule.


**October 27 verification — reliable-map foundation**

- Before final review, npm test passed 32 tests in eight files and npm run typecheck passed. Tests use the actual parser, integrity checker, stores, lifecycle bridge, request controllers, SDK and API routes. External Anthropic HTTP is replaced locally; no external inference is invoked by the automated suite. Microphone tests replace browser media devices/recorder objects and assert resource release.
- Browser verification on localhost:3000 created a rectangle, edited its label, reloaded, undid and redid after reload, created/switched independent maps, and restored the original graph. A second circle and connector were created. The connector's purple color, dashed stroke and Explore label remained after reload. A chat turn appeared once and returned a visible missing-Anthropic-key error without changing the graph. These are direct interaction checks, not assertions inferred from unit tests.
- npm run lint has zero errors. Nonblocking warnings remain in existing unused declarations, old data-URI thumbnails and generated plugin output. The minified vendored PDF worker is excluded. Node 26 emits a module.register deprecation warning from tooling; tests still exit successfully.
- The Figma plugin's npm run build:tsc passes after replacing the incorrect typeRoots configuration with an explicit @figma/plugin-typings types entry and removing unnecessary any casts. It produces the ignored code.js bundle. This confirms compilation, not import fidelity inside Figma.
- npm run build passed during implementation; a final post-review build will be recorded separately. No deployment or public-service validation has occurred. Existing dependency audits report vulnerabilities; no broad forced upgrade was mixed into this graph milestone.
- Credential presence-only checks continued to show no Anthropic key. Automated tests and the local missing-key request spent $0 in model credits. The initial about-$20 engineering-test allocation remains unused. A real model quality/cost/latency conclusion remains pending.


**Final review amendments**

The review found and the final repair pass fixed three additional active paths: Generate now submits pending readable attachments rather than only previously sent documents; connector gestures are cancelled on map activation changes and checked against an activation epoch plus endpoint membership; and parallel-edge removal uses stable edge IDs. Endpoint-only removal is accepted only when exactly one existing edge matches. The model graph context includes edge IDs, schema/runtime validation accepts an ID on remove_edges, proposal highlights target that ID, and graph application preserves all other relationships' identities/styles/routes. The resulting suite passed 37 tests.

A13 remains open: copy/paste does not yet translate a manually routed edge's absolute corner points. This is a known visual limitation in copied subgraphs, not a claim that routing preservation is complete. Export/Figma fidelity A14 remains open. Current loopback-only review does not establish authenticated deployment or account-wide spend enforcement. The initial about-$20 testing allocation remains unused pending credentials.


Final post-review commands all passed: 37/37 tests, root no-emit TypeScript, production build, and plugin compiler/bundle. Lint completed with zero errors and 16 warnings. Browser testing on the restarted loopback server confirmed the connector cancellation fix and preserved the existing graph. The four maintained documents remain the complete project documentation set. No external model call, deployment or Git publication has occurred.


**October 27 live verification after credential setup**

The user saved the key locally; presence-only checks and actual HTTP 200 responses confirmed configuration without revealing its value. The default claude-sonnet-5-5 model is available to this account. Four controlled synthetic calls covered direct graph generation, real editor generation, typed chat and a disconnected addition. The initial graph exactly matched the three requested labels, shapes and two labeled relationships. The addition retained every old node transform and connection. Browser undo/redo and reload recovered the resulting map/history. This is basic end-to-end evidence; report generation, arbitrary larger graphs and continuous voice were not live-validated in this checkpoint.

The server adapter now emits a Claude usage event containing only model/input_tokens/output_tokens after each provider response, including truncated responses that will be rejected. It excludes credentials, prompts, source content and response text. The new test checks that billable truncated responses are still counted and sensitive prompt content never appears in that event. All 38 tests, root TypeScript and production build pass; lint has zero errors and 16 existing warnings.

Controlled usage: 5,781 input tokens, 526 output tokens, estimated $0.016822 at [the verified base pricing](https://platform.claude.com/docs/en/about-claude/pricing). The broader observed server checkpoint, including three other chat calls and the initial pre-logging request, totals 11,236 input and 1,288 output tokens, estimated $0.035352. These are returned-token estimates, not an account-wide billing reconciliation. The prior credential-pending/$0 entries describe the earlier checkpoint and are superseded for current status. Detailed per-call evidence is in plan.md; no key is recorded in any maintained file.


**October 27 generation-after-chat contract repair**

The live-provider smoke checks initially missed an important boundary: Generate after a normal discussion ends its conversation array with an assistant reply. claude-sonnet-5-5 rejects that as unsupported assistant prefill with HTTP 400. This produced the user's immediate failure; it was not a 45-second timeout. A direct SDK probe and the local endpoint both reproduced the failure before repair.

The generate route now sends all conversation messages followed by an explicit model-only user generation instruction. Stored chat is unchanged. This contract applies whether the last stored turn was a user prompt or a Claude reply; neither side's content is discarded. The generation instruction is server-side request control rather than a new history message. Report generation already wraps its complete input in a user request, and typed Send already appends a user turn, so those flows retain their contracts.

Provider errors now have distinct public messages/statuses for request-format/options rejection, timeout, network connection failure, missing model, credential failure and rate limits. Safe diagnostics log only kind/status/validated request ID, excluding the raw provider body. Structured-output and graph-integrity failures still reject incomplete/invalid patches before application.

Verification: the exact assistant-ending conversation class now passes a regression test, and a real synthetic IA exchange generated four requested pages and three requested links in 3.37 seconds. All 41 tests, root typecheck and build pass; lint remains zero errors/16 warnings. plan.md records the before/after reproduction and individual token usage. Zen itself was not accessed during this repair because Computer access remained stopped; no browser-access success is claimed.

## October 28 Zen audit: current graph and editor

### Scope, source and evidence boundary

The local server returned HTTP 200 at localhost:3000. Computer access subsequently reached the actual Arbor tab in Zen. Concurrent browser activity initially interrupted actions; the user confirmed that Zen was idle. Exiting full-screen mode made the page's accessibility tree and native canvas actions available. This is direct use of the current intranet map, rather than an audit inferred from source or earlier test screenshots. Later native calls again reported no available window; those failed calls are not counted as successful checks.

The discussion describes an intranet for three locations, location-specific departments and broadcasts, and a shared core. The current graph includes 39 named nodes and 40 relationships: the original 15-node/16-edge draft, 18 department additions, and six Communications additions. These counts describe the visible discussion and graph tree, not a fresh export or storage-level reconciliation. The audit did not submit a new Claude request or spend additional model credits. Figma itself was not opened. Familiar Figma/FigJam gestures are a reference supplied by the user, not a measured competitor comparison.

Eight screenshots were saved and reopened for inspection under [artifacts/zen-audit-2026-10-28](artifacts/zen-audit-2026-10-28). These are exact local captures; no regenerated or reconstructed screens are substituted. Other temporary intermediate captures remain outside the repository and are not part of the accepted evidence set.

| Step | Task and observed health | Evidence |
| --- | --- | --- |
| 1 | **Read current graph — poor.** The root, location branches, departmental details and publishing question are difficult to scan as a whole. Very long routes share narrow corridors. The question's long text extends outside its small diamond. Both panels obscure substantial canvas area. | [01-current-graph.png](artifacts/zen-audit-2026-10-28/01-current-graph.png) |
| 2 | **Hide panels and Fit View — poor.** Hiding panels exposes the standard controls and minimap, but Fit View still leaves upper/lower parts outside the viewport. Zoom Out is disabled at this state. The minimap shows a very tall, narrow diagram. | [02-fit-map.png](artifacts/zen-audit-2026-10-28/02-fit-map.png) |
| 3 | **Select, move and undo a node — functional with clutter.** Selecting Headquarters reveals a prominent shape/color/icon toolbar above it. Dragging moves the node and its attached paths; one Command-Z restored that test movement. The styling bar occupies space needed to inspect nearby relationships. | Selection controls are also visible in [06-node-label-edit.png](artifacts/zen-audit-2026-10-28/06-node-label-edit.png). Intermediate drag/undo captures were inspected during use but are not included as retained report images. |
| 4 | **Edit node label — functional with a geometry jump.** Double-click enters editing and selects the label. The node becomes substantially wider while the input is present, shifting its attachment boundary. Escape exits editing. No replacement label was committed. | [06-node-label-edit.png](artifacts/zen-audit-2026-10-28/06-node-label-edit.png) |
| 5 | **Select and bend an edge — functional but hard to target.** Selecting the Headquarters-to-Departments connection exposes small segment handles and a color/stroke bar near the route. A segment drag changes the route; one undo restores it. Handles and controls are small at this overview scale, and controls compete with nodes/paths. | [07-connector-selected.png](artifacts/zen-audit-2026-10-28/07-connector-selected.png); intermediate bend/undo checked during use. |
| 6 | **Create a direct connection — functional with bad routing.** Dragging Headquarters' right handle to HQ IT's left handle creates the requested test edge. Its automatic path goes through the unrelated HQ Departments box. Undo removes the added edge. | [11-direct-connection.png](artifacts/zen-audit-2026-10-28/11-direct-connection.png), plus the fresh AX addition/removal of Edge from loc_hq to hq_it. |
| 7 | **Reconnect an existing edge — missing distinct endpoint affordance.** With the Headquarters-to-Departments edge selected, dragging at its target attachment toward HQ IT starts a new Departments-to-IT connection. The existing Headquarters relationship is not reconnected. The test addition was undone. | [12-endpoint-drag-attempt.png](artifacts/zen-audit-2026-10-28/12-endpoint-drag-attempt.png), plus the AX addition/removal of the extra edge. This tests the available node attachment gesture; it does not prove the behavior of an endpoint control that the UI never exposes. |
| 8 | **Activate Connector — misleading entry.** Clicking the toolbar control does nothing. Its tooltip says to drag it onto the canvas before choosing source and target. The scripted HTML drag did not activate the mode; that drag result is inconclusive for human HTML drag-and-drop. The drag-only design and missing click handler are confirmed in source. | Current toolbar in 01 and 12; fresh AX showed no mode banner after click; Sidebar.tsx and Canvas.tsx. |
| 9 | **Familiar selection and recovery shortcuts — inconsistent.** Shift-click selected HQ Departments without retaining the prior Headquarters selection. Command-Z worked. A Command-Shift-Z attempt did not restore the undone expansion; the Redo button did restore its six nodes and six connections. | [13-shift-multiselect.png](artifacts/zen-audit-2026-10-28/13-shift-multiselect.png), plus fresh AX of shortcut/button recovery. Key-event diagnosis still needs a focused regression. |
| 10 | **Tidy Up and layout guidance — insufficient.** The actual Tidy Up button rearranges the graph, but the tall narrow structure, long routes and incomplete overview remain. The current saved chat told the user to ask Generate for a top-down layout, followed by repeated no-change responses. The layout test was undone; the final recovery through the Redo button retained the user's latest Communications expansion. | [14-tidy-and-fit.png](artifacts/zen-audit-2026-10-28/14-tidy-and-fit.png); current chat AX and generation contract. |

The audit temporarily changed a node position, a route, two test connections and the full layout, then used recovery to remove those test changes. An additional restoration check briefly undid the user's last Communications expansion; the Redo button restored all six corresponding nodes and relationships. No chat was sent, map deleted or AI-generated replacement applied. Panel sizes, scroll position and viewport changed during inspection. Exact restoration of every rendered pixel or every geometry value was not independently verified through a baseline export; do not turn this audit into such a claim. Future mutation audits should first export an exact graph baseline and compare final content/geometry, in addition to checking recovery visually.

### Findings mapped to actual code

| Finding | Status and cause | Owning code |
| --- | --- | --- |
| A12 extension: geometry is approximate and routing ignores obstacles | Confirmed visual failures. Dagre gets constant per-shape dimensions, not measured label bounds. EditableEdge computes a smooth orthogonal path from endpoints without the boxes of unrelated nodes. Correct endpoints therefore do not guarantee a valid visible route. Color by graph depth and automatic dashing of crossings also remain heuristics. | src/lib/auto-layout.ts; src/components/nodes/MindMapNode.tsx; src/components/edges/EditableEdge.tsx |
| A17 extension: tools and shortcuts do not match expected editing | Click activation is absent from the draggable div used for Connector. Canvas has no C/V/H tool commands. Shift is not explicitly configured as the multi-selection modifier. Redo compares event.key with lowercase z despite a Shift modifier; the observed failure makes case normalization a regression priority, not a claim that every platform fails identically. | src/components/Sidebar.tsx; src/components/Canvas.tsx; src/app/globals.css |
| A21: all relationships participate in one hierarchy layout | Confirmed architectural limitation. getLayoutedElements sends all edges, including the publishing question's references, into one Dagre graph. No primary-hierarchy versus supporting-reference distinction exists. Tidy Up always requests LR. The semantic patch has no separate diagram/view intent. | src/lib/auto-layout.ts; src/components/Sidebar.tsx; src/lib/ai-contract.ts |
| A22: natural-language layout requests have no executable operation | Confirmed capability gap with misleading chat guidance. Generate can add/update/remove graph content; it has no layout operation or coordinate/style command. Pure additions preserve existing geometry by design. Chat can nevertheless suggest asking Generate for a top-down layout, yielding an empty content patch. This is not a provider outage. | src/lib/prompts.ts; src/app/api/generate/route.ts; src/lib/ai-contract.ts; src/lib/ai-actions.ts |
| A23: existing-edge endpoint reconnection is not wired | Confirmed missing handler and observed replacement gesture failure. Canvas supplies onConnect but no onReconnect. Custom edge selection exposes segment controls, not distinct source/target endpoint controls with a store transaction. Dragging a node handle creates another edge. | src/components/Canvas.tsx; src/components/edges/EditableEdge.tsx; src/store/mindmap-store.ts |
| A24: overview and interaction controls are not panel/zoom aware | Confirmed UI failure. Canvas uses default Controls/MiniMap positions beneath overlay panels and supplies no minZoom or panel-aware fit options. The installed React Flow source defaults minZoom to 0.5, matching the disabled Zoom Out state. Graph-space segment handles and edge toolbars shrink with the viewport, while node toolbars use a different scale behavior. | src/components/Canvas.tsx; src/components/edges/EditableEdge.tsx; src/components/nodes/NodeStyleToolbar.tsx; installed @xyflow/react/dist/esm/index.mjs |

### Audit recommendations (historical; implementation and verification follow below)

Retain Next.js, React Flow and Zustand for this pass. The observed defects occur in application policy, graph commands, geometry and UI configuration; they do not establish that React Flow cannot support the desired interaction. Keep a replaceable pure layout/routing boundary so a later measured comparison can justify an engine change if necessary. No new dependency is selected by this audit.

Separate four responsibilities: (1) infer requested diagram and graph meaning; (2) validate and apply identity-preserving content operations; (3) compute layout, ports and routes from actual bounds; (4) manage tools, selection, navigation and gesture previews. Every committed gesture or AI operation must still use the existing per-map transaction/history/persistence path. Preview pointer movement must not produce dozens of persisted history entries.

Optional organizational hints can distinguish primary hierarchy edges from supporting references and question nodes. Those hints must be independent of shape/color and backward compatible with existing maps. They must never imply that a question, cycle or disconnected node is invalid. Legacy graphs need a conservative inferred view, with an override, rather than an irreversible automatic conversion. The exact schema is a proposed implementation detail to settle within the layout task, not an already shipped contract.

Layout needs measured/estimated node bounds from one geometry service, a stable primary-structure arrangement, compact disconnected-component packing, collision checks and an explicit route calculation that receives obstacle boxes. Connector rendering and hit targets must consume the same path geometry. Store automatic route intent separately from manually chosen route constraints; translate constraints on subgraph copy and define how node/group movement affects them. A13 remains open until those cases are verified.

Add a stable-edge reconnect command that validates session ownership/endpoints, changes only the requested endpoint/handle and preserves ID/label/style. Its preview should leave the durable graph untouched; successful completion commits once, and cancellation restores the old connection. Provide a separate reset-route command instead of overloading endpoint dragging.

Expose layout as a real application action with scope (whole map, selection or branch), direction and unchanged-content invariants before allowing chat to promise it. Existing generation must remain additive/preservative unless the user's actual request authorizes a layout operation. Do not implement this using a substring match for tidy: hypotheticals, negation and discussion of layout must not mutate the map. Until execution exists, give accurate Tidy Up button guidance.

### Accessibility and evidence limits

Small route handles, low-contrast colored text, hover-only handles and very large automatic toolbars are visible accessibility risks. The draggable toolbar divs do not expose ordinary button roles/actions in the captured tree. This audit checked selected mouse/native-keyboard paths; it did not establish complete tab order, screen-reader semantics, contrast ratios, accessible alternatives for every gesture, reduced-motion behavior or browser zoom resilience. No WCAG compliance claim follows. Browser automation could not conclusively validate toolbar HTML drag-and-drop or continuous Space-drag panning. Live voice, Figma import/export, deployment and larger performance limits were outside this audit.

No source/dependency change, build, test-suite rerun, model call, commit, push or deployment occurred during this audit. The prior 41-test result remains historical. Current documents and the retained screenshots are the deliverables of this pass.

### Accepted screenshots in flow order

Step 1 — Starting view: panels, mixed relationship roles and a tall diagram make orientation difficult.

![Step 1: Current intranet graph and chat](artifacts/zen-audit-2026-10-28/01-current-graph.png)

Step 2 — Fit View after hiding panels: the minimap still shows content extending beyond the visible overview, with Zoom Out disabled.

![Step 2: Fit View still clips the large graph](artifacts/zen-audit-2026-10-28/02-fit-map.png)

Steps 3–4 — Node selection and text editing: the large styling bar covers context, and the input changes the node's width.

![Steps 3 and 4: Selected node while editing its label](artifacts/zen-audit-2026-10-28/06-node-label-edit.png)

Step 5 — Connector selection: small segment controls compete with a floating style toolbar near the source.

![Step 5: Selected Headquarters-to-Departments connector](artifacts/zen-audit-2026-10-28/07-connector-selected.png)

Step 6 — Direct connection: the added Headquarters-to-IT route passes through the Departments box. This test edge was subsequently undone.

![Step 6: Automatic connector route through an unrelated node](artifacts/zen-audit-2026-10-28/11-direct-connection.png)

Steps 7–8 — Endpoint attempt and toolbar: dragging at the selected edge's target starts an extra Departments-to-IT connection, while the Connector entry requires a drag-first workflow. The extra edge was subsequently undone.

![Steps 7 and 8: Endpoint attempt creates another connection](artifacts/zen-audit-2026-10-28/12-endpoint-drag-attempt.png)

Step 9 — Shift-click: Departments is selected without the previous Headquarters selection being retained.

![Step 9: Shift-click selection state](artifacts/zen-audit-2026-10-28/13-shift-multiselect.png)

Step 10 — Tidy Up followed by Fit View: arrangement changes, but the tall overview and long routes remain. The layout test was subsequently undone.

![Step 10: Tidy Up still leaves a difficult overview](artifacts/zen-audit-2026-10-28/14-tidy-and-fit.png)


## October 28 editor implementation and verification

This entry supersedes the audit’s “not yet implemented” status and the earlier A13 absolute-corner limitation. The user authorized implementation of all four tasks. The existing local branch and its earlier uncommitted foundation were retained; no commit, push, merge or deployment was performed. Exactly the same four project Markdown files are maintained.

### Runtime boundaries

- `editor-store.ts` contains transient Select/Hand/Connect mode, the next Tidy direction and a Fit request counter. Tool state is not part of the map, a durable user preference or graph undo history. C/V/H/Escape are canvas commands only when a text field does not own the keystroke. Uppercase Shift-Z and lowercase variants share the existing redo action. The pointer capture phase supplies Shift directly to React Flow’s multi-selection state, so selection does not depend on a separately delivered keyboard event.
- `CanvasNavigation.tsx` observes the canvas and visible left/right panels. It calculates usable insets, exposes zoom/Fit map/Fit selected and houses the shared node/connection property controls. Fit reserves 110 CSS pixels at the bottom. Node Style no longer floats over neighboring nodes. A selected connection’s label moves 24 screen pixels away from its segment handle so those targets remain independently usable.
- `canvas-geometry.ts` owns initial node size estimation, measured-size fallback, boxes, graph bounds and viewport fitting. The node renderer uses the same shape dimensions before measurement. Labels wrap; diamond/circle outer boxes remain square. Existing explicit icons/colors survive; the renderer no longer supplies a clipboard icon for every concept. Enter commits node text; Shift-Enter inserts a newline; Escape cancels. Editing alone leaves bounds unchanged.
- Node handle anchors remain 1×1 graph units, with a separate 24-screen-pixel hit area and an 8-pixel visible port. Enlarging a hit target therefore cannot move the connection attachment. Below 65% zoom, direct node ports are hidden because their hit regions can otherwise cover the entire small node. The click-based Connect tool works at overview zoom. Zoom in for direct port dragging and endpoint reconnection; the selected-edge inspector states this. This is a deliberate navigation/editing boundary, not a claim that tiny overviews support every detail gesture.

### Layout and semantic operation contracts

`auto-layout.ts` constructs a stable spanning forest for presentation while retaining all rendered relationships. Reference links and unresolved-question nodes do not determine the main IA hierarchy. Explicit concept roles, transition relationships and legacy Yes/No branches override a question-mark punctuation fallback, so a process decision remains part of the flow. Shape alone never determines role.

Automatic chooses TB when primary fanout is broad, otherwise LR. TB packs groups of at least three leaf siblings into vertical lists; disconnected components are packed beside the main hierarchy or into rows. LR uses Dagre with shared node dimensions. An explicit layout resets obsolete bends and parallel-routing metadata, chooses handles, preserves every ID/label/endpoint/chosen style and commits once. Repeated Automatic Tidy on the exact recovered IA is stable. Incremental additions keep existing geometry fixed, use the existing LR anchor placement and measured bounds, and fall back outside occupied bounds after a bounded local search. They do not silently reorganize an existing branch; use a scoped layout operation when that is desired.

`layout-command.ts` represents scope (`all`, `selection`, `branch`), direction (`AUTO`, `TB`, `LR`) and whether content is requested too. The explicit Generate action can execute a fully recognized affirmative geometry request locally. Supported examples include “Tidy the graph left to right”, “Please arrange the selected nodes top to bottom” and the audited complaint explaining unreadable connections. Known compound requests such as “Tidy the map and create a checkout step” use the content-generation path and carry the authorized layout with that patch. Negation, delayed approval, conditionals, contradictory directions and unrecognized tails do not become a free layout-only fast path. Ordinary Send remains conversational. This is a narrow grammar; it is not general natural-language command understanding or the future voice-intent system.

Selection/branch scopes capture selected IDs before the operation. Branch traversal follows outgoing non-reference edges, with visited-node protection for cycles. Outside nodes retain their objects. If a scoped arrangement would collide with outside nodes, the arranged group moves to free space beside the occupied bounds. No concept or relationship is dropped to improve the view.

`ai-contract.ts` and `prompts.ts` add optional concept/question/suggestion roles, optional contains/transition/association/reference relationships and stable-ID edge updates. Runtime parsing accepts old responses without `update_edges`. The generation route rejects a structurally invalid patch atomically. Validation checks updates/removals for conflicts and duplicates before validating added connections against their resulting labels. A label-only update preserves the existing connection’s identity and geometry. These hints are independent of the four shapes and do not invalidate disconnected brainstorming, repeated labels, cycles or large fanout.

### Routing, gestures and recovery

`edge-routing.ts` provides the shared orthogonal visibility-grid/A* router with a bend penalty. It receives padded node boxes and attachment sides, tries simple clear paths first, then searches obstacle-boundary coordinates. Endpoint stubs shorten when a neighboring node constrains the available gap; a fixed 28-unit stub previously overshot the gap beside Finance. Rendering uses actual node boundaries, independent of hit-target measurements. Selected connection endpoints use visible hollow controls aligned with React Flow’s real reconnect regions, whose hit radius remains 16 screen pixels. They are distinct from the filled node ports that start a new connection.

Endpoint completion validates the stable edge ID, endpoint membership and session activation epoch. Escape invalidates the intent and cancels the connection preview; a later valid mouse release cannot revive it. Invalid release leaves the original relationship intact. Reconnection retains ID, label and chosen style, resets old endpoint-specific bends and creates one history entry. Changing maps invalidates in-progress gestures. Direct handle dragging remains supported; React Flow’s separate click-on-handle connection mode is disabled to avoid a hidden pending connection during ordinary selection.

Segment movement previews corners locally. A valid release commits once; Escape/unmount/map activation cancels the draft. An invalid constraint falls back to a safe automatic route with a reset warning instead of silently persisting a broken bend. If no route is available for the supplied geometry, the UI exposes the blocked state; overlapping or adversarial geometry is not guaranteed to route successfully. Selected-path controls and the line’s hit area use screen-pixel sizing. General graphs can still contain crossings and shared corridors.

Paste translates internal route corners by the same offset as copied nodes. A group move translates an internal edge only when both endpoints move by the same delta; external constraints retain their original ownership. Workspace tests cover one-step group history; the actual Canvas keyboard regression covers copy/paste identity, translated bends, retained style and one undo. Native clipboard replay was blocked by the browser-control virtual clipboard, so that specific browser gesture is not counted as a successful manual check. Continuous Space-drag and Alt-drag timing remain outside the accepted manual evidence.

### Editable map backup

The existing Export dialog includes `MapFilePanel.tsx`. A version-1 Arbor JSON envelope contains the cleaned graph and excludes conversation, selection, measured size and proposal/drag preview state. The original Figma export cannot substitute because it omits connection IDs/styles/routes. Import validates the whole envelope, unique IDs, finite geometry, four supported shapes, string endpoints/labels, renderer-consumed optional data, manual point arrays, styles, roles and handles before replacing the graph. It rejects unsupported parent-node structure and oversized inputs (20 MB file, 1,000 nodes, 5,000 edges). Malformed bends such as `[null]` cannot reach the renderer.

An asynchronous read is owned by its map ID, activation epoch and component/read token. Closing the panel, starting another import or activating another map invalidates the old completion. A successful import replaces the graph in one undoable transaction and requests Fit. Download is graph-only; it is not a conversation backup or cross-device sync service.

### Accepted evidence

The full suite covers the four tasks, five Important findings from one fresh read-only review, and defects found through actual interaction. Six focused review regressions failed first, then passed: process decision layout, malformed renderer data, Escape-before-release, contradictory/delayed/compound layout wording, switched-map import and closed-panel import. Further failing checks covered Shift pointer selection, shared styling placement, overview port interference, close-neighbor stubs and reconnect-control alignment. The final command results are recorded in plan.md; lint’s remaining warnings are pre-existing unused bindings/legacy image usage.

The controlled live probes used only synthetic prompts, returned HTTP 200 and consumed 6,391 input/1,734 output tokens in total. IA: 15 nodes/16 relationships, 9.259 s; process: 6/6, 3.375 s; brainstorm: 5/0, 3.098 s. The IA retained all requested sections and kept publishing as an identified question/reference. The process retained the six steps, Yes/No branches and feedback loop. The brainstorm retained independent ideas, an unresolved question and a marked suggestion without inventing a sequence. These three samples do not establish representative production quality or latency.

Zen’s native control connection repeatedly returned noWindowsAvailable/screen-capture errors. Reopening restored page inspection and original-map download, but pointer use remained unreliable. The user explicitly approved the in-app browser fallback. A separate disposable map imported the exact 39-node/40-edge graph. Accepted successful checks include C/Escape, click-to-connect, Shift selection, group move/undo/uppercase redo, Hand panning, direct node-port connection/undo, stable-ID endpoint reconnection, invalid release, segment move/undo/redo/reload, Reset route, fixed-size diamond editing/cancellation, an explicit Generate LR layout, backup import/undo/redo/reload and exact native-export readback. The original Zen map was retained; its pre-edit graph backup was downloaded. Temporary test connections were removed by restoring the tidy baseline in the disposable map.

Measured exported bounds: original arrangement 988×3,522; current LR 1,120×2,648; compact hierarchy 2,724×1,024 graph units. The compact arrangement makes the three location branches and shared core visible side by side. The native post-reload export equals the saved tidy baseline exactly across all 39 nodes and 40 connections, including geometry and styles. Every original node’s data and every original edge ID/label/endpoint survived Tidy. At the original Zen-equivalent desktop dimensions, panels-open Fit placed all nodes between x=276 and x=1,034, with panels ending at x=240 and beginning at x=1,070; navigation remained below the map. A temporary viewport override used for this comparison was reset afterward.

Four exact screenshots are retained under [artifacts/editor-quality-2026-10-28](artifacts/editor-quality-2026-10-28): [compact overview](artifacts/editor-quality-2026-10-28/01-compact-overview.png), [selected connection controls](artifacts/editor-quality-2026-10-28/02-connection-editing.png), [fixed diamond label editor](artifacts/editor-quality-2026-10-28/03-fixed-label-editor.png) and [panels-open overview](artifacts/editor-quality-2026-10-28/04-panels-open-overview.png). The connection-control capture intentionally shows one temporary styled test relationship on the disposable map. The other overview captures represent the restored original content. No generated mockup substitutes for these screenshots.

### Remaining boundary

This completes the core graph/editor quality pass; it does not complete the entire product. Full continuous voice, assistance settings, project grouping, URL ingestion, enhanced Figma/export fidelity, smart alignment guides, complete keyboard alternatives, screen-reader/contrast/reduced-motion checks and deployment remain subsequent work. Native clipboard replay and continuous modifier-drag behavior need a later direct manual check. The finite graph fixtures do not establish unlimited capacity or worst-case latency. Existing saved maps keep their arrangement until an explicit Tidy/layout action. Local backups and the uncommitted branch remain available for review; neither is a published release.


Final verified commands on the delivered tree: 79/79 tests in 14 files; TypeScript exit 0; ESLint exit 0 with zero errors/16 existing warnings; production build exit 0; diff whitespace and local-document link checks passed. The temporary measurement probe was removed. The original questions.md content was verified as an unchanged prefix. The development server remains loopback-only on port 3000. No further implementation edits followed these checks; the last updates only record their results.


The final selection-scope check additionally pins that layout captures every selected node even when the composer passes the first one as semantic focus. Semantic focus and layout ownership are distinct. Its failing regression passed after repair, and the final delivered suite is 79/79 with all other command results reconfirmed. A final browser reload restored the original 39-node/40-edge test map and its whole-map overview.

## Free connector architecture and directionality — October 28

A document edge still owns its stable ID, source, target, label and data. Each end is exactly one of two forms: a nonempty real node ID with an optional cardinal handle, or the empty string plus a finite `{x,y}` in `data.sourcePoint`/`data.targetPoint`. A bound node and free coordinate on the same end is ambiguous and is rejected on native import and typed graph validation. This representation extends existing attached maps without a migration or visible placeholder concepts. `connector-endpoints.ts` centralizes validation, resolution, snapping, connection comparison/replacement, render adaptation and document bounds. `connector-geometry.ts` resolves both ends into the obstacle router. A free end has no artificial node-sized stub.

React Flow expects an edge to reference two nodes. The canvas adapter derives invisible, noninteractive one-pixel anchors for free endpoints, with explicit measurements and handle bounds so edges render even before any real node is measured. Anchor IDs are collision-safe and exist only in the view arrays. The canonical store, history, editable backups, AI context and exported node lists never receive them. The custom edge renderer resolves canonical edge geometry by stable ID instead of treating adapter IDs as concepts. Node-change filtering validates the generalized endpoint contract; unrelated free edges survive node movement, measurement, selection and deletion.

Endpoint gestures use a pointer controller with local previews, screen-sized controls and a two-pixel movement threshold. Dragging either selected endpoint previews a nearest-side attachment when inside a node or near one of its cardinal ports; otherwise it previews a free point. Alt forces a free point. Release commits one edge replacement while preserving ID, label and style and clearing bends associated with the old attachment. The gesture captures map activation epoch and a clean-document fingerprint. Escape, pointercancel, blur, unmount, a map switch, an intervening graph edit or release onto a panel/toolbar/overlay cancels instead. Click without movement creates no history. Arrow keys move the focused endpoint freely by one screen pixel, or ten with Shift. Direct node-handle creation also captures the activation epoch. Custom endpoint controls work at overview zoom; the older below-65% restriction now applies only to direct node ports, superseding the earlier node-only reconnect boundary.

Direction is source/start → target/end. `EditableEdge` creates a unique SVG marker per mounted edge with a filled outward triangle at `marker-end`, no `marker-start`, and `orient="auto"`. The marker tip coincides with the target and follows the path’s final tangent, including endpoint previews and manual route edits. Fill follows the current stroke/selection color. No arrow flag is serialized because target direction already belongs to the edge. This applies to old attached links as well as free drawings. Figma’s official reference is [Create diagrams and flows with connectors in FigJam](https://help.figma.com/hc/en-us/articles/1500004414542-Create-diagrams-and-flows-with-connectors-in-FigJam); Arbor uses its outward solid-arrow pattern without claiming the entire FigJam endpoint palette or interaction surface.

Free coordinates and bends translate during copy/paste. Fit and PNG share document bounds that include free endpoints, manual corners and real nodes referenced by selected edges. Tidy moves real nodes but preserves explicit free positions. A zero-node drawing is valid; layout-only AI commands explain that its endpoints are manually positioned rather than falsely reporting a layout. AI context carries explicit drawing coordinates and the model instruction forbids fabricating placeholder concepts. Native backups round-trip geometry exactly. Mermaid cannot represent unattached canvas coordinates: its controls show this limit and the exporter rejects such maps rather than silently omitting connectors. Figma JSON includes the free coordinates; the plugin passes them to native FigJam connector endpoints or uses them as vector anchors in Figma Design. Both plugin branches retain a target arrow; the vector fallback handles missing real node frames when naming a free connector.

PNG uses a Blob/object-URL download. The former data-URL delivery produced no download in the in-app browser despite successful image generation. The canvas transform is restored in finally on both success and failure, and editing handles are excluded from the image. Browser export of a zero-node drawing produced a PNG containing its dashed path, label and filled destination arrow. This evidence does not establish complete Figma export fidelity or live Figma plugin import; those broader limitations remain as recorded above.


Clipboard isolation is decided at copy time: endpoints whose node is outside the copied selection are resolved against the source graph and captured as free coordinates. This avoids missing or accidentally matching node IDs after a map switch. Selected copied nodes retain semantic attachment through paste’s new-ID mapping. The Figma plugin UI now accepts a zero-node payload only when it contains finite, fully free connectors; its actual form validation and message posting are tested alongside both implementation branches.

Current evidence is retained under [artifacts/free-connectors-2026-10-28](artifacts/free-connectors-2026-10-28): [directional connections](artifacts/free-connectors-2026-10-28/01-directional-free-and-attached.png), [selected movable controls](artifacts/free-connectors-2026-10-28/02-movable-endpoints.png), [zero-node PNG export](artifacts/free-connectors-2026-10-28/03-zero-node-export.png), and exact-equal before/after-reload native JSON backups. These are real local browser/export captures of a disposable map. Final source verification passes 108 tests, application typecheck/build, plugin typecheck/build, lint with 15 existing warnings, and diff whitespace validation. Browser clipboard command dispatch remains a driver limitation in this pass; Canvas regressions cover free-only and cross-map paste. Live Figma import and comprehensive accessibility verification remain unverified. No paid model call, additional Markdown file, commit, push or deployment was made during this follow-up.


### Connector center alignment correction — October 28

The selected endpoint controls and route-segment handles counter-scale to keep screen-sized hit areas. Their previous CSS transforms used the default central transform origin. With a 28-pixel endpoint control, this displaced the center by `14 × (zoom − 1)` screen pixels on both axes. At 216% zoom the displacement was approximately 16.24 pixels per axis, or 22.97 pixels diagonally. The visible dot inherited exactly that incorrect control center.

The correction sets an explicit top-left origin and left/top zero for these controls before applying the existing point translation, inverse zoom scale and centering translation. The route, arrow marker and control therefore share the same canvas point at any zoom, while the hit region stays screen-sized. Segment handles use the same corrected coordinate reference.

Node ports had a separate two-canvas-pixel radial inset: the handles were positioned inside the border’s padding box while routing used the node’s outer box. `MindMapNode` now owns an unbordered geometry wrapper of the shared node dimensions, with the bordered visual surface inside it and the handles as siblings on the wrapper. This keeps the cardinal ports on the outer boundary without compensating with fragile pixel offsets or changing document geometry.

A browser layout assertion failed before the fix with 22.97-pixel endpoint error and 4.32-pixel port error at 216% zoom. After the fix, endpoint/control-dot errors at 50%, 125% and 216% zoom were under 0.003 pixels; all four node-port errors were under 0.001 pixels. These checks use actual DOM rectangles and the rendered SVG path/viewport transform, not jsdom layout approximations. Evidence: [high-zoom corrected controls](artifacts/connector-alignment-2026-10-28/01-aligned-at-216-percent.png) and [before/after measurements](artifacts/connector-alignment-2026-10-28/measurements.json).


### Immediate layout selection — October 28

Sidebar layout `onChange` first updates `editor-store.direction`, then invokes the existing `handleTidyUp` action. Zustand updates this preference synchronously, and the callback reads the current store value, so the chosen direction is applied immediately without a stale render closure. The existing action handles the empty-map guard, animation threshold, whole-map `tidyGraph` transaction, history and Fit request. No separate layout path or duplicated algorithm was introduced. Tidy Up continues to reapply the current preference.

Two actual-Canvas regressions failed against the former preference-only dropdown and passed after this change: immediate TB/LR application with one undo step and content/style preservation; immediate Automatic application with free connector coordinates unchanged. Direct browser checks on a new four-node sample verified TB, LR and AUTO geometry immediately after selection without clicking Tidy Up. Undo after TB restored exact original node positions. AUTO matched TB for the sample root with three children. Evidence: [top-to-bottom](artifacts/layout-options-2026-10-28/01-top-to-bottom.png), [left-to-right](artifacts/layout-options-2026-10-28/02-left-to-right.png), and [geometry snapshots](artifacts/layout-options-2026-10-28/measurements.json).


### Selection-based connection context — October 28

`EditableEdge` derives whether its canonical source or target belongs to a selected real node. Either explicit edge selection or a selected endpoint uses the existing blue stroke/target marker at 2.5 canvas-pixel stroke width. Other edges retain their configured stroke. Node association does not set an edge’s selected flag, so it does not expose route/end controls or the connection inspector. The path and arrowhead share the same computed stroke, preserving directionality. Fully free drawings have no selected real endpoint; partly free connectors can highlight through their bound end.

`MindMapNode` uses a boolean store selector to derive whether an incident edge reaches a selected real node. Directly connected, unselected nodes receive a light blue visual border; the diamond polygon receives that same border color through its outer visual layer. The selected node keeps its stronger selection ring. An accessible description identifies the direct connection context. Stored data colors and geometry are unchanged. There is no additional focus store, persisted annotation, AI context property or history transaction. Changing the selected IDs automatically recalculates the incident links and neighbors, including the union for multiple selected nodes. Clearing selection restores each configured color.

Actual Canvas regressions cover incoming/outgoing and partly free arrows, matching arrowhead color, unchanged indirect/fully free links, direct neighbor colors, no implicit edge/node selection, preserved saved colors and zero new history. A second regression covers moving selection, Shift union and restoring colors after a primary pointer click on the pane. The test includes the real pointer down/up lifecycle because React Flow’s marquee pane clears selection on release. Both regressions failed against the former renderer and pass with the new rendering behavior.

Direct browser checks used the existing four-node sample: selecting Product highlighted all three outgoing arrows and child borders, selecting Research retained only its incoming arrow, Shift-selecting Research and Design highlighted exactly two edges, and clicking blank canvas cleared the context. No endpoint editing controls appeared for incident links. Screenshots: [parent and destinations](artifacts/node-highlighting-2026-10-28/01-parent-connections.png), [single child connection](artifacts/node-highlighting-2026-10-28/02-child-connection.png). [Selection state evidence](artifacts/node-highlighting-2026-10-28/selection-states.json) records the actual rendered colors and selected flags.

## Release target and packaging — October 29

The existing production target is https://arbor-ai.vercel.app, connected to the `main` branch of `mm-25/Arbor-AI`. The user authorized publication of the accumulated local foundation/editor version. GitHub's only newer remote commit updates the old README production link; retain that history while applying the intentional README removals and the existing four-document structure. Local `artifacts/` browser captures and JSON recovery fixtures are now ignored for release packaging. Their references in these documents are local evidence locations. Runtime credentials remain server-only environment variables and `.env.local` remains ignored; it is not part of the GitHub release. Production chat/generation/report routes require `ANTHROPIC_API_KEY`, optionally `ANTHROPIC_MODEL`; recorded voice input additionally uses `GROQ_API_KEY`.
