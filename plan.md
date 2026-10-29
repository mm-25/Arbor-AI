# Arbor AI Plan

Last updated: October 28, 2026, America/Detroit. Current basis: retained user answers, the historical brief, implemented foundation and direct Zen audit of the current intranet map.

This file owns priorities, work sequencing, scope gates, evidence, dependencies, execution status and handoff. Implementation began October 27 after the user approved the recommended next step. The reliable data/Claude foundation is implemented and basic paid model checks passed. The October 28 Zen audit exposes remaining graph readability and editing problems; repairing those is the recommended immediate continuation before continuous voice. Task status and verification below distinguish completed work from future scope. No deployment has occurred.

The only maintained project Markdown files are [questions.md](questions.md), plan.md, [product.md](product.md) and [architecture.md](architecture.md). Do not create separate plans, logs, reviews, PRDs, README files or handoff files. Update these four in place and preserve original question answers. The user's explicit four-file rule supersedes the earlier instruction to initialize dual-format project logs.

**Current outcome and milestone**

Arbor remains a brainstorming-first workspace for individual knowledge workers, with manual editing, typed AI and full live voice mapping. Initial product scope remains single-user, desktop browser and local persistence. All three assistance levels are desired.

The professor meeting was cancelled in Q36. The October 16 deadline and four-day schedule are superseded. No new deadline has been provided. Q38 requests the full live experience without a demo-driven reduction; that expands the quality target, not permission to implement unrelated future features.

Claude Console credits are available with an initial testing allocation of about $20 (Q37). Credentials and default Sonnet access were verified October 27; the measured calls and returned-token estimates are recorded below. Test incrementally and track usage. Increasing the budget requires a new explicit user allocation. No model call was made during the October 28 audit. The future continuous-speech provider and its behavior still need evaluation; Claude credential setup does not need reopening.

The order remains graph quality/editability first, live voice second, broad interaction polish third. Q39 adds an important behavior: distinguish conversational thinking/questions from actual build/change instructions. Trigger phrases may help, but a brittle keyword switch must not mutate the graph on negation, hypotheticals or a question about a possible change. Prototype this behavior visibly before locking the interaction.

**Documentation and decision ownership**

| Document | Current ownership |
| --- | --- |
| questions.md | Verbatim answers to Q1–Q35, current status labels, and answered follow-ups Q36–Q40 and Q43–Q45; Q41/Q42 were deleted by the user. No silent answer rewriting. |
| product.md | Brainstorming-first value, release boundaries, mode/assistance contracts, preservation, sources, workspace, exports and product acceptance. |
| architecture.md | Actual code and historical verification, finding IDs A01–A20, plus clearly labeled target architecture and comparison proposals. |
| plan.md | User-selected order, work decomposition, phased delivery, budget and completion gates, completion gates and handoff. |

Read the latest answers before asking anything again. Confirmed requirements do not need repeated permission; concrete technical choices or missing operational access must be resolved at the relevant dependency. A follow-up is not an excuse to halt all independent work. Do not turn a plan entry into a claim that its code already exists.

**Evidence reconciliation complete**

The entire linked brief was read: it contains a March MapMind initial PRD and an April Arbor comprehensive submission. Current answers supersede fixed semantic types, Groq commitment, wireframe requirements, old public-release milestones and blanket competitor claims. The source contains hypothetical personas, commercial targets, a drafted press release and mock review; those must not be treated as actual research, traction, press or launch evidence.

Useful continuing intent is externalizing thinking through iterative conversation and an evolving artifact. Current answers sharpen it into brainstorming/convergent-divergent thinking, live voice versus typed modes, flexible shapes, position/style preservation, local first-release persistence and explicit removal of wireframes. The old document's no-competitor/first-tool claims are not carried into current positioning.

Official Stitch and Paper references were consulted at the user's request. They support design investigation, not a proof of Arbor feasibility, cost or architecture. Details and primary-source links are in architecture.md. No external design file or service configuration was edited.

**Work completed and still pending**

| Work | Status | Evidence/boundary |
| --- | --- | --- |
| First-party code review | Complete for October 12 snapshot | 40 source files, about 9,844 lines, five APIs, plugin, configuration, history and local diff reviewed. |
| Live GitHub versus local comparison | Complete for review snapshot | Remote one README commit ahead; six pre-existing local source experiments. |
| Compiler/build/lint/plugin investigation | Complete as investigation | Historical results in architecture.md; failures/issues remain unresolved. |
| Key parser/store/layout reproductions | Complete as investigation | A01–A06 reproduced; no fix applied. |
| Four-file documentation consolidation | Complete | Prior review/log/README content incorporated; only four project Markdown files remain. |
| User answer reconciliation | Updated October 27 | Latest answers read; cancelled deadline, $20 allocation, full live scope and deferred exports reconciled; user deletions preserved. |
| Historical brief read | Complete | Both versions and all text read through Google Docs; no remote edit. |
| Live-mode/provider/reference research | Initial documentation research complete | Official public references checked; no implementation probe or token/cost result. |
| Claude reasoning integration | Implemented; initial live checks passed | Shared SDK adapter and validation tested locally; real Sonnet chat, graph creation, isolated additions and browser recovery verified October 27. Broader semantic/latency evaluation remains future work. |
| Generation/layout/connector foundation | Implemented and reviewed; October 28 core quality pass verified | Compact hierarchy, real geometry, explicit tools, routing/reconnection, layout commands and exact backup recovery now have regression and browser evidence. Remaining broader interaction/accessibility limits are listed below. |
| Live voice mode | Not started | New subsystem; current hook records until stop and inserts a transcript. |
| Project grouping and persistence refactor | Persistence foundation implemented; grouping pending | Per-map graph/history autosave and reopen now work. Project grouping and durable source/workspace extensions remain later scope. |
| Retire wireframe subsystem | Implemented | UI/store removed; endpoint returns 410; old saved HTML retained opaquely rather than executed. |
| Deployment verification | Not started | Existing URL and reported API expiry remain unverified. |

**Fixed scope and future scope**

First-release requirements include current four shapes, mind maps before process flows/user journeys, flexible use of shapes/colors, stable existing geometry/style, manual CRUD/editing, typed AI assistance, desired live voice mapping, consistent autosave/reopen, undo/redo, independent maps organized by project, text/links/readable PDFs and retained current exports. Deliver these as complete, verifiable phases rather than one large rewrite. The user deleted Q42; do not recreate a demo-scope question.

Images and background OCR are out for now. Scanned PDFs should receive an accurate explanation and request searchable text. Wireframes/Design generation are retired. No cloud backend/account system, multiplayer collaboration, mobile product, cross-map automatic reasoning, custom shapes/conventions, full external MCP or self-hosted inference is required for the initial graph/live work. Future cloud options are tentative and do not justify provisioning Supabase/Cloudflare now.

Figma import stays. Controlled user-triggered refresh and new SVG/PDF export work are explicitly low priority (Q44/Q45), to revisit with export settings. Reverse Figma-to-Arbor import remains second-release intent; the current set is PNG, Markdown report, Mermaid and plugin JSON.

**Immediate follow-up dependencies**

| Latest answer | Current decision | Next action |
| --- | --- | --- |
| Q36 | Professor meeting cancelled. | Remove date-driven shortcuts; no replacement deadline assumed. |
| Q37 | Claude Console credits and about $20 initial testing budget. | Credentials/default model verified October 27. Continue logging incremental usage and stop conservatively before the allocation is exhausted; keep credentials outside Markdown. |
| Q38 | Full live mode desired. | Prototype a genuine continuous-listening/graph-update loop, measure its responsiveness and quality, then refine. |
| Q39 | Conversation and build intent need to be distinguished. | Compare explicit user-visible controls plus contextual intent detection with phrase-only switching; recommend the former and test negation/ambiguity. |
| Q40 | All assistance levels included. | Implement the complete settings contract; recommend Guided as an initial default for review, not a user-confirmed selection. |
| Q41/Q42 | Deleted as irrelevant. | Preserve deletion and numbering gaps. Create technical test fixtures ourselves; do not resurrect demo questions. |
| Q43 | Source-link wording was unclear. | Plain-language explanation and proposed public-page text snapshots added to the existing question. Defer detailed source integration until the core works. |
| Q44/Q45 | New exports and Figma refresh are low priority. | Preserve existing exports; revisit enhancements together later. |

There is enough direction to proceed with concrete implementation planning. Remaining interaction choices should be explored in a small visible prototype, using the agreed product intent. Do not replace the completed questionnaire with another exhaustive question round.

**Recommended development approach**

Recommended sequencing is to stabilize the current graph/editor pipeline before attaching live updates, keep the Next.js/React Flow baseline unless measured failures justify replacing it, and introduce provider-neutral graph operations that both typed and live modes can use. This is a technical recommendation, not an accepted dependency rewrite. It follows the user's priority order and avoids assuming a model switch fixes all visual problems.

