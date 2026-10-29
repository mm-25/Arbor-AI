# Arbor AI Product and MVP

Last updated: October 28, 2026, America/Detroit. Reconciled with the retained answers, historical brief and direct Zen audit of the current intranet map.

This file owns current product intent, users, workflows, release scope, behavior requirements, success criteria, exclusions and decision history. It distinguishes the desired product from the code that exists today. The professor demo was cancelled in Q36; there is no active deadline. The goal is a product people can use regularly, including the full live experience and all assistance levels. Development is phased for correctness rather than shortened to meet a demo.

The only maintained project Markdown documents are [questions.md](questions.md), [plan.md](plan.md), product.md and [architecture.md](architecture.md). Update them in place. No extra PRD, MVP, roadmap, README, review or log document is needed. Original user answers remain verbatim in questions.md; this file translates them into coherent requirements without rewriting what the user said.

**Implemented foundation versus remaining release scope**

The October 28 audit confirms that reliable data mutations are only part of the foundation: the current larger map is still difficult to read and edit. The proposed graph-building and canvas interaction rules at the end of this file now define the next quality pass. They are design recommendations grounded in observed behavior, not a claim that the new controls or layout already exist.

The October 27 local branch implements reliable typed/editor foundations: structural graph patches, retention of disconnected/repeated-label ideas, stable existing geometry/style on additions, consistent autosave/undo/reopen, editable saved connectors, stale-result protection, retained readable document context, and a Claude server boundary for chat/map/report requests. Wireframes are retired and new image attachments are excluded. These changes do not mean the entire MVP is complete.

Live voice is still a future phase. The present microphone records until stopped, then transcribes; no continuous listening or conversation/build-intent automation has been delivered. All three assistance levels, project grouping, URL source ingestion and broader interaction/accessibility polish remain required later work. Existing export formats remain; new SVG/PDF and Figma refresh remain low priority. The first measured real Claude trial now passes: typed chat, exact graph creation and an isolated addition with preserved existing positions. Controlled usage is about 1.7 cents at verified base rates. Broader model quality/latency evaluation remains pending; no deployment has occurred.

The typed interaction currently uses an explicit Generate action. Additions apply immediately and can be undone; updates/deletions create a proposal with Accept/Reject. A manual edit after generation starts or after a proposal is created requires regenerating before application. This is the existing typed contract made reliable; it does not settle the future assistance-level policy or live-mode intent controls. A save error is visible, retains in-memory edits, and must not be presented as successful durable saving.

**Authority and evidence**

The current authority order is: direct current user instructions and question answers; later explicit decisions resolving follow-ups; the historical brief where compatible; implementation evidence for claims about existing code; and labeled proposals for choices not yet made. The code is authoritative for what is implemented, not what the product should become.