Replacing the renderer/layout/representation and building live mode simultaneously makes failures harder to diagnose even without a deadline. A reliable typed/editor milestone is an intermediate dependency, not a substitute for the requested full live product. Existing record-stop-submit voice input must not be relabeled as continuous mapping.

Read-only diagnosis and documentation are already within the current request. Source implementation should proceed under the user's actual next work authorization and the agreed behavior, with no redundant approval for tasks already authorized. Do not merge speculative architecture decisions into the code simply because this plan records them.

**Generation and layout workstream**

1. Establish representative inputs and expected concepts/relationships from representative fixtures chosen for the confirmed mind-map/process/journey requirements. Include a mind map, directional process, decision branches, cycles, disconnected brainstorming, long labels and focused additions.
2. Diagnose separately: interpretation/model output; parsing and schema normalization; semantic validation; placement; routing/handles; rendered dimensions and selection/editing; export geometry. Record where each failure enters.
3. Fix deterministic corruption before comparative model testing. A01 chain loss, A02 duplicated turns, A05/A11 forced semantic rules and stale A06 layout metadata confound provider comparisons.
4. Define stable graph operations with identifiers, origin/target map, revision, operation dependencies and user intent. Keep graph content distinct from viewport/layout/style state.
5. Compare Claude Sonnet output to available baseline content using the same request/graph contract and fixture expectations. If Groq is unavailable, use stored/fixed graph outputs to isolate rendering rather than fake a live A/B result.
6. Evaluate layout/routing on fixed graphs, independent of provider. Consider incremental placement, mind-map-specific organization and orthogonal routing alternatives only where they solve demonstrated failures.
7. Enforce existing-position/style preservation on all further AI updates, not only proposal acceptance. Tidy Up is an explicit geometry action, not a semantic rewrite.
8. Verify endpoint geometry, hit targets, selection, editing, reconnecting, movement, copied nodes/edges and custom routing with realistic zoom/label content.

A model-quality conclusion requires model evidence. A layout-quality conclusion requires fixed-graph evidence. A general claim that React, Dagre or Groq is the cause is not yet established. The local six experiments may be retained, refined or replaced based on this assessment; preserving current edits does not require keeping every behavior indefinitely.

**Live-mode workstream**

The desired pipeline is speech capture → transcription/segmentation → interpretation → validated graph operations → incremental map application → visible feedback/recovery. Text response streaming is only one optional transport component; it does not remove the need to finish/validate graph operations.

Three candidates are documented in architecture.md: short completed speech segments with incremental patches; overlapping/interim transcript interpretation with reconciliation; or a more integrated realtime speech agent. The recommended first candidate is short automatically detected stable phrases, subject to measured usefulness in the full live prototype. It offers a bounded way to test usefulness without a request on every syllable. This is not an implemented or approved cadence.

A live probe should measure perceived update latency, concept/relationship fidelity, revision churn, queue buildup, request count, token use and recovery behavior on representative brainstorming and process-flow scenarios. Stable transcript fragments can trigger incremental operations; unresolved/incomplete fragments should not become permanently committed facts. One map can have only a bounded amount of in-flight mutation work, and stale results must not overwrite newer edits.

Visible states should distinguish listening, interpreting, updating, waiting for clarification, paused, stopped and error. Which operations continue during uncertainty and whether the assistant speaks are open choices. Stop/cancel must release audio resources and prevent late results from changing another map. Refresh must restore saved content rather than silently resume a microphone session.

After live ends, a quality/reconciliation pass can check coverage/unresolved items. It must preserve positions/styles and follow the user's review policy. If it proposes a major content change, the user needs an understandable control, not an unseen replacement of the whole map.

**Persistence and workspace workstream**

Local first-release saving is accepted, not a provisional reason to add cloud services. Give project and map separate identity; each map owns its graph, chat, source snapshots and relevant settings. Projects group maps without mixing their conversations.

Every supported mutation should share the same history/persistence path, including edge labels/colors/routing, node edits, AI batches, session changes and undo/redo. Debounce continuous dragging into logical actions, not one history item per mouse movement. Saving can be coalesced but must flush at lifecycle boundaries and expose errors. Bounded history across reload is proposed to meet recovery intent; storage quota/migration behavior must be clear.

Persist content/view/assistance state within an explicit schema version. Do not persist an active stream as if it could safely resume after reload. Existing chat storage and old wireframe fields must migrate without discarding graph content. Retiring wireframes needs a documented old-data policy; source removal is currently planned rather than done.

**Sources, exports and interaction workstream**

Restrict the initial attachment flow to pasted text, URL sources and readable PDFs; exclude images and background OCR. Source text needs to reach graph reasoning, not just its filename. URL behavior must reflect Q43. Protect request credentials and explain inaccessible/truncated sources. Future provider privacy claims must not be invented from the user's willingness to use direct APIs now.

Keep existing exports functional; new formats are explicitly deferred as low priority in Q44. Figma controlled refresh requires identity/conflict design if included, not a fresh duplicate group labeled as synchronization. Remove the wireframe pathway and misleading Design references when implementation begins.

Interaction changes should make manual creation, typed/live mode, focus, CRUD actions, status, preservation, saving, undo and exports discoverable. Avoid a giant settings toolbox. Common keyboard shortcuts and context-sensitive editing are requirements; exact additional shortcuts and full settings coverage are still to design. This workstream includes the minimum controls necessary for live mode even though broad interaction polish is the third priority.

**Phased implementation sequence — supersedes the October 12–16 schedule**

| Phase | Concrete deliverable | Exit evidence |
| --- | --- | --- |
| 1. Reliable graph/editor foundation | Stable graph operations shared by manual/AI edits; deterministic parser/payload defects addressed; incremental placement, logical connectors, complete local save/undo. | Representative fixed graphs remain readable/editable; old positions/styles survive changes; reload and undo/redo work. |
| 2. Claude reasoning integration | Provider boundary, server-side Claude setup, valid graph changes and measured incremental testing within the initial $20 allocation. | Recorded semantic examples improve or reveal clear remaining failures; usage/cost known; malformed/stale changes cannot corrupt a map. |
| 3. Live voice vertical slice | Continuous listening → transcript → conversation/build decision → validated incremental graph update → undo/recovery. | A user can speak, ask a question, instruct a change, correct it and continue without manually recording/stopping/generating each time. |
| 4. Full assistance and live interaction | All three assistance levels, visible mode/intent/processing states, focus, pauses/clarification, cancellation and recoverable updates. | Negation/hypotheticals do not accidentally build; uncertain changes have clear handling; the user can see and control the system's behavior. |
| 5. Complete workspace and source workflow | Projects containing independent maps, durable source context for supported inputs, keyboard controls and consistent reopen behavior. | No context leakage across maps; text/PDF/source behavior is honest; project state survives refresh. |
| 6. Exports and integrations | Review existing export fidelity; later add low-priority formats, Figma refresh and second-release reverse import. | Each retained/enhanced export meets its actual fidelity and conflict contract. |

Phases 1 and 2 are related: establish fixed-graph/payload baselines before judging a provider, then use Claude examples to refine semantic handling. The first visible milestone is creating a clean map, adding/correcting content, manually editing it, reloading and undoing without losing or shifting work. Do not wait for live mode to discover that the underlying graph engine is unreliable.

The full live prototype is the next important design artifact once the graph layer is dependable. It should let the user react to actual listening/talking/building behavior. Recommendations are explicit controls plus contextual intent detection, a Guided default and stable phrase-based incremental updates to begin evaluation. These are proposed engineering/interaction defaults, not inferred user approvals or permanent limitations.

There is no date promise. Estimate subsequent work from measured progress and selected interaction behavior. No cloud, multiplayer, advanced export or framework rewrite should be added merely because the deadline is gone.

**Acceptance and validation**

For graph generation, verify content against representative inputs and compare model output before/after normalization. For layout/routing, use fixed graph data so model changes cannot hide geometry regressions. For preservation, compare old node positions/styles before and after additions, corrections and focused requests. For typed partial review, validate dependencies between accepted nodes/edges and clear conflict handling. For live mode, test continuously speaking, pausing, correcting, switching focus, interrupting, unanswered clarification, stopping, provider failure and switching maps.

Saving must cover manual edits, edge edits, AI changes and undo/redo. Test reload and active-map/project restoration, transient selection/view policy, source availability and bounded history where implemented. Do not describe Figma-like persistence merely because a Save button writes one snapshot.

Run root TypeScript, source lint, appropriate regression checks and the actual production build. Check the plugin separately because root tsconfig excludes it. Live provider checks need the configured available API and a budget; compiler success does not prove model accuracy. Browser recording, PDF/source ingestion and export capture need real runtime verification on the selected supported desktop browser.

Record results in architecture.md with scope, revision and limitations. Current October 12 checks are historical. No source fix/model test is complete because this plan is more detailed. Do not create additional Markdown test reports or logs.

**First usable release gate**

The product should support a meaningful initial map, coherent continuation/correction, usable manual editing/connectors, stable prior geometry, visible AI state and reliable local save/reopen/undo. Full live mode must actually update during continuous listening and distinguish conversation from instructions with understandable user control. Typed/manual workflows remain useful modes, not a fallback used to claim live completion.

All assistance levels are included. Exports already present must not regress; new SVG/PDF formats and controlled Figma refresh are lower priority. No professor demo, public launch, cloud account system, multiplayer, commercial tier or unlimited-size claim is an acceptance dependency. Current check results remain historical until rerun against implemented source.

**Operational findings**

A20 remains open: a token embedded in the local Git remote URL appeared in earlier diagnostic output. Rotation/removal was not performed or verified. Do not print secrets or paste new Anthropic credentials into these documents. The user's reported expired Groq API is a report, not a tested cause of every graph failure; semantic and rendering defects exist independently.

Current source contains image/vision and transcription paths tied to Groq, plus wireframe code that is now retired product scope. A reasoning-provider migration must account for those consumers rather than renaming one SDK and assuming all five APIs work. Speech-provider choice and exact model availability are explicit dependencies.

**Execution history and next handoff**

The first October 12 session reviewed code, compared GitHub, checked compilation/lint/plugin behavior and reproduced A01–A06 without changing source. The user confirmed general direction/regular use, then broad PM/PD context and experiments to reassess. The user requested exactly four verbose documents, and the prior review/log/README documents were consolidated into them.

The latest session reads all 35 user answers and the entire linked March/April brief, researches requested official references, updates the product/plan/architecture and appends Q36–Q45. Original answers are preserved; code changes remain at their existing state. No new Markdown document, external Doc edit, dependency installation, paid API call, deployment, commit or push is part of this update.

For the next work, read the retained Q36–Q40 and Q43–Q45 answers before repeating any question; Q41/Q42 are intentionally deleted. The next concrete development outcome should address the generation quality pipeline with representative data and the Claude integration boundary, then the live vertical slice. The intended product behavior is now substantially defined; only the named unresolved details need further clarification. Update current status when actual implementation begins and keep recommendations distinguishable from completed work.

**October 27 reconciliation**

The professor meeting was cancelled, removing the old deadline. Claude Console credit is available with about $20 for initial incremental testing. The user wants the full live experience and all assistance modes, suggests conversation/build intent detection with possible trigger phrases, and will guide interaction through visible output. New exports and Figma refresh are low priority. Q41/Q42 were deleted and remain deleted. Source-link behavior received a plain-language explanation rather than another blocking question. No application source changed in this reconciliation.


## October 27 implementation checklist

This milestone is a working typed/editor foundation. Continuous live voice, project grouping, new exports and the complete assistance settings remain later phases. The implementation must preserve existing user experiments until their behavior is deliberately replaced and verified.

- [x] Task 1: Deterministic generation. Add executable regression fixtures for chained Mermaid, later node definitions, isolated brainstorming concepts, repeated labels and arbitrary decision shapes. Replace destructive semantic filtering with structural checks. Preserve identifier spelling and retain every valid concept; reject malformed provider payloads rather than silently invent relationships.
- [x] Task 2: Map transactions. Make graph edits, edge labels/styles/routes, deletion, dragging, undo and redo share persistence/history. Restore per-map history after reload, report storage errors, and prevent selection/measurement noise from becoming edits. Place additions incrementally and select connector handles from geometry. Verify existing positions/styles survive AI additions.
- [x] Task 3: Claude boundary. Configure a server-only Anthropic client with an overridable model, structured graph output, bounded response tokens, validation and clear missing-key/provider errors. Migrate typed chat, generation and the retained report endpoint. Verify against a local HTTP substitute; paid live checks require a configured local key and incremental usage recording.
- [x] Task 4: Integration and verification. Send each user turn once, pass actual document text, ignore stale or wrong-map results, and route additive generations through the same graph operation path. Exercise reload/undo/session isolation, run the complete test suite, type checking and production build, and review the resulting diff. Update product/architecture/questions with verified behavior and remaining scope.

### Implementation interfaces and decisions

Task 1 produces the graph-change contract consumed by Tasks 2–4: add_nodes, add_edges, update_nodes, remove_nodes and remove_edges. Nodes retain stable string IDs; no deduplication by label or arbitrary shape semantics. Task 2 owns graph application, history and persistence; Task 4 must not call a global layout on an existing map. Task 3 validates model responses against Task 1 before returning them; Task 4 validates the originating session and graph revision before applying them.

Execution decision: use branch codex/reliable-map-foundation in the existing checkout. The checkout already contains six uncommitted user experiments and the four documentation files; keeping them in place avoids accidentally testing a clean historical copy. Do not reset, discard or publish this work. Automated skill defaults that create separate Markdown briefs/logs are superseded by the user's explicit four-file rule; checklist and execution evidence live here.

Review focus: storage quota failure, same-map edits while AI is running, switching away and back during requests, malformed model output, edge-drag unmount/session changes, cycles/disconnected graphs, and whether untouched graph geometry/style actually stays unchanged. A mocked provider verifies integration mechanics; it cannot establish Claude's semantic quality.

### Execution evidence

- Started branch codex/reliable-map-foundation from edd7c87 with the existing local edits intact. No commit or push performed.
- Credential presence checked without printing values: Anthropic key absent initially. User will configure it locally. Continue independent implementation; do not treat that answer as confirmation the key is already available.

- Task 1 verification: all six parser/integrity regressions were reproduced against the old implementation and passed after repair. New generations use one structured JSON patch contract; Mermaid remains supported by the parser and export workflow.
- Task 2 verification: memory-backed browser-storage tests cover autosave, reload with history, independent map histories, attached-edge deletion, connector styling, one history entry for a continuous drag, selection noise, and existing AI geometry/style preservation. Browser checks independently confirmed manual-node creation/label editing, reload, undo after reload, and map switching. Connector label, purple styling and dashed stroke also survived a browser reload.
- Task 3 verification: HTTP-substitute tests exercise the real Anthropic SDK adapter and generation handler, with no external model calls. Covered missing credentials, usage reporting, truncation, structural validity, malformed input and malformed provider JSON. Claude chat/generation/report now use the shared adapter. Live semantic evaluation is pending the user's local credential setup; this is not a claim of tested model quality.
- Follow-on regressions: upstream additions now precede existing destinations; measured node bounds protect long labels; Tidy Up clears obsolete route points/parallel offsets/crossing flags while preserving chosen edge color/stroke. Switching maps releases recorded-input microphone resources, including late permission completion. This remains record-stop-transcribe input, not continuous live voice.
- Environment: Vitest 4.1.12 was selected because Vitest 5 requires newer Node type definitions than this repository uses. A clean npm ci repaired an incomplete local dependency installation. Vendored PDF worker code is excluded from source linting. Figma plugin type annotations/configuration now pass its compiler and bundle command.
- Storage recovery: unreadable saved maps are retained on failed loading. An explicit subsequent new-map save first copies unreadable data to mindmap-chat-sessions-recovery; if that copy cannot be written, the original is retained. The UI exposes save/read failures. History is bounded to 50 snapshots per stack; browser quota is still finite.

- Extended integrity coverage rejects exact duplicate edges while permitting differently labeled parallel relationships, and reports invalid removal references. Source document content is reused by report generation as well as chat/map requests. Explicit Save now uses the session persistence path and strips transient selection/proposal preview data.
- Verification before final review: npm test passed 32 tests across eight files; root typecheck passed; Figma plugin build:tsc passed. Full lint has zero errors and existing nonblocking warnings. The production build passed before the latest small recovery/contract changes and will be repeated after review.


### Final independent review and resolution

A fresh read-only reviewer independently ran the 32-test suite and reproduced three Important issues. The implementation was then repaired in one test-first pass; no second reviewer was dispatched.

- Final: fixed pending documents being omitted by Generate — submitted readable attachments now enter the same exact-once user turn; the composer clears submitted content, and generation is available with documents alone. Regression “submits pending readable attachments exactly once when Generate is used directly” failed before repair and passed afterward.
- Final: fixed connector gestures crossing map boundaries — map activation changes cancel connector/menu state; commits check the activation epoch and endpoint membership. Regressions “rejects connector creation when either endpoint is absent” and “rejects an old connector intent even when the new map reuses both node IDs” failed before repair and passed afterward.
- Final: fixed removal of all parallel edges for one requested relationship — graph context/removal operations carry stable edge IDs, ambiguous endpoint-only removals are rejected, and the graph store removes only the identified edge. Regressions “rejects ambiguous parallel-edge removals and accepts stable edge IDs” and “removes a single parallel relationship by ID and preserves the retained edge's geometry/style” failed before repair and passed afterward. Undo restores the removed edge.
- The complete post-fix suite passed 37/37 tests. Final root type checking, lint and build are recorded below after their final execution. Existing lint warnings are not treated as errors or silently suppressed.
- Final: minor (deferred): copying/pasting an edge with manually placed absolute corners retains the old corner coordinates. Node/edge content remains undoable, but the pasted bends can be misplaced. Translate corners with paste displacement in a later editor refinement; A13 remains open.