The [linked project brief](https://docs.google.com/document/d/1MJaByO3PpJoAZLB5hcwHT4ZXQAGT1ocDW4kr0LnghHY/edit) was read through the connected Google Docs tool. The file is titled Arbor AI_PRD and contains both a March 2026 MapMind v1 draft and an April 2026 Arbor AI v2 comprehensive course submission. Its last modified timestamp returned by Drive was April 27, 2026. The user explicitly said much of it remains relevant but the product's functioning is changing. It is historical context, not a new implementation authorization.

The brief retains useful framing around thinking aloud, visualizing a mental model, contextual iteration and communicating to stakeholders. Several sections are hypothetical: personas, scenario success stories, commercial assumptions, a drafted press release and a mock external product review. They are not evidence of actual user research, a real public launch, installed analytics, revenue, press coverage or measured results. Market sizes and competitor limitations were not validated in this session and must not become current marketing claims.

| Historical brief statement | Current resolution |
| --- | --- |
| Architecture/system documentation is the primary framing. | Brainstorming first, architecture design second; convergent and divergent thinking should be apparent. |
| Five fixed semantic node types/colors. | Keep current four shapes; conventional meanings are defaults, not mandatory schemas or constraints. |
| Groq/Llama and inference speed as differentiator. | Replace current provider for reasoning and evaluate Claude Sonnet; compare quality with pipeline/layout factors separately. |
| A manual Generate Map loop and fixed proposal policy. | Typed workflow remains; desired live voice workflow is distinct and automatically develops the map. |
| Wireframes in MVP/growth phases. | Retire the Design/wireframe feature now. It remains in source until removal is implemented. |
| Figma integration outside the old MVP. | Retain existing Figma transfer; future controlled refresh and second-release reverse import are desired. |
| Public-beta claims, subscription prices and KPI targets. | Historical hypotheses, not accepted demo scope or current commercial decisions. |
| Claimed SVG export, continuous graph updates and complete autosave. | Not proven by current code. Actual limitations are recorded in architecture.md. |
| Claimed provider abstraction and duplicate-node bug. | The October 27 implementation adds a shared Claude server boundary; provider interchangeability beyond it is not implemented. Duplicate IDs must be rechecked; current copy/Alt-drag code creates new IDs. |
| User/session data as a training moat. | No current training/collection program is authorized; user prefers possible self-hosted models later without exploiting data. |

**Current product definition**

Arbor is a visual brainstorming workspace for people developing ideas, planning flows, producing content or PRDs, and resolving open questions. A user can construct a map manually, think with a typed AI conversation, or ultimately speak in a live mode while the map develops. The map is an evolving external representation of the user's thinking, not merely a final architecture drawing.

The first use is individual. A user develops their own map before bringing it to a team. PMs and product designers remain important examples, but the audience also includes software engineers, system architects and other knowledge workers. Do not constrain the initial experience to a single industry based on an exploratory comment in Q4. No industry vertical has been selected; automotive specialization remains superseded.

The user's product hypotheses are that feature-heavy diagramming controls can be overwhelming and that ordinary question/answer waiting interrupts active brainstorming. Lucidchart is a reference for clean understandable diagrams and connector editing, while its breadth of controls is not the desired barrier to entry. These are the user's experience and hypotheses, not a verified competitive audit. Arbor should provide meaningful control through understandable actions and progressive disclosure.

The intended outcome is a map the user can immediately understand, scan, navigate and edit. It should communicate their described concepts and relationships accurately and support further thought. A generated artifact that requires many semantic corrections, arbitrary repositioning or connector repair has not delivered the core value, even if it looks polished in a screenshot.

**Release layers and priority order**

| Layer | Goal | Scope status |
| --- | --- | --- |
| Next working milestone | Create, refine, edit, save/reopen and undo a clean map with dependable generation/connector behavior. | Recommended implementation sequence; no date commitment. |
| First usable release | Single-user desktop browser product with local persistence, understandable editing, typed AI and intended live workflow. | Requirements established below; some delivery placement and technical choices still open. |
| Second release | Include Figma-to-Arbor import. | Explicitly requested in Q28; detailed import/conflict contract not yet designed. |
| Later product | Real-time team work, mobile, richer inputs/integrations/MCP, custom conventions, cloud/auth options and possible self-hosted models. | Roadmap intent, not automatic current-release dependencies. |

The user's final priority order in Q34 is: correct map generation first; live chat/voice mode second; overall product interaction third. Q5 also requires trying Claude Sonnet and examining layout/generation techniques. Quality and editability are foundational for live mode, so a constantly changing but wrong/broken map is not a successful live experience.

The former four-day schedule is superseded. Q38 requests the full live experience and Q40 includes all assistance levels. The user deleted Q41/Q42; do not recreate demo/scenario/scope questions. Build representative test examples from the confirmed workflow and deliver verified phases. Removing a deadline does not expand scope to unrelated future features.

**Diagram priorities and meaning**

The initial order is mind maps/brainstorming, process flows, then user journeys. Keep the existing rectangle, rounded rectangle, circle and diamond options. More shapes and per-chat appearance/convention profiles are future scope. The map can contain incomplete ideas, alternatives, loosely related concepts and disconnected content while brainstorming; forced flowchart completeness should not destroy that state.

Shapes and colors may follow familiar conventions but are not assigned rigid domain roles. Users may choose how to use them. The AI can use conventional cues when they help and should respect explicit user instructions about meaning. A user's square is not automatically an enforceable actor/process field, and a diamond must not be rejected solely because it violates a validator's default interpretation.

Dashed edges have no fixed required semantic meaning in the current release. The user suggested possible indirect relations or edge cases but explicitly did not want to lock that down now. Automatic crossing styles must not masquerade as user-defined relationship meaning. Color/depth schemes are experiments, not immutable product rules.

The user wants unrestricted expression within nodes and connections, not arbitrary content limits. The current 25-new-node/four-outgoing-edge caps, orphan deletion and semantic merging must therefore be reassessed. Valid resource limits still exist in storage, requests, models and rendering; they should be explicit and recoverable rather than silently changing the user's mental model. Infinite canvas is a navigation/product aspiration, not a promise of literally unlimited memory, tokens or performance. Capacity must be measured with representative fixtures chosen during development; the deleted demo-size question is not a dependency.

**Position and style preservation contract**

Q9 establishes a firm default: preserve every existing node's position and manual styling, and preserve previous AI-generated styling/positions too. Further generation should add or change only the content the user requested. Existing content must not be shuffled or recolored as an incidental effect of an AI call.

An explicit user request can authorize layout or styling changes, including a broad request to update everything. The permission is specific to that request's scope; it does not become permanent approval for all subsequent rearrangement. Tidy Up remains a deliberate organization action for a map the user assembled freely. Its purpose is readable arrangement, not changing ideas or silently redefining edge meaning.

New nodes should be placed coherently around their relevant context and without overlap. Process/user flows need understandable directional structure; mind-map branches should be organized according to the chosen view/task, not forced into a misleading execution sequence. These are acceptance goals. The specific layout/routing algorithm is an engineering choice to evaluate, not dictated by the user naming Dagre or React as possible sources of failure.

**Manual workflow**

A user should be able to start an empty map and build it without AI. Creation, selection, labeling, moving, connecting, reconnecting, routing where exposed, style changes and deletion need understandable feedback. Connectors must meet node boundaries logically and remain visible, distinguishable and editable. The user specifically reported lines running behind nodes, attaching unintuitively near corners, overlaps and difficult manipulation. Those are concrete problems to investigate, not reasons to assume a full canvas rewrite is necessary.

Keyboard shortcuts should cover obvious common actions and selected useful platform-specific actions. Command-Z and redo must act on the appropriate context: typing inside a field should not accidentally undo the graph. Potential Command-1/2/3 behaviors are suggestions, not an already selected shortcut mapping. Laptop/desktop browser use is the initial target; mobile is later. Browser compatibility for voice must be tested, not inferred from being a web app.

**Typed AI workflow**

Typed chat remains a supported workflow. A user describes an idea, asks questions, focuses a node or requests specific changes. The AI can help, critique, analyze logic and explain; it is not restricted to passive transcription. Its level of initiative should follow a configurable assistance setting.

Focused expansion is additive by default. In a process flow it may add substeps; in brainstorming it may add associated ideas. Replacements, updates and deletions must follow explicit user intent. A generic action such as Apply Changes may represent CRUD better than a permanent Expand label, but final wording should be designed and tested rather than recorded as a selected label.

For the typed/discrete workflow, the user wants visible proposed changes wherever AI alters the map, including additions. Users should be able to accept all, reject all or accept/reject parts. An optional auto-accept setting is desired. Structural dependencies matter: accepting an edge without its required new node must not produce an invalid graph; partial review needs a consistent change contract.

This policy supersedes current pure-addition auto-commit behavior as the only option. It does not automatically impose modal acceptance on every live update; the user explicitly described the live experience as different and not yet fully envisioned. Q39 now asks for a distinction between conversation and build instructions. A visible interaction prototype should establish how intent, review and recovery feel; the suggestion of trigger phrases is not a complete deterministic policy.

**Live voice workflow**

The desired live mode lets a user speak while Arbor continually interprets the spoken ideas and builds the map. It must be recognizably distinct from recording speech, stopping, waiting for transcription, then manually sending and generating. Typed mode need not pretend to update on every unfinished keystroke.

Product stages are: explicitly start live listening; show that input is being captured; expose useful transcript/interpretation feedback; make understandable incremental map changes; permit correction or focused elaboration; handle uncertainty without losing the user's train of thought; stop/pause cleanly; then refine or review the resulting map. The exact stage controls and timings are proposals requiring the remaining answers and feasibility evidence.

Q38 confirms full live mode now that the deadline is removed. Near-instant response is desired, but no exact latency or spoken-response contract was supplied. Begin with a real continuous-listening vertical slice, show meaningful incremental updates, and evaluate cadence and feedback with the user. Short stable-phrase updates are a proposed starting technique, not a chosen permanent restriction or a demo substitute.

Speed is more important in live mode than in typed testing, while content and graph validity still matter. The user suggested possible quality improvement after live mode ends. That can mean reconciling transcript coverage, unresolved questions and uncertain relationships. It must preserve existing geometry/style unless the user chooses cleanup, and must not turn a post-live quality pass into arbitrary global re-layout.

**Assistance and uncertainty**

Desired assistance options are full help, questions for key situations, and strict question-led behavior that proceeds from user answers. Q40 confirms that all three levels should be implemented. Labels and default remain design choices; Guided is a proposed starting default, not a confirmed user selection. A setting changes AI initiative; it does not erase the preservation contract or authorize ignoring source facts.

The user's statements about model knowledge describe confidence in the tool's potential, not a guarantee that LLMs lack uncertainty. The UI needs a visible way to ask about unresolved intent. Listening, capturing new thoughts, changing certain parts of the graph and committing uncertain changes are distinct activities. The user wants pauses that make continuation understandable, but also mentioned continuing when unanswered. Q39 adds conversation-versus-build intent as the key distinction. The proposed design makes that state visible, interprets context/negation rather than relying on isolated keywords, and asks before an ambiguous mutation. Exact interruption/recovery behavior should be refined from a working prototype.

Opinions and critique are allowed, including live mode, but how and when they interrupt depends on the assistance level. A context-dependent suggestion should remain a suggestion rather than an unconditional rule such as every action requiring prior login. Proactive thoughts, user assertions and confirmed choices should not be indistinguishably merged into the map.

**Workspace and persistence**

A project organizes multiple maps/chats. Their contexts are independent initially; project grouping is organizational, not permission to automatically blend every conversation/source. Cross-chat reasoning or linked-system modeling belongs later. The exact navigation can evolve while preserving this ownership boundary.

For the first release, local storage is sufficient because the user is testing and using the application personally. Accounts, multi-user backend, cloud synchronization and authentication are not required. Supabase for authentication and Cloudflare for data were tentative future possibilities, not an accepted infrastructure decision. Do not provision them just because they are mentioned.

Autosave is required: every supported graph/workspace change should update the saved state. Reload should restore the work as left, and undo/redo should be reliable across covered operations. The phrase “everything” is translated into a proposed persisted workspace boundary in architecture.md, including content, settings and view state; continuous recording/request state should not resume silently after refresh. Persistence of bounded undo history is proposed to meet the user's recovery intent and should be implemented with a clear storage budget.

Local storage is finite and fallible. Small JSON data does not eliminate quota, corruption, migrations or write errors. Save failures must not silently imply that content is durable. Any compression/debounce/storage-engine choice must protect the agreed reopen behavior and be verified with actual maps, not asserted from the simplicity of notes.

**Sources**

Initial sources are pasted text, links and readable/text-based PDFs. Images are explicitly excluded for now. OCR/self-contained scanning is not required: scanned PDFs should explain the limitation and ask for searchable text or another supported form. Existing image code does not automatically mean it stays enabled in the product flow.

NotebookLM is the user's source-workflow reference, not a selected integration. Q43 was unclear to the user. It now includes a plain-language explanation: reading a pasted article versus merely saving its URL. Proposed initial behavior is fetching public-page text and saving it with the map; private/authenticated links are later. This is an engineering proposal to revisit during source work, not an accepted answer or a core-generation blocker. A link shown in the UI must not be represented as fully read if only its address was recorded. Extracted/pasted source text should be made available to relevant reasoning within the agreed map context; generated output must disclose truncated/unavailable context rather than silently relying on filenames.

Direct LLM APIs are acceptable for this initial version; no special enterprise isolation project is required. Keys must still remain server-side and sensitive values must not be committed or printed. A future possibility is self-hosted models under controlled infrastructure, with no use of customer sources as training material. This is a roadmap preference, not current provider behavior or a guaranteed data-residency promise.

**Outputs and integrations**

The editable map is primary. Keep existing PNG, Markdown report/PRD-style output, Mermaid and Figma JSON/plugin transfer. The user sees reports and design-tool transfer as useful communication around the map. Q44 explicitly puts new SVG/PDF format work at low priority; keep existing formats while the core is improved. Retaining exports does not automatically mean recreating every hypothetical feature in the brief.

Keep one-way Figma/FigJam import. The user also wants a controlled update to an existing imported map when its Figma version has not been edited, triggered by the user rather than automatic sync. That needs identities/revisions/conflict detection and is not current plugin behavior. Q45 defers controlled refresh to later export-settings work. Importing Figma work back into Arbor is explicitly desired for the second release.

Retire the Design/wireframe generation feature now. Planned removal includes its visible/dormant routes, stores, payload fields and obsolete callbacks, with a deliberate handling of any old stored wireframe data. Removal has not been applied in this documentation task. The feature must not accidentally return through old brief requirements.

Later integrations/MCP should let users work with chosen platforms without relying on those platforms' built-in AI. The protocol surface, permissions, reading/writing model and destinations are future design work. Clear internal graph operations can enable those future integrations; a complete MCP server or collaborative engine is not necessary scaffolding for the initial graph/live product.

**Generation evaluation and provider direction**

The user instructed replacing Groq for graph/chat reasoning and trying Claude Sonnet. That integration now exists and basic account access, chat and generation were verified October 27. The historical provider was Groq, not xAI Grok; user wording remains preserved in questions.md. Q37 confirms Claude Console credits and an initial allocation of about $20, tested incrementally; any increase needs an explicit new allocation. Usage evidence is recorded in plan.md. Recorded transcription still uses Groq; the future continuous-speech pipeline needs separate evaluation. No additional model call or spend occurred during the October 28 audit.

Semantic content, parsing/validation, node placement, connector routing, renderer geometry and interaction must be assessed independently. A more capable model cannot repair a parser that drops nodes or an edge route that runs through a shape. A layout engine cannot resolve incorrect relationships. React/React Flow versus another rendering approach is an evidence-based evaluation, not a confirmed replacement.

During testing, quality takes precedence over raw speed. For live mode, measure responsiveness alongside correctness and request/token use. Preserve an existing-model baseline if accessible or compare saved outputs/fixed graphs if its endpoint is unavailable. No A/B test has been run; do not attribute improvement to Claude until the representation and layout variables are controlled.

**Acceptance criteria**

| Requirement | Observable evidence |
| --- | --- |
| Meaningful generation | Representative descriptions preserve expected ideas, labels, relationships and branches; no silent losses from parser/validators. |
| Readable layout | No unintended node overlap; coherent directional flow where appropriate; paths meet logical boundaries and remain distinguishable. |
| Editable connectors | Users can connect, select, label and adjust supported routing without broken geometry or hidden paths. |
| Stable existing work | Further AI work keeps prior position/style unless the specific request explicitly authorizes change. |
| Contextual iteration | Focused additions attach meaningfully; independent maps do not leak context/results into one another. |
| Typed change review | Visible additions/updates/removals, all/none/partial review where included, valid dependencies, optional auto-accept behavior. |
| Honest live mode | Speech-driven updates occur during the session; state/errors/clarifications are visible; ordinary stop-and-submit is not mislabeled. |
| Recovery | Supported edits and accepted AI batches can undo/redo; refresh restores agreed workspace state; failed saves show a recoverable condition. |
| Sources | Supported text/readable PDF/link behavior is accurate about extraction, access and truncation. |
| Exports | Retained formats include complete legible content and meet their claimed downstream editability. |
| Clear interaction | A first-time intended user can identify start, edit, live/typed controls, focus, status and recovery without corrective narration. |

Numeric scale, latency and token-budget thresholds must come from actual tests, the $20 allocation and observed live behavior, not old coursework numbers. The infinite-canvas aspiration and preservation invariant can coexist with a measured finite benchmark.

**Roadmap and exclusions**

Single-user desktop and local persistence are the first-release boundary. Team real-time collaboration, native/mobile adaptation, cross-map shared reasoning, cloud/auth, self-hosted models, custom shapes/conventions, richer inputs and external MCP/integrations are later. Reverse Figma import is second-release intent. All assistance settings, project navigation and source ingestion remain product needs. New export formats and controlled Figma refresh are explicitly lower priority. There is no Friday delivery scope to resolve.

No billing plan, public launch, analytics installation, outreach schedule, enterprise compliance program or training-data pipeline is authorized by this documentation update. Historical free/Pro/Team prices, MAU/retention targets, market claims and staffing budgets are archived as brief hypotheses rather than copied into the current plan.

**Decision history and maintenance**

The initial October 12 review documented a general canvas and unresolved automotive comments. Later the user confirmed general systems thinking, regular use and PM/PD roles. The user then classified local edits as experiments, requested an answerable question file and limited maintained documentation to four files. The completed Q1–Q35 answers establish the expanded audience, brainstorming-first framing, mode split, provider direction, preservation requirements, local desktop release, project organization, source formats, removal of wireframes, integration roadmap and Friday demo priority. The linked March/April brief was read and reconciled rather than treated as fresh implementation evidence.

Maintain original answer text in questions.md. Add new decisions here with the question/source that established them. Record engineering choices as proposals until selected and implemented; architecture.md must show current versus planned clearly. Plan.md governs sequence and actual completion, not implied completion from this more concrete product specification.

**October 27 decisions**

Q36 cancels the professor meeting/deadline. Q37 establishes Claude Console credit and an initial approximately $20 testing budget. Q38/Q40 request the full live experience and all assistance levels. Q39 identifies conversation-versus-build intent and iterative feedback on visible output; trigger phrases are a possible aid, not an approved complete implementation. Q43 needs plain-language source behavior, now explained as a proposal. Q44/Q45 defer export enhancements. Q41/Q42 were removed by the user and are not recreated. These updates change the active plan; original answer text and historical evidence are preserved.


**Foundation acceptance boundary after review**

Generate accepts an unsent text turn, pending readable documents, or an existing conversation. Text/document-only submissions are recorded exactly once. New additions preserve existing geometry/style; updates and removals remain reviewable proposals. A connection removal identifies the existing edge, so distinct parallel relationships remain distinct and retained styles/routes survive. A connector gesture cannot cross map activation boundaries, even when two maps reuse node IDs.

Historical refinement at this checkpoint: copied manually bent connectors retained absolute bend coordinates (A13). The October 28 implementation below translates bends on paste and internal group moves; see its current verification boundary. The full live workflow, assistance controls and projects remain future release requirements. This milestone is locally reviewable and tested; it is neither a public launch nor proof of live Claude quality.


**Live-provider acceptance update — October 27**

Claude credentials and default Sonnet access are now verified. The real editor generated the exact requested three-node process and then added one disconnected brainstorming idea without moving the original nodes. Undo, redo and reload preserved the resulting work. A direct conversational call returned a relevant PM onboarding clarification without claiming a graph mutation. This completes the initial credential/basic-provider gate. It does not complete continuous live voice, all assistance levels, broad semantic evaluation or deployment readiness. Those remain governed by the release scope above.


**Generate after discussion — verified contract**

A user can discuss an information architecture with Claude and click Generate immediately after Claude replies. Arbor must use the full discussion to build the map; it must not require the user to type a filler message merely to make generation work. The October 27 repair represents the Generate action as a final model request instruction while preserving every stored conversation turn. A provider request rejection is no longer presented as a timeout. This workflow now has an automated regression and a passing real IA-generation check; the user's existing chat can be retried without resetting it.

## October 28 graph-building and interaction contract

### Basis and status

The user asked for clearer AI building guidelines and editing that feels familiar from Figma. The audit used their actual intranet map in Zen, including its current discussion, rather than the earlier synthetic three-node test. The map contains three locations, departments, location broadcasts, a shared company-wide core, communications details and an unresolved publishing question. Screenshots and observed steps are indexed in architecture.md. No product code was written during the audit itself. The user then authorized the implementation with “Alright, why don't you do that”. The rules below govern that implementation. They do not supersede the user's original answers; the current delivery status and limitations follow below.

### Graph meaning: defaults that improve clarity without restricting expression

1. **Honor the requested diagram.** For an information architecture, the primary structure describes sections and their contents. For a process flow, it describes steps and transitions. For brainstorming, it describes concepts and their associations. Do not mix all three into an indistinguishable set of relationships merely because all use nodes and lines. Infer the intended view from the user's request when clear; ask only when competing interpretations would materially change the artifact.
2. **Preserve what the user actually said.** Separate confirmed facts, requested examples and unresolved questions. A request for typical departments authorizes suggestions; it does not establish that those departments actually exist in the company. Suggested content should remain identifiable as proposed. Unanswered publishing ownership must not become a confirmed site-navigation relationship.
3. **Use one main organizing relationship per view.** An IA should make parent/child containment easy to follow. Additional references and open questions can coexist, but should not determine the primary hierarchy. A process can retain cycles, exceptions and alternate paths; a mind map can retain disconnected ideas. This is a presentation policy, not a validator that removes content.
4. **Keep unanswered questions visibly separate from structural facts.** For new IA drafts, prefer an adjacent open-question area or an explicitly identified question node over making an unanswered question a structural ancestor of the site. Existing question nodes and their connections must be retained until the user accepts a change. Do not delete the current publishing diamond or its relationships to make the screenshot prettier.
5. **Write concise, parallel labels.** Use a short concept or page name for an IA node and a short action phrase for a process step. Siblings should use the same level of detail. Avoid turning an entire explanatory paragraph into a small shape. Preserve explicit user wording where meaning depends on it; a long required label should expand or wrap safely rather than be truncated or silently rewritten.
6. **Label relationships only when the label adds meaning.** Ordinary IA containment can use an empty label. Process branch conditions, dependencies, exceptions and cross-references should carry useful labels where needed. Never invent yes/no labels to satisfy a diamond convention. Do not replace all existing edges merely to remove redundant wording when an identity-preserving label update can express the requested edit.
7. **Use shapes and color consistently, with user override.** The existing four shapes remain available. Defaults can suggest a visual role, but shape is not an enforceable semantic schema. A diamond should not automatically mean an unresolved question, and a question need not be a diamond. Dark readable label text, restrained accents and optional icons are the proposed visual defaults. Existing choices remain until explicitly changed. Dashed lines must not be applied simply because the renderer struggles with a crossing.
8. **Avoid duplication without erasing legitimate repeated concepts.** Reuse a node ID when the user means the same existing entity. Preserve distinct IDs when equal labels belong to different locations or branches. Do not fabricate duplicate connections or additional nodes to simulate layout. Explicitly requested disconnected concepts remain valid.

### Layout and rendering responsibilities

The AI should choose concepts, relationships and useful organizational hints. Application code must produce readable geometry. Prompting the model to make a map tidy cannot substitute for bounds measurement, route calculation or working navigation controls.

For the current intranet case, the proposed overview starts at Company Intranet, then makes Headquarters, Location 2, Location 3 and Shared Company-wide Core distinct sibling branches. Each location consistently exposes Departments and Location Broadcasts. The shared core exposes Communications, HR and Training, and Resources. Department details and Communications details stay with their parent branch. The publishing question stays available as unresolved supporting context. The user can still choose a different organization; this is a layout recommendation for the existing structure, not a decision about the final intranet design.

- **Choose arrangement to fit topology.** A broad hierarchy needs a compact arrangement of subtrees, with a top-down option for this IA, rather than stretching every sibling into one tall left-to-right column. Direction is a view choice, not a semantic constraint imposed on every map. Merely changing LR to TB is not sufficient acceptance evidence; compare the actual result.
- **Measure the rendered shapes.** Node boxes, long labels, diamonds, circles and active text editors must agree with layout/routing bounds. Text should remain inside its shape, and entering edit mode should not unexpectedly double the node width and move its connections.
- **Reserve space for branches.** Sibling alignment and spacing should be consistent. New additions must avoid existing node boxes while preserving existing positions. If a branch cannot expand cleanly without moving old content, offer an explicit branch tidy action; do not silently rearrange the map.
- **Route around unrelated nodes.** A connector must meet the chosen node boundary, preserve an appropriate departure/arrival direction and avoid the interior of every unrelated node. Manual bends remain useful; moving connected nodes must not strand those bends or create hidden routes. A route cannot be judged only by whether its first and last points are correct.
- **Keep multiple relationships distinguishable.** Separate parallel routes and make the selected connection easy to trace from source to target. General graphs can require crossings; do not promise that every cyclic or nonplanar graph can have zero crossings. A hierarchy without cross-links should not need crossings. Arbitrary dash changes do not repair routing.
- **Make the overview reachable.** Fit View must fit the graph within the usable canvas, accounting for open panels and margins. The required zoom range must permit that fit. At overview zoom, provide orientation and navigation; at editing zoom, provide readable text and usable controls. An overview is not a promise that every label remains legible at every scale.
- **Distinguish geometry commands from content generation.** Generate adds or updates ideas. Tidy Up changes arrangement. Explicit Generate can now execute a narrow affirmative arrangement request, such as “Tidy the graph top to bottom” or “Arrange the selected branch left to right”. Ordinary Send remains conversational. Unsupported or ambiguous phrasing does not grant a geometry change. Chat must describe this boundary and the always-available Tidy Up control accurately.

### Proposed familiar editing behavior

| User action | Required result | Recovery and boundaries |
| --- | --- | --- |
| Click a node or connector | Select that object with a clear outline or highlighted path. | Clicking empty canvas clears selection. Styling controls must not cover the object or essential route handles. |
| Shift-click an object | Add or remove it from the current selection. | Use one shared selection indicator/toolbar for a group rather than a large toolbar per node. Preserve keyboard focus. |
| Drag empty canvas in Select mode | Draw a selection marquee. | Pan is a separate, clearly indicated action; Space temporarily activates it. |
| Hold Space and drag, or use Hand mode | Pan the viewport. | Releasing Space returns to the previous mode. Navigation never creates graph history entries. |
| Double-click a label or use an explicit Edit label action | Edit text in place without changing the node's geometry merely because an input appeared. | Enter commits; Escape cancels; ordinary text undo remains local to text editing. Multiline text behavior must be explicit. |
| Click Connector or press C outside text editing | Activate the connection tool immediately, with a visible active state and instruction. | Escape cancels. Do not require dragging a toolbar control onto the canvas before the first connection. Retain direct node-handle dragging. |
| Create a connection | Show a live preview, highlight the target, snap to a valid boundary and commit once. | Invalid release leaves the graph unchanged. Do not create a persistent duplicate after a failed gesture. |
| Drag a selected connection's endpoint | Reconnect that existing edge to the chosen node/side. | Preserve edge ID, label and style; use one undo entry. Invalid release restores the original relationship. Distinguish endpoint controls from node controls that create a new edge. |
| Drag a selected connection's segment | Move the intended segment, with endpoint attachments preserved and the resulting route still valid. | Use generous hit areas at all supported zoom levels. One drag is one undo action. Offer Reset route separately from moving the endpoint. |
| Move a node or selected group | Keep connectors attached and provide useful alignment feedback. | Existing route intent and group offsets remain coherent; one gesture is one undo action. Copy/paste must translate internal bends with the pasted nodes. |
| Press Command/Ctrl-Z or Command/Ctrl-Shift-Z | Undo or redo one graph operation when canvas focus owns the command. | Normalize letter case and modifiers. Buttons and shortcuts must invoke the same operation. Text fields keep normal text shortcuts. |
| Zoom or Fit View | Show the requested overview or detail without placing important content beneath panels. | Expose a zoom value and a reachable Fit action. Toolbars and hit areas stay usable instead of shrinking with graph coordinates. |

These are proposed interaction defaults grounded in the user's Figma reference. Figma itself was not opened or comparatively tested in this audit. No visual redesign, framework migration, custom-shape expansion or collaboration feature is implied.

### Acceptance for this quality pass

Use the current intranet structure as a representative regression case and include smaller process and brainstorming cases. A successful pass preserves all intended ideas and IDs; clearly shows the main branches; keeps question/reference context distinct; permits a full overview; avoids node overlap and unrelated-node route intersections; and makes creation, reconnection, selection, edit, undo and redo understandable through direct use. Test both full-map Tidy Up and incremental additions. A small happy-path graph alone no longer demonstrates readiness. Full keyboard, screen-reader, contrast and reduced-motion checks remain necessary before claiming accessibility conformance.


## October 28 editor implementation status

The quality pass adds explicit Select, Hand and Connect modes, C/V/H/Escape shortcuts outside text editing, normalized undo/redo shortcuts, and Shift multi-selection. Connector is a semantic button. Multiple selected nodes share selection feedback instead of each opening a full styling palette. Node styling begins with a compact Style control in the shared bottom inspector; connection properties use that same fixed region above navigation. The interaction table remains the acceptance target, including the manual checks that are still recorded separately in plan.md.

A shared node geometry calculation now controls shape rendering, label wrapping, initial layout, incremental placement and routing. Circles and diamonds use square outer bounds; editing a label uses the same box until a label is committed. Explicit icons are retained, while decorative default icons no longer repeat on every node. Question and suggestion metadata are independent of the four shapes. This metadata guides presentation and does not impose a validity rule on brainstorming or process graphs.

Tidy Up offers Automatic, Top to bottom and Left to right. The compact hierarchy uses stable node ordering and stacked groups of leaf items to make large IA branches narrower. It retains every node and relationship, including cycles, disconnected ideas, parallel links and existing question references. Tidy is an explicit geometry transaction: it may move nodes, choose attachment sides and reset old manual bends, but preserves IDs, labels and chosen styles. Ordinary additions keep existing positions fixed. If local placement is crowded, a new item can occupy free space beyond the occupied bounds without silently moving an existing item.

Fit map and Fit selected account for the open panels and reserve bottom space for controls. Navigation supports overview zoom below the old 50% floor. Small text at a whole-map overview is expected; use selection fit or zoom for editing. These controls do not write graph undo history. A dense cyclic graph can still have crossings. The routing requirement concerns unintended passage through unrelated node interiors, and cannot be represented as a universal zero-crossing promise.

Automatic connectors now route around node obstacles. Manual segment edits preview locally and commit at release only when their constraints produce a valid route. Reset route discards obsolete bends. Reconnecting an endpoint preserves the existing edge ID, label and user styling, resets constraints tied to its old attachment and commits once. Internal bends translate with a pasted or equally moved group; bends on external connections retain their original ownership. Valid recovery is evaluated through exact graph snapshots, not only a screenshot.

The existing Export dialog now includes Editable map, an exact graph-only JSON backup and import. It preserves node positions, stable connection IDs, styles and manual bends, and excludes conversation and transient selection. Import is all-or-nothing and replaces the current map in one undoable transaction. It is a local recovery aid for this editor quality pass, not a new cloud sync or general format roadmap.

The AI graph contract adds optional concept/question/suggestion node roles, contains/transition/association/reference relationships and stable-ID connection updates. New model instructions distinguish IA, process and brainstorming organization, preserve uncertainty, avoid redundant containment labels, and never fabricate semantic edits solely to satisfy a layout request. Three controlled synthetic live requests returned usable IA, process and disconnected-brainstorm patches; the evidence and token usage are in plan.md. This small sample does not establish unrestricted model quality, production reliability, accessibility conformance or full live voice readiness.


Current editing boundary after the free-connector follow-up: below 65% zoom, direct node ports are hidden; click Connect accepts nodes or blank canvas, and the selected connector’s own start/end controls remain available at overview zoom. Zoom in for direct node-port creation. This protects small node bodies from oversized invisible port targets. Endpoint controls are hollow circles on the selected connection, while node ports start a new connection. Selected labels move away from segment handles during route editing. Full keyboard alternatives, smart alignment guides, continuous Space/Alt-drag timing and complete accessibility verification remain later work; this pass should not be described as reproducing all Figma behavior.

The representative map now fits as a compact 2,724×1,024 hierarchy rather than the saved 988×3,522 arrangement. Its original 39 nodes and 40 relationships remain intact. Existing saved layouts do not change automatically when code updates; Tidy Up or an explicit Generate layout request applies the new arrangement, with Undo recovery. The original Zen map was preserved and the interaction checks used a separate imported copy. The four retained implementation screenshots and exact backup/reload comparison are indexed in architecture.md.


## Free connector requirement — October 28 follow-up

The user clarified: “the connector can be free, it doesn't have to be connected to a node at all times” and “the user should be able to move the endpoints of the connector around as well if they want.” This explicitly extends the previous node-only connector contract. A connector can have two attached endpoints, one attached and one free endpoint, or two free endpoints. Empty-space endpoints are canvas coordinates, not concepts or visible placeholder nodes.

Connect mode must accept both node and empty-canvas clicks. Selected connectors expose independently movable start/end controls. Releasing on a node attaches to that node’s nearest side; releasing in empty canvas places a free endpoint. Holding Alt bypasses snapping. A node-bound endpoint can be dragged away to detach, and a free endpoint can be dragged onto a node to attach. The edge ID, label and style survive those changes. A completed drag is one undoable edit; Escape, pointer cancellation, map activation changes or release outside the usable canvas cancels. Blank canvas is now a valid release, superseding the earlier invalid-blank-drop behavior.

Creation and movement preview locally before committing. Free connectors participate in selection, deletion, copy/paste, Fit, persistence, history, PNG and editable backups. Old attached-only maps remain valid. Tidy arranges real concepts and keeps existing free coordinates fixed. AI reasoning must tolerate free connectors without inventing placeholder concepts; generated semantic edges continue to reference real nodes. Existing attached-edge deletion semantics remain: deleting a node removes its still-attached connectors, while fully free connectors and unrelated connectors survive. Detach first when a drawing should outlive a node.


### Directional endpoint — October 28 follow-up

The user added: “You can add an arrowhead on one end of it to showcase the directionality. Refer to how figma does it.” Every connector has a filled outward arrow at its target/end, with no arrow at its source/start. The tip stays exactly at the target, rotates with the final route segment and matches the connector stroke color, including selection feedback. This applies to existing attached connections and new fully or partly free drawings. No new document flag is necessary: the target endpoint already defines direction. The selected endpoint dot is an editing control, not the direction marker; the arrow remains on the line when selection is cleared. This follows the solid-arrow endpoint pattern in Figma’s official FigJam connector documentation; the implementation does not claim to duplicate its complete endpoint-style palette.


### Free connector delivery status

Implemented locally and verified October 28. Press C or choose Connect, then click a source node or canvas point and a target node or canvas point. The editor returns to Select after creation. Click a connector to expose its two endpoint controls. Drag either dot onto a card to attach, or into empty space to detach/place it; Alt bypasses snapping. A target arrow remains visible when deselected and points along the final path segment. Editing label, stroke or route does not remove the endpoint coordinates. Attached nodes carry their attached ends when moved. Undo/redo restores endpoint ownership and geometry.

Copying a selected connector without copying its attached node captures that attachment as a free point at its current port. This makes the clipboard independent of the source map and avoids silently binding to an unrelated same-ID node in a destination map. If the node is selected and copied too, the pasted edge attaches to the new copied node. A copied free drawing receives new edge IDs and translated points/bends. Mermaid retains an explicit unsupported-format limit for any free endpoint; editable backup, PNG and Figma JSON support these drawings. Figma plugin form and implementation paths are covered by tests; live Figma execution remains unverified.

This delivery verifies the requested free endpoints, independent endpoint movement and one-ended directionality. It does not add whole-connector body dragging, start/both-end arrow options or the full Figma control palette. The broader product roadmap remains in the existing plan. Detailed current checks, evidence and limits are recorded in plan.md and architecture.md.


### Connector alignment refinement — October 28

Endpoint editing dots must have their centers exactly on the path’s start and arrow tip at every zoom, including below 100% and at high magnification. Segment handles must be centered on their route segment rather than drifting diagonally with zoom. The four direct node ports must lie on the node’s outer cardinal boundary, sharing the same geometry as the routed connector. Screen-sized hit targets remain constant in size as the canvas zoom changes.

The reported drift was reproduced and corrected. Real browser checks at approximately 50%, 125% and 216% zoom measured less than 0.003 screen pixels of endpoint/dot alignment error; node-port errors were below 0.001 screen pixels. This is rendering refinement of the existing connector behavior and does not alter endpoint ownership, map data, undo history, snapping or the arrow’s direction.


### Layout selector behavior — October 28

Selecting a different layout option immediately rearranges the existing map in one undoable edit and fits the result into view. No Tidy Up click or AI request is required. Automatic uses the current graph structure: after reference/question exclusions and spanning-forest selection, a node with three or more primary children selects the compact top-to-bottom arrangement; otherwise it selects left-to-right. Top to bottom places parents above descendants, including compact vertical leaf lists in wide branches. Left to right places parent/earlier nodes left of their children/later nodes. These directions organize the existing concepts; they do not change the map into a different kind of diagram.

Tidy Up remains a way to reapply the currently selected direction after manual movement. As a native select, choosing an already-selected value does not emit a change; use Tidy Up in that case. Layout preserves concept/relationship IDs, labels and chosen styles; it recalculates attached-edge routing and clears manual bends tied to the old layout. Explicit free endpoint coordinates remain fixed. Undo restores the previous graph arrangement; the selector itself remains a transient preference for the next layout action.

### Node connection highlighting — October 28

Selecting a node highlights every directly attached incoming or outgoing connector, including its arrowhead. The directly connected real nodes receive a lighter blue border so the relationship can be traced to its other end. Direction remains visible through the existing target arrow. Only immediate relationships are included; a child’s other links and more distant descendants are not highlighted unless their own node is selected. With multiple selected nodes, the highlighted connections are the union of their immediate relationships. A partly free connector highlights when its bound node is selected; a fully free drawing has no node association. Clicking empty canvas clears this context.

This is transient selection feedback. It must not select the neighboring nodes or connectors, open their editing controls, alter stored colors/labels/geometry, create an undo step, or appear as an AI/content edit. Explicit edge selection keeps its existing stronger editing behavior. Clearing or moving selection restores each element’s saved styling. No new setting or mode is needed.