### Review scope rulings and practical consequences

- Final: Ruling: real Claude quality, account model availability, latency and actual cost were not judged — no configured key or paid request exists; local provider substitutes validate mechanics only. Cost if wrong: the first real probe may reveal model-access or interpretation problems, so it remains the next operational gate before larger trials.
- Final: Ruling: continuous live voice, complete assistance controls, project grouping, URL ingestion and new exports remain subsequent phases — the approved sequence begins with the reliable typed/editor foundation. Cost if wrong: this local milestone does not yet satisfy the full product/MVP; do not call it a completed live product.
- Final: Ruling: public authentication and account-wide spending enforcement remain deployment work — nothing is published, and the development server is bound to loopback for local review. Cost if wrong: using this configuration as a public service would expose unauthenticated model endpoints; deployment remains gated.
- Final: Ruling: remote credential remediation remains the existing operational item A20 — the review did not inspect or print remote/config values, and secret rotation is not implied by a successful graph test. Cost if wrong: an exposed credential remains usable until its owner revokes it.
- Final: Ruling: full browser/Figma export fidelity and every edge-drag timing case are not established by the review — reported browser checks cover specific manual edits, reload, undo/session switching and connector style/labels; plugin checks cover compilation. Cost if wrong: complex exports/routing interactions can still need additional QA and repair. A13/A14 remain visible rather than falsely closed.
- Final: Ruling: automatic quota retries are not required for this milestone — a visible storage error plus explicit Save or a later edit provides a retry after freeing storage. Cost if wrong: the user must act to retry and must keep the tab open while edits are unsaved.

The working checkout and branch remain in place with uncommitted changes, including the user's original experiments. No merge, commit, push, pull request, deployment or cleanup of user work was requested or performed. All project documentation remains in the four agreed files.


### Final verification and handoff

- Final npm test: 37 passed, zero failed, eight test files.
- Final npm run typecheck: passed.
- Final npm run lint: zero errors, 16 nonblocking warnings. These warnings remain visible in unused existing declarations, legacy data-URI thumbnail elements and generated plugin output.
- Final npm run build: passed with optimized compilation, TypeScript, route collection and static page generation.
- Figma plugin npm run build:tsc: passed; ignored code.js bundle regenerated.
- git diff --check: passed before handoff; project Markdown inventory remains exactly questions.md, plan.md, product.md and architecture.md.
- Post-fix browser check: selecting a connector source, switching maps and returning cancels the old gesture. The original graph still has its single expected connector. The updated Generate control is available after one user turn.
- Local review server: http://localhost:3000, bound to 127.0.0.1. A preview screenshot is saved outside the repository at /tmp/arbor-foundation-check.png. The browser tab remains available for review.
- Anthropic key presence remains false at final check. No real Claude call occurred; model spend remains $0. Next operational action is local credential setup and a small synthetic Claude probe with token/model recording, followed by the continuous live-voice phase. No further product question is necessary to start that work.


### October 27 credential setup and first live Claude checks

The user confirmed saving the key locally. A presence-only check found ANTHROPIC_API_KEY populated and no model override. The development server loaded it successfully. Credentials were never printed, copied into documentation, or sent through chat. This entry supersedes the earlier credential-pending/$0 checkpoint; those earlier entries are historical records.

Four controlled live calls were made with synthetic, non-sensitive prompts:

| Check | Endpoint | Input/output tokens | Result |
| --- | --- | --- | --- |
| Initial three-node contract probe | /api/generate | 1,282 / 175 | HTTP 200 in 5.00 seconds including local request/compilation overhead. Exactly Research (rectangle), Synthesize (rounded-rect), Prioritize (diamond), with evidence/options relationships and no extra operations. |
| Same request through the real editor | /api/generate | 1,282 / 175 | Three nodes and two labeled connections rendered successfully. |
| Brief PM onboarding conversation | /api/chat | 1,659 / 102 | HTTP 200 in 2.60 seconds. A relevant clarification about onboarding stages/evidence; no claim of a canvas edit. |
| Add one disconnected Open questions circle | /api/generate | 1,558 / 74 | Exactly one node and zero connections added; all original labels/shapes/relationships retained. |

All controlled responses used claude-sonnet-5-5. Controlled totals are 5,781 input tokens and 526 output tokens. At the official base Sonnet 5.5 rates checked October 27 ($2 per million input tokens and $10 per million output tokens), their estimated base cost is $0.016822, about 1.7 cents. Pricing source: https://platform.claude.com/docs/en/about-claude/pricing . This is an engineering estimate from returned token counts, not a billing-console charge or account-balance measurement.

The restarted server also observed three other successful chat calls during this checkpoint. Their contents were not read for this budget record and they are not attributed to the controlled tests. Including those calls and the initial pre-logging probe, observed totals at this checkpoint were 11,236 input tokens and 1,288 output tokens, approximately $0.035352 at base rates. This is far below the initial about-$20 testing allocation but is not a claim about all other account usage.

Added minimal server-side usage logging so future browser calls can be counted: model, input token count and output token count only. Logging occurs before truncated-output rejection because those tokens can still be billed. No prompt, source text, key or response text is logged. A regression test reproduced the missing usage event, then passed after the change. The full suite now passes 38 tests; type checking and production build pass; lint remains zero errors/16 existing warnings.

Live preservation/recovery evidence: rendered node translations before and after the addition were identical: research (40,70), synthesize (340,70), prioritize (640,40). The new open_questions node was placed at (840,60). Undo removed only the new node; redo restored it. Reload restored all four nodes, both connections, conversation and available undo history. The separate synthetic test map remains available in the local editor. Preview: /tmp/arbor-claude-live-check.png.

No broad claim of model superiority or production latency follows from four small controlled calls. Model access and the basic typed pipeline are now verified. The next planned development milestone remains continuous live voice with conversation/build intent handling and the agreed assistance controls. No deployment, commit or push occurred.


### October 27 repair: Generate fails immediately after normal chat

User report: typed Claude chat worked, but Generate immediately showed “Claude is unavailable or the request timed out” after an information-architecture discussion. Computer/Zen access remained stopped, so the user supplied the error and timing. No browser-profile files or private saved conversations were accessed to bypass computer controls. Investigation used source, safe server access logs, and synthetic requests.

Root cause was reproduced before editing. Existing logs showed repeated /api/generate 502 responses in approximately 0.2–0.75 seconds while /api/chat succeeded. A direct SDK request ending with an assistant message returned HTTP 400 invalid_request_error in 365 ms: “This model does not support assistant message prefill. The conversation must end with a user message.” Sending a synthetic assistant-ending conversation through Arbor reproduced the generic 502 in 0.53 seconds. The normal Generate-after-chat path forwarded the conversation unchanged, so Claude's most recent reply was treated as unsupported assistant prefill. Earlier controlled generation probes ended with user messages and missed this workflow. The previous adapter then mapped the provider's rejection to a misleading timeout/unavailability message.

Repair: the generation handler preserves the complete discussion and appends one model-only user instruction to generate/update the graph. This is the explicit Generate action represented in the provider request, not a fabricated persisted chat turn. No user/assistant content is removed or duplicated in chat. The shared provider adapter now separates request-format rejection, true timeout (504), connection failure (503), missing model (503), rate limits and credential rejection. Safe failure diagnostics contain only kind, HTTP status and a validated provider request ID; provider bodies, source text and keys remain excluded.

Three regressions failed before repair and passed afterward: generation after a four-message user/assistant exchange; provider request rejection with safe diagnostics and no private error-body disclosure; and an actual SDK abort/timeout distinguished from a rejected request. The timeout test uses a controlled clock and the real SDK/fetch boundary rather than waiting 45 seconds. Full verification: 41/41 tests, root typecheck and production build pass; lint has zero errors and the same 16 existing warnings; git diff --check passes.

Live post-fix verification used a fresh synthetic IA conversation ending with Claude's reply. The API returned HTTP 200 in 3.37 seconds and exactly matched Home → Work, About, Contact: four rectangles, three edges and no update/removal operations. Usage was 1,366 input and 187 output tokens on claude-sonnet-5-5, estimated $0.004602 at the previously verified base rates. Rejection probes returned no usage counts. These are individual test records, not an account-wide balance. Request/result fixtures are outside the repository at /tmp/arbor-ia-conversation-request.json and /tmp/arbor-ia-conversation-result.json.

The local server was restarted on loopback with the fix. The user can retry Generate from their existing Zen conversation; no chat/map state was reset. No deployment, commit or push occurred. The four-file documentation rule remains intact.

## October 28 implemented iteration: readable graphs and familiar editing

**Goal:** Make the existing intranet map understandable as a whole and make basic node/connector actions predictable, while preserving the user's flexible diagram semantics and control over layout.

**Current status:** Implementation authorized by the user on October 28 ("Alright, why don't you do that"). Executing the four tasks below on the existing feature branch. Eight accepted audit captures are in artifacts/zen-audit-2026-10-28. product.md defines the behavior contract; completion requires new tests and direct verification.

**Approach:** Keep React Flow/Zustand and repair the graph policy, geometry and interaction layers in the existing application. Prompt-only changes cannot fix the observed node-intersecting route, missing reconnect handler or incomplete Fit View. A full canvas rewrite adds migration risk without evidence that the underlying library is the constraint. A different layout/routing engine remains an option only if the fixed-graph comparison in Task 2 cannot meet its gates.

**Priority adjustment:** Complete this quality pass before continuous live voice. This follows the user's existing requirement for correct, readable, editable maps and their latest explicit request. Streaming more updates into the current tangled view would not meet that requirement. Full live voice, all assistance modes and projects remain product scope; they are not cancelled.

### Constraints and review focus

- Keep the existing four maintained Markdown files; record decisions and results here rather than creating another spec, log or review file.
- Preserve existing node/edge identities, content, colors and positions unless the operation explicitly changes them. Tidy is geometry-only. A content update must not remove references merely to obtain an easier layout.
- Preserve the current typed Generate/review/recovery contract. Natural-language layout execution requires a real scoped command, not a claim in prose or an unguarded keyword trigger.
- Keep schemaVersion 2 maps readable. Optional new presentation hints need safe defaults and round-trip coverage. Do not conflate shape/color with a mandatory node role.
- Keep existing API credentials private, preserve the about-$20 engineering-test allocation and log only returned safe usage metrics. This audit spent no additional model credits.
- Review the real failure classes: long labels; questions/cross-links affecting a hierarchy; node movement after manual bends; crossing/parallel relationships; and input focus/Shift-modified keyboard events. Pin these in the task that owns the behavior.
- Before further mutation tests on a user's live map, export a graph baseline and compare final IDs, labels, relationships, positions and styles. Screenshots alone cannot prove exact restoration. Prefer a disposable reconstruction of this IA for repeated route/layout tests.

### Task 1: repair tool entry, shortcuts and truthful capability guidance

**Modify:** src/components/Canvas.tsx, src/components/Sidebar.tsx, src/components/edges/EditableEdge.tsx as needed for shared selection/tool feedback, and src/lib/prompts.ts. Add focused component tests alongside these modules or in the existing lib test suite when the behavior is a pure helper.

**Deliverable:** Clicking Connector immediately activates it; C activates it outside text editing; Escape cancels it. Shift-click extends/toggles selection. Canvas undo/redo handles uppercase and lowercase key values consistently, while inputs retain text shortcuts. Chat accurately distinguishes Generate content changes from the existing Tidy Up command. It must stop claiming that Generate can change direction/layout before the capability exists.

- [x] Reproduce the ignored Connector click, Shift selection replacement and Shift-Z mismatch with meaningful failing interaction tests. Include an input-focus case that must not activate a canvas command.
- [x] Use one explicit transient tool state, with clear active/cancelled feedback; keep map activation cancellation and endpoint epoch checks from the foundation.
- [x] Make the toolbar tool a semantic keyboard-operable button. Retain direct handle dragging and the existing drag/drop creation path while adding click activation.
- [x] Normalize command keys and explicitly configure multi-selection. Share selection feedback so multiple selected nodes do not create overlapping full styling bars.
- [x] Verify Connector click → source → target → one committed edge; C → Escape → no graph change; Shift-select two nodes → group move → one undo; Command/Ctrl-Shift-Z restores that move; and text editing remains unaffected. Record actual results here.

### Task 2: make overview and layout use the actual graph structure

**Modify:** src/components/Canvas.tsx, src/components/Sidebar.tsx, src/lib/auto-layout.ts, src/lib/incremental-layout.ts, src/components/nodes/MindMapNode.tsx, src/components/nodes/node-config.ts and src/lib/layout.test.ts. If organizational hints are introduced, update src/lib/ai-contract.ts and snapshot/storage tests in the same task. Keep extracted pure geometry helpers focused rather than moving the whole canvas into a new framework.

**Consumes:** Existing node IDs, edges, measured node sizes and the user's preservation rule. **Produces:** Deterministic positions and attachment-side suggestions for an explicitly requested view, without changing content. A panel-aware fit command consumes graph bounds plus usable viewport insets; navigation never writes a graph snapshot.

- [x] Build a disposable, deterministic fixture matching the three locations, shared core, department expansions, Communications details and publishing question. Keep all concepts and relationships. Add long-label, cycle, repeated-label and disconnected-idea variants.
- [x] Reproduce the current tall layout and incomplete fit before changing the algorithm. Record bounds, node overlaps, unrelated-node route intersections and the fit zoom required; do not grade only a screenshot at a favorable crop.
- [x] Centralize rendered/estimated shape dimensions. Prevent label input from changing bounds solely because editing started; let required text wrap inside the actual shape. Add coverage for long diamond/circle labels and measured-size fallback.
- [x] Separate primary layout structure from supporting links while preserving the full rendered graph. Implement a compact hierarchy arrangement for the IA, with consistent sibling ordering and an explicit direction choice. Compare at least the current LR result and a compact alternative on the same fixture. Do not assume a TB flag alone solves it.
- [x] Keep existing nodes fixed during incremental additions. If no reasonable free area exists locally, return an actionable recommendation to tidy the branch rather than moving existing content silently.
- [x] Expose Fit View, zoom value and navigation controls outside panel overlays. Permit the zoom required to reach the whole-map overview and calculate the fit inside visible canvas margins. Include panels-open, panels-closed and selection-fit checks.
- [x] Verify that the IA's main branches are immediately distinguishable, no nodes overlap, all nodes can be reached in the overview, and repeated Tidy Up is stable. Check source identity/style preservation and one-step undo on the entire graph, not only the first few nodes.

### Task 3: implement endpoint reconnection and reliable routing

**Modify:** src/components/Canvas.tsx, src/components/edges/EditableEdge.tsx, src/lib/edge-routing.ts, src/lib/connector.ts, src/store/mindmap-store.ts and the relevant layout/workspace tests. Keep graph-space route calculations pure so route validity can be tested without a browser.

**Consumes:** Measured node bounds from Task 2, existing endpoint/handle IDs, route constraints, edge ID/label/style, session ID/epoch and current history API. **Produces:** A stable-edge reconnect transaction and a shared path/interaction geometry that avoids unrelated node interiors.

- [x] Reproduce the Headquarters → HQ IT obstacle case with a fixed geometry test. Add a route/boundary assertion for moving nodes, including manually bent edges and parallel edges.
- [x] Wire onReconnect to a store command that preserves the edge's ID and unaffected properties. Validate both endpoints and owning map at completion, and keep previews outside durable graph state.
- [x] Distinguish selected-edge endpoint controls from node handles that start new edges. Snap to valid node sides, highlight targets and show the preview. Invalid release or Escape restores the original edge; map switching invalidates the gesture.
- [x] Give route calculation the unrelated-node boxes and endpoint directions. Route around those boxes rather than relying only on endpoint-facing handles. Use the same geometry for visible paths, labels and hit regions.
- [x] Make segment/endpoint hit regions usable in screen pixels across supported zooms. Keep compact contextual controls away from the selected path and offer Reset route separately.
- [x] Resolve A13's copied absolute corners: translating a selected subgraph must translate internal route constraints with it. Test node/group movement separately from copy/paste; external connections retain their intended ownership.
- [x] Verify new connection, endpoint reconnection, segment move, invalid release, cancellation, undo/redo and reload. Reconnection must change one relationship, preserve identity/label/style and use exactly one history entry. General graphs may have crossings; the gate is zero unintended passage through unrelated node interiors, not an impossible guarantee of zero crossings for every graph.

### Task 4: apply the semantic guidelines and expose actual layout requests

**Modify:** src/lib/prompts.ts, src/app/api/generate/route.ts, src/lib/ai-contract.ts, src/lib/ai-actions.ts, src/store/mindmap-store.ts and their existing tests. Reuse the geometry command implemented in Task 2 rather than asking Claude to emit arbitrary coordinates.

**Deliverable:** New generations follow the requested diagram's organizing relationship, keep confirmed/proposed/question content distinct and label only relationships that need labels. Explicit layout requests can invoke a scoped geometry operation without fabricating semantic node/edge changes. Existing content remains unchanged when the request is only to tidy.

- [x] Translate product.md's graph rules into the actual model instructions and runtime operation contract. Keep disconnected ideas, cycles, equal labels on distinct IDs and flexible shapes valid.
- [x] Add a representable layout intent with scope/direction and request ownership. Keep the content patch and geometry result distinct. A request for tidying must not be answered with a misleading already-covered content message.
- [x] Pin explicit requests, hypotheticals, negation, discussion-only turns, stale responses and map switching in tests. The ordinary typed Send action must not acquire unexpected automatic mutation behavior.
- [x] Evaluate controlled synthetic IA, process and brainstorming prompts against a written rubric. Check semantic coverage separately from layout on fixed graph fixtures, so model and geometry improvements are not conflated. Record input/output tokens and observed latency within the existing budget.
- [x] Preserve existing edge IDs for label-only updates and removals. Do not rebuild all connections just to remove redundant labels. Layout-only changes preserve every node/edge label, endpoint and chosen style.

### Completion evidence and handoff

Run relevant failing regressions before implementation and record their passing result afterward. After integrated changes, run npm test, npm run typecheck, npm run lint and npm run build once; broaden only for a new failure or concern. Repeat the numbered Zen tasks on the disposable IA and a small manually built graph, including a baseline-export comparison after recovery. Save a small before/after capture set alongside the existing audit images. The old 41-test result is not evidence that this iteration passes.

The pass is complete when the main structure is readable, the whole map is reachable, new routes avoid unrelated nodes, endpoint editing changes the existing relationship, expected selection/shortcut actions work, natural-language guidance matches real capabilities, and persistence/recovery preserves the same map. Full accessibility conformance and unlimited graph capacity require further checks and must not be claimed from this mouse-focused audit.

No implementation method, framework replacement or new paid service was selected by this audit. Continue on the existing local work within its already authorized scope; do not publish, deploy, commit or push simply because an audit is finished. No new product questionnaire is required.

### October 28 execution ledger

- Ruling: Continue in the existing codex/reliable-map-foundation checkout, retaining its uncommitted implementation and user experiments. A clean worktree at HEAD would omit that required foundation. A source-only baseline copy is retained outside the repo for this pass's review; environment files are excluded.
- Ruling: Use this plan as the execution ledger instead of creating skill-specific Markdown logs/specs/briefs. The user's four-file documentation rule takes precedence. No commit or publication is implied.
- Pre-flight: Task 2's measured bounds must also feed Task 3 routing; share one pure geometry module. Task 4 layout commands must call the same geometry operation as Tidy Up, preserving content and history. Tool/selection previews stay transient and preserve the existing map epoch checks.
- Task 1: implementation and focused UI regressions completed; later browser checks and review fixes are recorded below.
- Baseline: 41/41 tests passed. New click/C/Escape/uppercase-redo regressions failed before repair, then passed against the actual Canvas component. Tool state remains transient; Shift multi-selection is explicitly configured and a shared navigation/selection control replaces hidden default controls.
- Task 2 implementation: one measured/estimated geometry service feeds rendering, incremental placement, layout and routing. The 39-node/40-edge disposable intranet topology now passes compact bounds, spacing, content/style preservation and question-reference independence checks. The geometry is a stable forest for presentation; every original relationship remains rendered.
- Task 3 implementation: visibility-grid routing, stable-edge reconnect transactions, constant-size route handles, route previews and translated copied/group-moved bends. Tests cover the blocking Departments box, constrained endpoint sides, every IA relationship, ID/style preservation and stale gesture rejection. Browser verification remains pending.
- Task 4 implementation: a narrow affirmative layout-command grammar (through explicit Generate), scoped geometry commands, semantic hints and identity-preserving connection-label updates. Explicit tidy and connection-label review regressions failed then passed. Negation, conditional and discussion-only cases are covered; no automatic mutation was added to Send.
- Ruling: Add an editable map backup/import panel to the existing Export dialog. The old Figma export omits edge IDs/styles/routes, so it cannot provide the exact baseline/recovery required by the audit plan. The native graph JSON round-trip preserves those fields, excludes conversation/transient state, validates the whole import and uses one undoable transaction. This enables disposable fixture verification without paid AI calls or manipulating browser storage.
- Ruling: Reconnecting an endpoint resets obsolete manual route constraints while preserving edge identity, label and chosen style. Constraints tied to the previous endpoint can otherwise route through unrelated nodes. A reconnect is one explicit user geometry operation and one history entry.

- Additional regressions: edge-label updates are validated before duplicate connection checks; conflicting update/remove and repeated edge-update IDs reject the patch. Crowded incremental additions fall back beyond occupied bounds instead of returning a collision. These failures were observed before repair, then the focused 26-test set passed. A group-move test verifies translated internal bends, preserved external bends and one undo transaction.
- Fit regression: the lowest node could occupy the navigation strip in a tall overview. A failing bounds test reproduced it; Fit now reserves 110 CSS pixels at the bottom. The three geometry tests pass.
- Intermediate integrated verification: 65/65 tests passed; TypeScript passed. Production build passed before the bottom-inset refinement. Lint had no errors; one newly unused Sidebar binding was removed. Final checks follow the review/fix pass.
- Controlled live semantic evaluation (synthetic prompts only, three requests, no retries): IA 15 nodes/16 relationships, 9,259 ms, 2,158 input/1,029 output tokens; process 6 nodes/6 relationships, 3,375 ms, 2,101 input/452 output; brainstorming 5 nodes/0 relationships, 3,098 ms, 2,132 input/253 output. Total 6,391 input/1,734 output. The IA retained all requested sections, used blank containment labels and identified publishing as an open question with reference links. The process retained the requested six steps, Yes/No branches and the request-for-details loop. The brainstorm retained three independent ideas, one question and one suggestion with no invented sequence. All returned HTTP 200; no private source data was used. The small sample is a semantic check separate from deterministic geometry tests.
- Browser verification: after the user reopened Zen, Arbor’s page tree became readable. Editable-map download succeeded and a separate New Chat was created. Native pointer actions still returned noWindowsAvailable; keyboard/window recovery and one CUA reset did not repair that transport. A request to finish in the in-app browser is pending. These failed actions are not recorded as successful canvas checks.
- One fresh read-only final reviewer is inspecting this iteration against its source-only pre-turn baseline, as required by the execution skill. No implementation agents were used. Findings and repair evidence follow.


### October 28 final review, repairs and acceptance

The single fresh reviewer found five Important issues. All entered one repair/verification pass, with six failing regressions observed before repair:

1. Process decisions with explicit concept/transition semantics were demoted by question-mark punctuation. Explicit semantics and legacy Yes/No transitions now take precedence. The branching-process LR regression passes.
2. Malformed imported bends/renderer fields could replace and persist a graph before rendering crashed. Whole-file validation now rejects malformed point arrays, non-string endpoints/labels, unsupported fields and invalid style values before any replacement. Corrupt geometry/style regressions pass.
3. Escape left a reconnect epoch active. Escape now invalidates the intent and cancels the preview, so a subsequent valid release cannot commit. The actual Canvas callback/keyboard regression passes.
4. Prefix-only layout parsing could execute delayed/contradictory directions or discard compound content. The free local fast path now requires a fully recognized tail; negation/approval conditions are rejected, create/add compounds retain their content path, and the audited readable-connections explanation remains supported. Those regressions pass.
5. A late file read could overwrite a different active map or survive panel closure. Map ID, activation epoch and per-read/component tokens now guard the import completion. Both asynchronous regressions pass.

Browser testing found additional concrete defects during this same pass. Shift selection now uses pointer-event modifier state; node styling moved to the shared inspector after a floating Style button covered a neighboring node. At overview zoom, invisible port regions could cover node bodies, so direct ports are hidden below 65% and click Connect remains available. Handle anchors use fixed geometry separate from their hit area. Endpoint stubs shorten beside close neighbors, preventing the reproduced route through HR/Finance. Visible reconnect controls now align with the library’s outside hit targets. A selected label moves above its route handle after a native segment drag showed that the label intercepted it. Each meaningful geometry/selection defect had a failing regression; the label/handle overlap was reproduced and verified through the actual before/after drag rather than an implementation-mirroring test.

Accepted direct checks on the imported 39-node/40-edge IA: whole-map and selected Fit; open/closed panels; C/Escape; click source/target; Shift group selection; group move with one undo and shifted redo; Hand pan; direct port connection and undo; endpoint reconnect retaining edge identity, label and dashed style; invalid-release recovery; segment move with one undo/redo and persisted bends after reload; Reset route; unchanged 260×260-screen-pixel diamond bounds during label editing and Escape cancellation; explicit Generate “Tidy the graph left to right”; native backup import with one undo/redo and exact graph recovery after reload. Temporary test connections were removed by restoring the saved tidy baseline. The original Zen map was retained.

Exact exported comparison: recovered graph equals the tidy baseline across all 39 nodes/40 edges. All original node data and original connection IDs/labels/endpoints survive Tidy. Repeated Automatic Tidy is stable. Measured bounds are original 988×3,522, current LR 1,120×2,648, compact 2,724×1,024. The original graph’s tall layout requires about 21.7% zoom within the new desktop height allowance; the compact map reaches about 52.2% with panels closed at the original desktop width. At panels-open Fit, actual node bounds x=276..1,034 remain between panel bounds 240 and 1,070, with navigation below the map. The four screenshots are indexed in architecture.md.

Native browser clipboard replay reported an empty virtual clipboard before paste could be verified; it is not marked as a successful manual action. The actual Canvas keyboard regression separately covers copied internal bends, new IDs, retained style and one undo. Continuous Space/Alt-drag and complete accessibility conformance remain unverified. The source-backed defaults and Hand tool are not proof of those continuous modifier gestures. No second reviewer or implementer agents were dispatched.

The reviewer explicitly set aside direct pointer comfort, paid semantic quality, unlimited graph capacity and pre-existing/future export behavior. Ruling: accept only the specific parent-run browser checks and the three measured synthetic model probes as evidence; leave full accessibility, arbitrary-scale guarantees, voice and enhanced export fidelity outside this iteration. Cost if wrong: broader use can reveal issues beyond these finite checks, so this is a completed editor milestone and not a public-product readiness claim.

Ruling: Keep the verified work uncommitted in the existing feature checkout; do not present an unsolicited merge/push approval flow or delete its source baseline. The requested result is a concrete local implementation for review. Cost if wrong: it is not yet available from GitHub or a deployment, and the local changes must be preserved until the user chooses integration.

Ruling: The narrow affirmative layout grammar and the below-65% direct-port boundary are explicit current product limits. Unsupported wording uses the normal generation path instead of silently dropping a tail; overview users can use click Connect and detail users can zoom for port/reconnect gestures. Cost if wrong: some natural-language layout requests will need rephrasing or the Tidy control, and not every detail gesture is available at a tiny overview.

The earlier branch/four-file/backup/reconnect rulings stand. Their practical costs are, respectively: the review includes earlier local foundation work and remains uncommitted; these four documents are long because they also carry execution evidence; native backup/import adds a local validation/recovery surface and does not back up chat; reconnecting resets endpoint-specific manual bends, recoverable with Undo. No secret was recorded in a project document, no remote configuration was printed, and no commit/push/deployment occurred.

Final automated verification is recorded immediately below after the final commands. The temporary export-measurement probe was removed; it is not an extra maintained project file. Exactly four project Markdown files remain.


### Final command results — October 28

- `npm test`: exit 0; 79/79 tests across 14 files. The temporary exported-graph measurement probe is excluded from this maintained suite and was removed.
- `npm run typecheck`: exit 0; no TypeScript diagnostics.
- `npm run lint`: exit 0; zero errors and 16 existing warnings (legacy unused bindings and image usage). No new lint errors are deferred.
- `npm run build`: exit 0; production compilation, TypeScript and static-page generation completed.
- `git diff --check`: exit 0. All local links in the four documents resolve. The entire pre-iteration questions.md remains an unchanged prefix of the updated file, so original answer text and deleted numbering gaps are preserved.
- Local server remains listening on 127.0.0.1:3000. The app was exercised through the approved browser fallback. No remote integration action was taken.

Tasks 1–4 are complete for the core editor milestone under the explicit evidence limits above. Next, review the new graph/editor behavior in normal use; the already-planned live voice pipeline remains the next substantial product phase. Applying the new arrangement to an older saved map requires an explicit Tidy/layout action. The original Zen map and its downloaded pre-edit backup remain available.


Final scope correction: the composer supplies its first selected node as semantic focus. Layout previously preferred that single focus over the rest of a multi-selection. A new regression reproduced the incomplete TB arrangement, then passed after layout began capturing the full selected-ID set independently of semantic focus. Outside nodes remain unchanged. The full suite was rerun and passed 79/79; typecheck, lint and production build again exited 0. This supersedes the preceding 78-test checkpoint. A final normal browser reload restored all 39 nodes/40 edges and the whole-map overview was left open; the temporary viewport override is cleared.


## Free connectors and movable endpoints — current follow-up

**Goal:** Implement the user’s explicit free-connector requirement in the existing local editor. **Spec:** product.md’s free connector requirement. **Architecture:** each endpoint is either a real node ID/side or an explicit canvas point. Existing edge IDs and data carry the document; derived invisible React Flow anchors exist only in the rendering adapter and never enter saved nodes or AI concepts. Keep the existing branch, four Markdown files, typed flow and no-publication boundary. Execute inline with test-first verification and one fresh final review.

### Task F1: document endpoints and recoverable mutations

Files: src/lib/connector-endpoints.ts (pure endpoint validation/resolution, adapter and snap geometry), src/store/mindmap-store.ts, src/lib/connector.ts, graph-file.ts, ai-contract.ts, auto-layout.ts and endpoint/workspace tests. Extend connection commands with optional finite sourcePoint/targetPoint. Empty node ID plus its finite point represents a free endpoint; a bound ID and free point on the same end is invalid. Validate current map epoch and real bound-node membership. Preserve edge identity/style; clear obsolete bends on endpoint changes; commit once. Node movement/selection/deletion must not silently discard unrelated free edges. Test free/free, bound/free, detach/reattach, undo/redo/reload, malformed points, stale maps, layout preservation and no fake persisted concepts.

### Task F2: render and manipulate the endpoints

Files: Canvas.tsx, edges/EditableEdge.tsx, nodes/ConnectorAnchor.tsx, CanvasNavigation.tsx and focused component tests. Derive React Flow-only anchors for free ends. Replace node-only click intent with a node-or-point intent and a live preview. Add selected start/end drag controls that preview either free coordinates or a node-side snap. Blank release commits; Escape/cancel/outside-panel release leaves the document unchanged. Endpoint targets use screen-sized hit areas and remain usable at overview zoom. Fit must include free endpoints even when there are zero real nodes. Copy/paste must work for a selected standalone connector and translate its free points and bends. Retain direct node-handle creation.

### Task F3: integration and recovery surfaces

Files: graph-file.ts, ai-contract.ts, figma-export.ts/plugin as necessary, graph bounds and existing tests. Native backup round-trips every endpoint combination. AI requests include free drawing geometry as context and validate it without fabricating nodes; model semantic additions remain node-bound. PNG and existing diagram exports must not silently lose the new connectors; unsupported semantic Mermaid export should state a visible limit instead of producing invalid IDs. Verify no model spending is needed for this manual feature.

### Task F4: review and direct verification

Run focused regressions RED→GREEN, then npm test, typecheck, lint and build. Verify through the already-authorized in-app browser: create in empty space, move either endpoint, attach/detach, cancel, undo/redo, standalone Fit, save/reload and editable backup recovery on a disposable map. One fresh read-only reviewer checks endpoint ownership, adapter isolation, malformed files and operations on maps containing free edges. Reconcile results into the same four docs; no additional Markdown or integration approval menu.

**Review focus:** zero-node maps with connectors; selection/dimension events and node deletion retaining free edges; endpoint release onto overlays or after a map switch; fake anchors never entering history/AI/export; free-only copy/Fit/backup and AI generation beside free drawings.

- [x] F1: endpoint model, validated commands and persistence regressions.
- [x] F2: creation/preview, movable endpoints, snapping/cancel and navigation.
- [x] F3: export/AI/backup integration and preservation.
- [x] F4: fresh review, full verification and browser evidence.


**F2 addition — direction:** Render a filled target arrow using an SVG marker with automatic tangent orientation and the connector’s current stroke color. Verify an actual rendered free connector has one end marker, no start marker, and selected/unselected color updates; inspect the arrow after moving endpoints in the browser. Existing Figma exports already use a target arrow; preserve that direction.


### F1–F4 completion and review ledger — October 28

F1 complete: canonical point/node endpoint validation; free edges survive unrelated node mutations; native backup/AI contract understand free points; endpoint replacement preserves ID/label/style, clears old attachment constraints and records one undo step. Domain regressions first failed on the old node-only behavior and then passed.

F2 complete: free/free and node/free click creation, local path preview, render-only measured anchors, independent start/end pointer controls, snapping/Alt, keyboard nudges, stale/cancel/overlay rejection, standalone Fit, copy/paste and the filled target arrow. Actual renderer regressions caught a zero-node measurement/handle-bounds failure; explicit adapter measurements fixed it. Rendered marker coverage checks target-only placement, automatic orientation and stroke/selection color. Direct-handle creation is activation-guarded.

F3 complete: native backups, AI context/validation, Tidy preservation/guidance, PNG bounds/download and free coordinates in Figma JSON/plugin. Mermaid shows and enforces the free-endpoint format limit. PNG delivery uses Blob URLs after a real browser data-URL attempt produced no download. PNG regression checks successful download and transform restoration after both successful and failed generation. No paid model request was required or made during this follow-up.

F4 complete: one fresh read-only review of this follow-up’s source baseline identified two concrete integration defects. Both were fixed in one pass with failing regressions before changes. No re-review was dispatched. Source baseline: `/var/folders/v8/_b8r7jzs3cdcjp4vgbqfq70w0000gn/T/arbor-free-connectors-baseline-6bdxqiq9`. Earlier uncommitted editor work remains preserved; no commit, push or deployment was performed.

Final: fixed dangling references in selected-edge paste — “copies an attached endpoint as a free position when its node is not selected, across maps” RED→GREEN; final suite 108/108. Uncopied attachments become captured free points, while copied nodes are remapped to their new IDs.

Final: fixed connector-only Figma payload rejection — “accepts a valid connector-only payload through the actual plugin input form” RED→GREEN; final suite 108/108. The actual HTML form enables valid zero-node free drawings, posts their payload, and rejects empty drawings or malformed free points. Actual TypeScript plugin execution is exercised separately through native-connector and vector API doubles.

Final: Ruling: reviewer set aside live Figma execution and direct browser interaction — Arbor interactions were checked directly in the authorized in-app browser; plugin form and API boundaries were tested locally, while live Figma import is unverified — cost if wrong: Figma runtime integration may still differ from the test doubles.

Final: Ruling: reviewer set aside pre-existing Figma style fidelity, segment-drag accessibility and unrelated editor features — these were not changed by the free endpoint/arrow requirement, and prior documented limits stand — cost if wrong: those earlier gaps still affect full Figma parity or accessibility; this task does not claim either.

Final: Ruling: reviewer did not independently rerun full checks — fresh local verification after its fixes passed the full suite/build/typecheck, with command outputs and exit codes inspected — cost if wrong: there is no independent-environment validation.

No new minor finding was deferred by this review. The user’s four-file documentation limit and existing dirty feature checkout govern this local follow-up; no extra Markdown log/spec or integration approval menu is introduced.

**Fresh verification after final source changes:** `npm test -- --reporter=dot` 108/108 across 19 files; `npm run typecheck` exit 0; `npm run lint` exit 0 with 0 errors and 15 existing warnings; `npm run build` exit 0; Figma plugin `npm run build:tsc` exit 0; `git diff --check` exit 0. TypeScript plugin build preceded the later UI-only validator edit; the actual updated UI is tested in the final suite. Full verification logs are `/tmp/arbor-free-suite-verified.log`, `/tmp/arbor-free-types-verified.log`, `/tmp/arbor-free-lint-verified.log`, `/tmp/arbor-free-build-verified.log` and `/tmp/arbor-free-plugin-build.log`.

**Browser evidence:** used a new disposable chat in the already-authorized in-app browser. Created a fully free connector before any real node existed; moved both ends; verified exact path undo/redo. Added a label and dashed style. Downloaded native backup, reloaded and downloaded again: exact parsed JSON equality, zero nodes/one edge, same ID/coordinates/label/style, no virtual anchors. PNG visually contains the free path, label and target arrow. Imported one synthetic Target card; attached the free target, moved the card and observed its connection follow; detached again; Undo restored attachment and Redo restored the exact detached path. Moving the target above the source visibly rotated the arrow upward. Created another connector from the card to blank canvas and left its endpoint controls visible. Native browser Copy/Paste dispatch did not reliably populate the app clipboard through this driver; copying/free-only translation and cross-map recovery are covered by the actual Canvas component keyboard regressions, not claimed as a completed native clipboard check. Escape/pointercancel/stale-map/overlay rejection are verified by gesture regressions; no claim of exhaustive native pointer-cancel coverage. The original user map was not edited by these disposable checks.

Evidence files: `artifacts/free-connectors-2026-10-28/01-directional-free-and-attached.png`, `02-movable-endpoints.png`, `03-zero-node-export.png`, `free-map-before-reload.json` and `free-map-after-reload.json`. Exactly four maintained Markdown files remain, and the entire pre-follow-up questions.md prefix containing user answers is byte-for-byte preserved.


### Connector alignment bug fix — October 28

- [x] Reproduce the user-reported disjointed endpoint controls at high zoom and trace the coordinate error.
- [x] Correct the control transform origin and the node-port containing box without changing saved graph data.
- [x] Re-run real browser alignment assertions at overview, ordinary and high zoom; run the existing full suite and production checks.

Diagnosis: at 216% zoom, endpoint controls/dots were offset by 16.24 pixels on each axis due to inverse scaling about the default center. Node ports were inset by the visual border’s two canvas pixels. Route segments had the same control-origin problem.

Verification: the real-browser endpoint alignment assertion was run before implementation and failed with 22.97 pixels of diagonal error. It passed after the minimal rendering changes. Additional measurements at approximately 50%, 125% and 216% zoom all passed a 0.25-pixel threshold; the largest endpoint/dot error observed was below 0.003 pixels, and all node ports were below 0.001 pixels. The high-zoom selected arrow and attached start were inspected visually and captured. Existing suite: 108/108 tests across 19 files; application typecheck and production build pass; lint passes with 0 errors and the same 15 warnings; diff whitespace validation passes. No additional jsdom positioning test was added because jsdom does not calculate browser layout; the failing/passing check uses the actual rendered browser coordinates.

Evidence is under `artifacts/connector-alignment-2026-10-28/`; command outputs are `/tmp/arbor-alignment-tests.log`, `/tmp/arbor-alignment-types.log`, `/tmp/arbor-alignment-lint.log` and `/tmp/arbor-alignment-build.log`. The browser was left at 216% with the corrected connector selected. Only rendering code and these existing four documentation files changed; no API call, dependency, graph-schema change, commit, push or deployment was needed.


### Immediate layout selector follow-up — October 28

- [x] Explain the three existing layout choices from their current implementation.
- [x] Make changing the selector apply the chosen direction immediately through the existing undoable layout action.
- [x] Verify all three choices and Undo in the browser; preserve free connector geometry and existing graph content in regression tests.

The request fully specifies this small behavior change; no new design question is required. Two component regressions were observed failing before implementation and passing afterward. Full suite: 110/110 across 19 files. Application typecheck and production build pass. Lint passes with 0 errors and the existing 15 warnings. Browser evidence uses a separate imported Product/Research/Design/Build sample, preserving other chats. The selector now applies immediately; Tidy Up remains available for reapplying the same option. The selected preference is transient and is not itself restored by graph Undo. No paid AI call, dependency, new Markdown file, commit, push or deployment was needed. Logs: `/tmp/arbor-layout-select-tests.log`, `/tmp/arbor-layout-select-types.log`, `/tmp/arbor-layout-select-lint.log`, `/tmp/arbor-layout-select-build.log`.

### Node connection highlighting follow-up — October 28

Implement the explicit request inline: derive immediate incoming/outgoing links from real selected node IDs; highlight their path and target arrow; mark neighboring nodes with a subtler border. Keep all highlighting in render state and preserve direct edge selection. Verify actual Canvas clicks, moving/clearing/multi-selection, incoming/outgoing/indirect/free links, stored styles and history. Use failing component regressions before implementation, then the existing full checks and a separate browser example. Keep the four-document boundary.


**Node connection highlighting: complete.** Two failing actual-Canvas regressions were verified RED→GREEN. Coverage includes direct incoming/outgoing links, matching target arrows, partly and fully free endpoints, indirect links, subtle neighbor feedback, Shift selection, clear/restore, no implicit edge selection and no added undo step. The browser verified parent/child/multiple/cleared states on the existing sample and was left with Product selected.

Fresh checks: 112/112 tests across 19 files; application typecheck and production build pass; lint passes with 0 errors and the existing 15 warnings; diff whitespace check passes. Logs: `/tmp/arbor-node-highlight-suite.log`, `/tmp/arbor-node-highlight-types.log`, `/tmp/arbor-node-highlight-lint.log`, `/tmp/arbor-node-highlight-build.log`. Visual evidence and DOM state captures are under `artifacts/node-highlighting-2026-10-28/`. Implementation is limited to the two node/edge renderers and their Canvas regressions, with documentation in the existing four files. No layout, graph data/schema, dependency, paid AI call, commit, push or deployment was changed.

## GitHub and Vercel release — October 29

The user explicitly requested publishing this local version to GitHub and the existing Vercel site. Production repository: `mm-25/Arbor-AI`; production branch: `main`; public alias: https://arbor-ai.vercel.app. The only remote change since the local feature baseline is a README production-link update. Integrate that commit while retaining the established four-document structure; the production URL is recorded here and in architecture.md. Publish the complete tested local source foundation and subsequent editor refinements, rather than only the final highlighting diff.

Release packaging excludes `.env.local`, build caches/dependencies, generated Figma plugin output and local browser audit screenshots/backups under `artifacts/`. Those artifacts remain on disk as local evidence; their documentation references are local-workspace links. A credential-pattern scan of release source/configuration/documentation found no matching secrets. GitHub access for the repository owner is verified. The active CLI school account is read-only on this repository; release operations use the existing `mm-25` credential without changing the global active account.

Fresh pre-publication verification: full test suite 112/112 across 19 files; lint exit 0 with 0 errors and 15 existing warnings; application production build exit 0; Figma plugin typecheck/bundle exit 0. Root no-emit typecheck and staged diff checks are also required before pushing. Existing Vercel CLI authentication is expired and the browser dashboard requires sign-in; deployment status can still be verified via the GitHub integration. Production Claude availability requires `ANTHROPIC_API_KEY` in Vercel's server environment; the local env file is not published. This entry records release preparation, not a claim that the push or deployment is already complete.

Release diff check note: original user answers in questions.md contain trailing spaces and are preserved as authored. The source-only staged whitespace check excludes that document. A pre-existing extra blank line at the end of graph-snapshot.ts was removed without changing its behavior. Root typecheck passed on the release source.
