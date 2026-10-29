# Arbor AI Questions and Answers

This is the working list of open project questions. Write beneath each **Answer:** field. You can use “defer” or “use your judgment” where you do not want to decide yet. I will preserve your answers and add new questions here as they arise.

**Four-file documentation rule**

The only maintained project Markdown files are [questions.md](questions.md), [plan.md](plan.md), [product.md](product.md), and [architecture.md](architecture.md). Do not create extra question, log, README, research, PRD, review, MVP, or handoff Markdown files. The product/MVP specification is product.md; no separate mvp.md is needed.

**Answer handling**

Question IDs remain stable. The user removed Q41 and Q42 as irrelevant; leave those gaps and do not recreate the deleted questions. Each question includes the reason it matters and the decision it affects. Preserve existing answers verbatim unless you correct them yourself. If a brief supplies an answer, record its source and identify any interpretation instead of silently filling gaps. A blank answer means unresolved; it does not mean approval, deferral, or permission to choose. “Defer” should identify what release or decision can proceed without it; “use your judgment” allows an implementation choice within the rest of your constraints.

Product.md records confirmed requirements after answers arrive. Plan.md records work that those decisions enable. Architecture.md records what is implemented and verified. Clarifications can be added below a question without changing its number. Any genuinely necessary new question must use the next unused ID after 45 and remain in this file; do not add questions merely to fill numbering gaps. Retain meaningful superseded answers with a note explaining the newer decision.

You have answered the original 35 questions. Their answer text is preserved verbatim; the rationale and decision prompts preceding it describe the original review context, not newly reopened questions. The follow-ups now contain further user answers. The professor meeting is cancelled, the initial Claude Console testing budget is about $20, all assistance levels remain desired, and new export formats/Figma refresh are low priority. There is no active demo deadline. Deleted questions are intentionally absent.

**Answers already recorded**

- **Direction:** A general systems-thinking tool. Automotive specialization is outside the current direction.
- **Intended outcome:** A product people can use regularly.
- **Audience:** Individual knowledge workers first: PMs, PDs, software engineers, system architects and others who brainstorm, write content/PRDs or resolve questions. Team use is later.
- **Existing local changes:** Experiments to reassess. Keep them intact while evaluating them; retaining all six is not an agreed product decision.
- **Existing context:** The linked Google Doc contains a March MapMind PRD and an April Arbor package. It has been read. Your October answers supersede its conflicting scope and implementation claims.

The product is brainstorming first, architecture design second. Priorities are accurate/readable generation, live voice mapping, and clearer interaction. The former October 16 professor demo was cancelled; no replacement deadline has been supplied. Local desktop single-user use is sufficient; typed mode remains available. Detailed requirements are reconciled in product.md and work sequencing in plan.md.

**Audience and core workflow**

**1. Priority — Where can I read the brief?**

Paste it below or provide a file path or link. Which parts still reflect your current thinking?

**Status:** Answered — linked historical brief read; your October answers take precedence.

**Why this matters:** The brief is the missing source of intended product requirements. The repository records implementation and historical experiments, not the full original product reasoning.

**Decision needed:** Identify the authoritative brief, any outdated sections, and whether its contents should supersede or supplement the answers already given. It may resolve multiple questions at once.

**Answer:** This is the brief I have, while most of the things may stull be relevant, I plan on updating how the product actually functions. https://docs.google.com/document/d/1MJaByO3PpJoAZLB5hcwHT4ZXQAGT1ocDW4kr0LnghHY/edit?usp=sharing


**2. Priority — Should the first experience prioritize PMs, PDs, or both equally?**

Are these individual contributors, leads, students, or another group? What kind of team or organization do they work in?

**Status:** Answered — individual knowledge workers first, including PMs, PDs, engineers and architects.

**Why this matters:** PM and PD are interpreted as product manager and product designer. The same feature may serve different needs for a planning-oriented PM and a design-oriented PD; neither role has priority yet.

**Decision needed:** Name the first role or explain why both share the same initial task, then specify work context and experience level. Do not repeat the already confirmed broad audience as the whole answer.

**Answer:** This question should be answered through the project brief, but the idea is that it should be used by anyone who is brainstorming, producing content, trying to write a PRD, answering any open questions, and so on and so forth. It will be a collaborative process eventually, but from the way I'm thinking about it, the initial step is going to be individual: you work on it individually, and then you open it up to the rest of the team.

It can be used by a PM, a product manager, and a product designer as well. It can also be used by software engineers, system architects, and roles along those lines


**3. Priority — What recurring task should they use Arbor for?**

Give one concrete example: what they start with, what they do in Arbor, what they leave with, and how they use that output afterward.

**Status:** Answered — manual editing, typed chat and desired live voice mapping; collaboration later.

**Why this matters:** This is the central missing product definition. A diagram is useful only in relation to the decision, discussion, documentation, or planning task it helps complete.

**Decision needed:** Describe a real task with trigger, starting material, actions in Arbor, required output, and next use. State how often it occurs and whether work is individual or shared.

**Answer:** The idea is that the user will come onto the platform to brainstorm. They will either do it by designing or drawing systems themselves, or they'll primarily communicate to an AI tool, and it will build the graph live as they are communicating with the AI. AI is constantly interpreting what the user is saying and is building on top of it.
The core use of a flow would be:
1. The user comes onto the platform and either selects an existing chat or a new chat.
2. If they select an existing chat, they continue building upon the existing diagram that they have, either by directly talking to the AI bot, by focusing on one of the specific nodes and then talking to the AI bot about that, or by just building it themselves.
3. If they start a new chat, they would build on the initial premise with the AI bot and talk to it about what they want to do. As they are talking, it's going to create the mind map.
Another user flow would be that once this has happened, they could also get onto a team meeting where they are discussing the map that has been made. It can be a collaborative effort where different people are on the platform working together, building on this same developing flowchart.


**4. What problem makes that task difficult today?**

What tools do they currently use, and what should Arbor do substantially better?

**Status:** Answered — brainstorming first, simpler controls, continuous visual interpretation; industry focus remains exploratory.

**Why this matters:** The current app demonstrates capabilities but no validated explanation of why a PM/PD would choose it over their existing process. Generic convenience is not a sufficiently precise differentiator.

**Decision needed:** Describe the current process and its specific failure or friction, the alternatives used, and the advantage Arbor should provide. Separate observed pain from a hypothesis to test.

**Answer:** Currently, there are a few ways people are doing it. There is actually a really good platform called Lucid Charts, which executes this really well. The idea is to limit or allow a more general route. I think Lucid Charts can be overwhelming because of the amount of functionality it has. Either we can look at it that way, or we can look at it as not being built for any specific industry, and we can build Arbor AI for a specific industry.

The other issue is that brainstorming is a very active process. You talk to an AI, and then you wait for it to get back to you. That is not the best way of doing it. In an ideal scenario, I would want that, as you are talking to the AI, it is building out the mind map based on what you are saying. I don't know how generation of tokens would work there. Maybe it will spend a lot of tokens, and maybe we need to identify a way where that does not happen.

We need to probably build a system where the AI is able to dissect and interpret that information in such a way that, when it's in real time converting whatever the user is saying, it happens almost instantaneously without using up too many tokens. That is what I would want it to be. I want it to be a brainstorming tool first and an architecture design tool second. I want people that come on the platform to see that this tool is meant for convergent and divergent thinking. That's what the experience should communicate to the user, rather than "Oh, this is a tool for making really detailed systems or architectures." 


**5. Priority — What is the next release milestone?**

The eventual goal is regular use. What should the next release enable, who will try it, when is it needed, and what would count as success?

**Status:** Answered — generation quality, Claude Sonnet evaluation, layout/connectors and interaction; Friday demo in Q35.

**Why this matters:** The eventual maturity is confirmed, but it does not define the next deliverable, release date, audience size, or completion criteria. A staged release may be appropriate, but none has been agreed.

**Decision needed:** Name the next milestone, its intended users, deadline if any, and measurable or observable success. Distinguish a private pilot from a public release and the next version from the eventual product.

**Answer:** For the next release, two things need to be addressed:
1. The graph generation still sucks. It is really bad. I don't know if it is because of how we have developed the platform or if it is because of Grok that I'm using in the background. To I guess A/B test that, I do want to switch up the API to Claude because I have Claude tokens available. I would like to try using Claude Sonnet and see how the output changes.
2. I would mainly like to address the graph generation techniques. Currently, I think we are using Dagrae, but it does not feel like it's the best way of doing it. We are using React also to develop how the nodes are being generated, but I feel like it does not work very well. Again, I'm not sure if it's because of the AI or the system itself. That needs to be fixed because whatever Lucid Charts is doing to produce their charts, it's really clean, really nice, and easy to understand, which is not happening with whatever we are doing. We need to fix that.
3. I want to fix the user interaction. Currently, it is very basic and not very user-friendly. It's not clear how the user should be interacting, so that also is something I would like to fix.


**6. What is intentionally outside the next release?**

Are there features, use cases, or kinds of users we should explicitly defer?

**Status:** Answered at roadmap level — richer inputs, MCP/integrations and more control later; no feature-heavy interface.

**Why this matters:** General systems thinking could expand into many diagram types, integrations, and workflows. An explicit first-release boundary prevents unrelated work from being treated as necessary.

**Decision needed:** List what must be excluded or deferred, and whether that exclusion applies only to the next release or to the product overall. Explain any hard limits that should guide implementation judgment.

**Answer:** I would like for the user to be able to have more ways of interacting with the system. Right now, the documents that they can upload are limited. In the future, I would like for them to be able to do that better.

I would like for the app to have better integration with other existing platforms as well, maybe even an MCP so that it can connect directly with whatever platform of choice they are using. It can use that to design something on the platform if they don't want to use the AI which is built into that particular platform. I would like an MCP option.

I guess more control, but not in a way where it is overwhelming. Like I said, Lucid charts has way too many controls, which makes it super overwhelming. We do want the user to have a lot of control, but not to the point where it kind of becomes a barrier to entry rather than something that helps them build something. 


**Diagram model and editing**

**7. Which diagram types are essential?**

For example: process flows, user journeys, mind maps, component architecture, state machines, or causal loops. Which one comes first?

**Status:** Answered — mind maps/brainstorming first, process flows second, user journeys third; existing four shapes.

**Why this matters:** The current implementation uses one four-shape directed graph. A process flow, state machine, and causal loop can need different edge meaning, validation, interaction, and layout.

**Decision needed:** Rank the required diagram types and give examples of accepted structures. Specify whether users choose a type or Arbor infers it, and which type is the MVP default.

**Answer:** Currently, process flows, user journeys, and mind maps are the important ones which we first need to address. I think a lot of these diagrams use very similar elements to build them, so I guess the user can maybe define what they are looking for, and the AI can build those things accordingly. We stick to the current shapes and options we have. In the future, the user can have the option to maybe customize or add more shapes.
1. Mind map or just brainstorming
2. Process flow
3. User journey


**8. Do nodes and connections need structured meaning beyond their shape and label?**

For example: actor, step, dependency, requirement, risk, evidence, ownership, or relationship type. Which meanings should Arbor understand?

**Status:** Answered — permissive shapes/colors with conventional defaults; per-chat conventions later.

**Why this matters:** Current meaning largely resides in node shape and label. There are no dedicated requirement, source, owner, risk, port, or relationship schemas; appearance changes can therefore blur meaning.

**Decision needed:** List structured entities/relationships that must be understood, the fields each needs, and whether those fields are user-authored or AI-generated. Leave purely cosmetic metadata distinct from semantics.

**Answer:** I think, in general, the nodes don't really need to have a meaning per se. You have defined actor, step, dependency, and risk. These things do not need to be defined because the user can usually use them in any way.

Usually, every shape has an associated action. A diamond is used when there are multiple actions, or if a circle is used or a square is used, it is usually to define a starting point or ending point. In that sense, they have a generalized role, but they don't need to have a very specific role.

Again, colors also have a similar use case. You can use whatever color you want in whatever manner, but usually green is used for something positive, red is used for something negative, and yellow is used for caution. They have inherent meanings, and when the AI is generating a map, it can have access to that information, but there is no strict rule where a particular thing means something.

Maybe in the future, like you said in one of the previous questions, question number 6, what could be there in the next release? Maybe in a future release, for every chat, the user can define what the architecture should look like for them, what each element should look like for them. Once that is defined, the system or the AI chatbot understands, "Okay, that is what the user is looking for," and uses that as a reference to build. 


**9. Priority — Should generation preserve existing positions and manual styling?**

Should Tidy Up be the only action that rearranges an existing map, or may AI generation also change its layout?

**Status:** Answered — preserve all existing positions and styling unless explicitly authorized to change.

**Why this matters:** A04 shows that pure additions can reposition existing AI nodes, while proposal acceptance uses incremental placement. The two routes currently enforce different preservation behavior.

**Decision needed:** Specify what positions, styling, labels, and routing are protected during each AI operation, what may change after approval, and whether Tidy Up is the sole explicit rearrangement action.

**Answer:** The thing with tidy up is that it's interesting because the reason I added tidy up was that whatever the AI was generating was very random and did not look good. Tidy up was kind of used to sort that out and make it look clean, which didn't really work too well.

Also, we can think of tidy up as something that the user could actually use if they are just brainstorming, attaching things randomly with connectors and stuff. They can use tidy up to kind of make that whole thing look better.

In general, generating should preserve the positions and the manual styling the user has provided unless the user explicitly says, "Okay, update the styling in whatever form or manner they would like." Even if they don't define the specific style, if the user says, "Yes, you can update the styling," or "Update everything that is there," only then should the AI update with generation. Ideally, it should maintain the position and the manual styling that the user has provided. Even if it's just AI-generated previously, it should still maintain whatever initial styling it has provided and not update it unless specified. 


**10. What should Expand do?**

Add detail alongside a node, replace it with substeps, open a nested map, or something else? How should users navigate between levels?

**Status:** Answered — additive focused detail by default; explicit CRUD changes supported; generic CTA wording to design.

**Why this matters:** Expand currently selects the first chosen node as an anchor and asks for new related nodes. It does not implement nested maps, replacement semantics, or collapsible subsystem navigation.

**Decision needed:** Define whether detail is additive or replaces content, how it relates to existing incoming/outgoing connections, and whether parent/child views must remain navigable and synchronized.

**Answer:** The idea for Expand: if there is nothing on the screen, Expand won't do anything, right? It's just going to create a map. If you have focused on a particular substep, the idea of Expand is to expand on top of that initial substep and keep on building upon it based on whatever the user has defined (the requirements they have provided).

Again, based on the context, it can change. If it's a user flow or a user journey, it could be a substep. If it's brainstorming, it could just be correlated ideas to that particular node that the user has selected. It completely depends on what the user wants. It is additive in nature, not replacing. If the user wants to replace it, they will either delete it, manually update it, or select the node and then tell the user to replace it.

I guess in that case, we cannot use the term Expand, but maybe Apply Changes or something more generic which can encompass more actions than just expanding, which kind of makes sense. You should be able to delete, expand, retain, update, basically perform CRUD, and that's what the CTA should kind of bring out. 


**11. Which graph structures must be supported?**

Should single-node maps, disconnected concepts, self-loops, cycles, multiple connections between the same nodes, and large branches be allowed? The current generator caps new nodes at 25 and outgoing connections at four.

**Status:** Answered as intent — do not impose arbitrary semantic generation restrictions; practical resource limits still need engineering definition.

**Why this matters:** Generation drops isolated nodes, skips some self-loops, caps fan-out, and can merge repeated labels. These rules can alter a valid mental model if the required graph structures differ.

**Decision needed:** For each listed structure state allow, reject with explanation, or defer. Clarify the difference between a content limit and a readability suggestion, and whether incomplete drafts are valid maps.

**Answer:** I am not sure what you mean here, but it feels like currently there are certain restrictions which have been applied in terms of generation. Ideally, the user should not have any restricted generation. Whatever they require, the system should be able to generate, of course, within the boundaries of using nodes and connecting. I'm not saying generate a table. I'm not sure, but if you are suggesting that there are these system guidelines which could break the user's brainstorming session or something, then we should define it. Otherwise, the user should have complete control over how the system, the map, or whatever they are building is being built. 


**12. Should colors and dashed connectors communicate meaning?**

If so, what meaning? Or should they remain visual styling that users control?

**Status:** Answered — user-controlled conventions; no fixed dashed-edge meaning now.

**Why this matters:** The local layout experiment automatically assigns depth colors and dashed crossing edges. Those same visual encodings could mean certainty, ownership, optional flow, or other user-defined semantics.

**Decision needed:** Choose which encodings have fixed meaning, which users can control freely, and whether automatic style may override user choices. Define the legend or explanation users would need.

**Answer:** I think I mentioned this above already: colors and node shapes can have certain meanings which are used in industry, but they don't need to be too fixed. By default, the AI can use those default meanings, but it does not have to be necessarily restricted to them unless the user specifies those restrictions or boundaries.

As for the dashed connectors, initially, I think the idea was just that it was very difficult to figure out what connector was connecting between two nodes because there were way too many and there were way too many overlaps. I think a dashed connector could show indirect connections if the user is doing any mind mapping, or maybe to define edge cases. I don't think these are things which should be defined in the AI system right now. It can be part of the future scope about what a dashed connector specifically should communicate. 


**13. How large should typical maps be?**

What is a normal number of nodes, and what is the largest realistic example we should handle?

**Status:** Answered as vision — infinite canvas and large-map context; demonstrated capacity remains unmeasured.

**Why this matters:** Layout uses approximate dimensions and graph-size-dependent spacing. Rendering, storage serialization, AI context length, and export bounds all depend on expected graph size.

**Decision needed:** Give a typical range and a concrete large case, including label/edge density and nested detail if relevant. Distinguish a required supported size from an aspirational future size.

**Answer:** It can be as large as possible, and the system should be able to maintain context of it. Think of it as how AI memory works, right? There are vector nodes which are connected in space, and they all connect to each other, and that's how information retrieval, I think, works. Maybe it's not the best example, but just to answer your question in short, it can be as large as possible. It's an infinite canvas. 


**AI interaction and trust**

**14. Priority — Is the chat-first mentoring experience central?**

Should Arbor ask questions before generating, generate immediately from a description, support direct document-to-map generation, offer templates, or combine these approaches?

**Status:** Answered — configurable assistance levels; default/demo priority clarified in Q40.

**Why this matters:** The current mentor prompt encourages several substantive exchanges before the first draft. Users may instead arrive with a complete description, document, or existing artifact and expect immediate usefulness.

**Decision needed:** Identify supported entry paths and the default path. Specify when Arbor should ask clarifying questions, when it should draft despite missing information, and how users can bypass a conversation.

**Answer:** So yes, that's what the app started as: not as a mentoring tool, but as a questions-first tool, so that the user is thinking for themselves rather than the AI giving them solutions. I think the user should be able to control this experience as well from settings, as to how much assistance they want from the AI.
You know how in games where there's first-person shooting, you can decide the level of assistance you require from the game system? Similarly, the users should be able to do that here as well, where they can be like:
- Complete assistance: help me completely.
- Another setting: ask me questions for the key situations.
- Another setting: don't proceed without asking questions. Only go off based on how I answer.
We can have those kinds of options set, and based on that, the behavior of the AI bot will change.


**15. Priority — Which AI changes should require review?**

Today additions apply immediately, while updates and deletions require acceptance. Should that remain? Should users accept individual changes rather than an entire proposal?

**Status:** Partly answered — typed mode needs visible all/partial review and optional auto-accept; live commit/recovery contract remains open.

**Why this matters:** Pure additions apply immediately; updates/removals are proposed. Pending proposals are not currently durable or tied to a graph revision, and per-change acceptance is absent.

**Decision needed:** Define approval policy for additions, renames, shape/meaning changes, reconnections, removals, and layout. Specify batch versus individual review, rejection behavior, and what to do if the graph changes before acceptance.

**Answer:** I think you bring an interesting point which kind of conflicts with what I was thinking. What I wanted the next level of the product to be is that, as I am thinking, I'm imagining structures in my head. I would want the AI to behave in a similar way, where it's creating things based on what I'm saying instantaneously. As I expand my thoughts in my head, the system also adapts, updates, or changes.

It's less about me typing something and being like, "Okay, expand map," and then it expands and I can see the changes, but more about live updates, similar to what Google Stitch does. You can actually look up how Google Stitch performs. Maybe that can help us in some manner in terms of how it functions, token usage, and things like that.

What you are suggesting is based off my current version, where the user types something in the chat, hits Enter, and the AI replies something. Based on that, the user will hit Expand, and it will expand. If that was the version, then yes, I agree that if the map is expanded, the user at that moment should be able to see exactly what the new additions are. They should be able to either apply all those changes or some of those changes, and users should have that control and that view of how the system is being updated.

I'm providing you this information because, let's say, if we realize that live updating of the map is not viable as an option right now and we need to fall back on the current version, then yes: whatever action the user takes with the chatbot which updates the map should be visible on the map. The user should be able to see exactly what the changes are. These new elements which are being added should be highlighted, and the user should either be able to accept all, reject all, or have a way of partially accepting and rejecting the elements which have been added.

This is not just for addition, but in any other scenario wherever AI is taking part. They should be able to have that view. This could also then be a setting where the user accepts everything by default, and then everything will be accepted by default, and they don't need to really do anything to accept in particular. This is only if we go with the existing route. If we go with my new vision of live updating of the map, then this wouldn't happen. We would have to cater the experience in a different way, which I don't have the vision for right now because I have not seen how this would work. As I see it, we can work on the interactions for that situation. 


**16. How should Arbor handle assumptions and uncertainty?**

Should it ask first, show assumptions on the map, distinguish inferred content from user-provided facts, cite sources, or leave gaps unresolved?

**Status:** Partly answered — clarify uncertainty and separate voice live mode from typed mode; unattended pause behavior remains open.

**Why this matters:** Validators sometimes infer yes/no labels or merge nodes; AI prompts can synthesize gaps/risks. No structured mechanism distinguishes source facts, user decisions, and AI assumptions.

**Decision needed:** State which inferences are acceptable, how they must be identified, when clarification is mandatory, and whether source references belong on nodes, edges, chat, or the report.

**Answer:** The AI models have been trained on some base information, so it won't have complete uncertainty. Yes, of course, if there is some uncertainty, it would ask the user questions before it makes any changes to the map. This brings up another problem: let's say the user is actively talking and the map is getting updated, but now the AI is unsure about what is happening. How would that interaction pause, and how would the AI ask the user the questions it has in a way where it is pausing the existing interaction (but the user is aware that this interaction will continue once I have answered these questions)?

That is an interaction which needs to be built. This also raises the question: is AI good enough right now that we can just have this live thing being built, rather than the current version that we have? Which version would be better? I think that is also a good question, which I think we should answer, and which I would like to brainstorm about with you.

How would we handle these interactions where AI is not sure, is uncertain, or wants to ask a question? I think we can look towards ChatGPT and Claude for inspiration, where these tools are working in the background and that can be seen, but you still ask the user a question and wait for the user to answer. Let's say if the user is not answering, then you continue.

Another assumption that we are making here for this live version is that the user is talking to the system. If the user is not talking to the system and is typing, then this live map making is not a viable option. It doesn't make sense because it would be too slow. I think it can actually be two different versions within the app: if the user goes into live mode, they can talk live, and the map will update in real time. If they are typing it out, then it works in the traditional sense, the way the app is working right now. I think Google Stitch also does something similar.

If you have any more questions about this, you can add them in the MD file, and we can continue working on it. 


**17. Should Arbor only explain and document systems, or also analyze them?**

For example: identify missing steps, challenge product logic, find dependencies, compare alternatives, or simulate behavior. Which capabilities belong in the next release?

**Status:** Answered — thinking assistance and critique, with user/mode-controlled initiative.

**Why this matters:** Existing structural checks do not establish real system correctness. Analytical claims such as finding bottlenecks or comparing alternatives require explicit responsibilities and a quality standard.

**Decision needed:** List the analyses Arbor should offer, the evidence available for each, and the limit of any claim. Mark simulation or formal correctness separately from conversational critique.

**Answer:** Our bot should ideally only be listening to what the user has to say and build based on that in the live mode. In the chat mode, it can ask the user questions or tell the user if the user is thinking incorrectly about what is happening.

For example, if the user says that they can do a particular action and then they can sign into their account, ideally, that is not the best way, right? Ideally, you would want the user to first sign in and then to perform an action. If it's something like that, the system can tell the user, "Okay, this is what I think is happening, and you are thinking correctly."

Yes, the idea of the chatbot is to assist the user with the mind mapping process, so it can 100% have opinions, analyze things that are happening, explain, and all of it, even in the live chat mode. 


**18. What would make an AI-generated map good enough?**

What errors are most unacceptable? Are there representative inputs and expected outputs we can use to assess quality?

**Status:** Answered — natural interaction, accurate content, readable directional non-overlapping layout, easy navigation/editing.

**Why this matters:** A01 produced a plausible graph with a missing step and corrupted label. Compiler success cannot detect usefulness or factual correctness, so a product-specific evaluation rubric is needed.

**Decision needed:** Provide sample inputs and the key content each expected output must preserve. Rank unacceptable errors and define what can be a rough draft versus what must never be silently wrong.

**Answer:** What would make it good are three things:
1. The interaction should be very easy and natural. The user should not be confused about how they can use the tool.
2. The map generation should be very accurate and precise, and it should be able to communicate whatever the user was thinking and try to build upon it. There should not be overlapping nodes. If the mind map is flowing in a forward direction, the nodes shouldn't randomly appear at the back or anywhere else. It should appear in the correct direction, and it should look right. When you observe it, the user should be able to understand what the map has built out, rather than be like, "Oh, there are 10 things I need to fix," and then it will look right. 
3. It should be very easy to view, scan, navigate through, and update as well. Either manually or through the chat AI, it should update accurately.


**19. What generation speed and cost are acceptable?**

What wait time feels reasonable, and is there an operating budget or usage limit we should design around?

**Status:** Partly answered — quality first during testing, responsiveness more important live; spending limit remains open.

**Why this matters:** Models, output token caps, and request patterns are hard-coded. Attachments and repeated history increase context, but no agreed operating budget or user wait target exists.

**Decision needed:** State acceptable latency by action and budget/usage expectations. Define whether cost limits imply quotas, paid access, slower high-quality generation, or another product tradeoff.

**Answer:** Currently, we are testing the platform. I would like to see the best results possible, but not always in terms of speed, but quality. I think quality is more important than speed. Like I said, if we are doing a live chat mode, then I think speed would take more importance, and maybe the quality might go a little lower. I think that is also something we have to work on. Once the live chat mode is over, could we then improve the quality in some manner? 


**Documents and saved work**

**20. Which input formats are essential?**

Examples include plain descriptions, PDFs, screenshots, research notes, PRDs, spreadsheets, links, or voice. Should source attachments remain usable when a saved chat is reopened?

**Status:** Partly answered — text, links and readable PDFs; no images/OCR now; source lifecycle details remain open.

**Why this matters:** Chat supports images, text files, PDFs, and voice transcription. Generation sees document names rather than full extracted text, and originals are unavailable after reload.

**Decision needed:** Rank the required source formats and define the full lifecycle: upload/read, extraction, generation, subsequent questions, reopen, replacement, deletion, and truncation feedback.

**Answer:** I think we can hear a reference, maybe Notebook LM, where you can paste text, add sources in terms of links, and add PDFs as well, which are text-readable. If not, then we would have to run some kind of an OCR thing in the background or maybe tell the user to add PDFs which are scannable and have OCR. Then the user could do that. For now, let's do it that way. They can add text, links, and PDFs which are readable. Not images for now 


**21. Priority — What persistence is required for the next release?**

Is browser-local storage sufficient initially, or do users need accounts, cloud saving, multiple devices, backup, and recovery?

**Status:** Answered — local storage and desktop first; cloud/auth are future options.

**Why this matters:** All saved work currently lives in browser localStorage, separately for each origin/browser. There is no account, server persistence, multi-device sync, or cloud recovery.

**Decision needed:** Define the required storage location, access across devices, data lifetime, backup/recovery guarantee, offline behavior if any, and whether accounts are needed for the next milestone.

**Answer:** For the first release, local storage is sufficient because I'm testing it and using it. It can be supported only on desktop for now. We don't need a mobile version. Maybe we can also have cloud-based storage with Supabase for authentication and Cloudflare for the data, but we don't need to think about multiple users for now. 


**22. What is the right structure for a user's work?**

One chat with one map, or projects containing multiple maps, conversations, and source documents? Should the same map support multiple conversations?

**Status:** Answered — projects organize multiple independent maps/chats; cross-map context later.

**Why this matters:** A session currently bundles one chat, one graph snapshot, and wireframes. A project model or multiple conversations on one artifact would change identity, persistence, requests, and navigation.

**Decision needed:** Describe the hierarchy users need and the ownership of graphs, sources, chats, reports, versions, and permissions. Specify whether one source can inform several maps and whether maps can be linked.

**Answer:** A user can have a project with multiple maps in it. Currently, the different chats within a project don't need to complicate each other because that will make things too complicated, but they can have a project with multiple maps just from an organizational standpoint. Project: Chats within a project being able to communicate with each other can be part of the future scope. 


**23. What should autosave and history cover?**

Should every edit save automatically? Must undo include edge routing, labels, and styles? Should versions and accepted/rejected AI proposals survive reload?

**Status:** Answered as requirement — automatic saving, undo/redo and reopening the workspace as left; detailed recovery design proposed in architecture.md.

**Why this matters:** A03/A09 expose inconsistent save paths and incomplete edge undo. History is in-memory, clears on session change, and contains up to 50 graph snapshots rather than full work versions.

**Decision needed:** Specify covered mutations, save timing, visible save/error status, undo grouping, reload history, and version recovery. State which requirements are MVP versus later.

**Answer:** Yeah, this should be how Figma works. Every time a user makes a change, it should update on the system. They should be able to use Command-Z to go back, and then, whatever the redo shortcut is, they should be able to use that as well to go forward. If the website loads, everything should be persistent. Everything loads the way the user last left it. Shouldn't be too difficult, given that it's all just notes and diagrams 


**24. Do users need sharing or collaboration?**

Should others be able to view, comment, edit asynchronously, or work together in real time? Which capability is needed first?

**Status:** Answered — single-user first release; realtime team collaboration later.

**Why this matters:** No sharing or collaborative editing is implemented. An export file, a public view link, asynchronous comments, and real-time editing are different capabilities with different ownership requirements.

**Decision needed:** Choose the first sharing/collaboration mode, allowed recipients and permissions, whether accounts are required, and the conflict behavior for concurrent changes.

**Answer:** In the future, yes, the users should be able to do real-time collaboration and things like that, but for now, for the first version release, we don't need that. If we have to scaffold and build for it in the future and we need to write some preliminary code to enable that in the future, then yes, we do that, but for the first release, it's single-user usage only. 


**25. What data and privacy constraints apply?**

Will users bring confidential product plans or research? Are there restrictions on external AI services, document retention, third-party assets, or who can access saved work?

**Status:** Answered for current release — direct model APIs, no special enterprise requirements; self-hosted models later.

**Why this matters:** Chat, images, documents, and audio can be sent to Groq; previews/style resources can load from CDNs. The code does not establish an approved confidentiality or retention policy.

**Decision needed:** Describe realistic sensitive data, permitted services, retention/deletion expectations, access boundaries, and any organization-level constraints. Name requirements that are already mandatory.

**Answer:** Here, I think there is not a lot that I can think of with privacy and data, apart from the fact that the users would want to add their own images and documents and stuff like that.

How we could do this is that, in the future, we could have an AWS center where we are hosting the models and everything, so that none of the data is actually going to these AI companies. It's staying on our servers, and we are not using any of that data. For now, we don't need to think of that. We can just use the AI LLMs directly. We don't have to think about any privacy or data constraints. Again, for future scope, you can mention this as a part of it. 


**Outputs and existing experiments**

**26. Which output is the main deliverable?**

The editable map, image/PDF, written design report, Figma/FigJam artifact, or something else? Which exports are essential versus optional?

**Status:** Answered — editable map primary; retain existing report, PNG, Mermaid and Figma exports; new SVG/PDF scope clarified in Q44.

**Why this matters:** Implemented outputs are a map, AI report, PNG, Mermaid syntax, and plugin JSON. The plugin JSON is not a full project backup and the app has no demonstrated round-trip graph import.

**Decision needed:** Rank deliverables and state required fidelity, editability, metadata, format, and downstream use. Define whether importing/reopening the exported artifact is part of the promise.

**Answer:** The main deliverable is, of course, the editable map, but in the export section we have the different options. That is because no one will only use a map for communication. You would want to translate that map eventually, maybe into a PRD or a report, and put it on Figma as well, because that is a primary platform that users use. If the users want to do that as well, they can, but that would limit some of the features that I'm planning on adding in the future as well. All the options you have mentioned, with the PNG, the Mermaid's syntax, yes, all of them will stay.


**27. What role should the hidden Design/wireframe feature have?**

Bring it back, defer it, or retire it? What user problem would it solve alongside systems thinking?

**Status:** Answered — retire Design/wireframe feature now; removal is planned, not yet implemented.

**Why this matters:** Design/wireframe functionality remains in source but its normal entry points are hidden. General-purpose direction does not by itself make screen generation part of the first workflow.

**Decision needed:** Choose restore, defer, or retire, then identify the user job it serves and any relationship to the map. State whether an existing wireframe must remain viewable if generation is deferred.

**Answer:** For now, let's eliminate that. That was one direction that I had in mind. You can scrap that feature completely for now. We don't want to think of that right now because I don't see it being of any use at this point in time anymore. 


**28. How important is Figma/FigJam integration?**

Is one-way export enough, or should editing, styling, and synchronization across tools be supported?

**Status:** Partly answered — retain plugin transfer; controlled refresh and reverse import need release placement in Q45.

**Why this matters:** The current plugin imports one-way data, reconstructs rounded frames, and loses some style/geometry fidelity. It does not synchronize later Figma edits back to Arbor.

**Decision needed:** Specify the target editor, expected editable structure, visual/semantic fidelity, distribution/install expectations, and whether synchronization or only export is required.

**Answer:** There is no current direct synchronization which is happening automatically. I think we'll have to keep it that way: if people want to use it on Figma, you use a plugin which connects the two products together, and you can update it accordingly.

Let's say a user has imported an existing map onto Figma and then they update that map. The Figma plugin should hopefully be able to detect that update and push it to Figma if the user wants to, given that the user has not made any changes to that map in Figma.

As for whether the user can take something from Figma and put it onto Arbor AI, I think that is also an interesting prospect, and we should have that as well. Not in the first release, but in the second one, for sure. 


**29. Priority — What were the local experiments trying to improve?**

You confirmed they should be reassessed. Do you remember what was working or frustrating about Mermaid generation, the connector tool, orthogonal edge editing, or layout styling? Are there any parts you specifically want to retain or discard?

**Status:** Answered — poor semantic generation, random placement and broken/unintuitive connectors are the experiment problems.

**Why this matters:** Mermaid, connector mode, orthogonal edges, hierarchy colors, and crossing styles form six local source edits. Their original user problem or comparative success is not recorded beyond code comments.

**Decision needed:** Describe what prompted each experiment and what felt better or worse. If memory is incomplete, say which choices may be assessed through representative tasks rather than reconstructed from history.

**Answer:** On the toolkit, developer, or code level, I am not sure what is not working correctly, but I can tell you that when I'm generating a map, it does not get generated in a way where, visually, I'm able to understand everything. Elements are being placed quite randomly. The connectors are not functioning properly. They are broken. Sometimes they connect and do nothing but just go behind the node. Sometimes they connect to the corner of the node. The connectors are not easy to interact with, like moving them around. They don't work logically like how a Figma connector would or how a Lucidchart connector would. It is bad in that sense, and that is primarily the issue.

The second is that what is being generated also doesn't always make sense. Sometimes it's just very random stuff. I don't know if that's the issue of how we have built out the system, or if that's just the AI, or if that's the AI not being able to interpret and actually build it out. I don't know. 


**30. Priority — Is arbor-ai.vercel.app the canonical demo?**

Which Vercel project, branch, or deployment is the source of truth? Is anyone using it, and does it contain work or behavior missing from this checkout?

**Status:** Partly answered — latest reviewed state should become canonical; deployed revision and endpoint failure are not verified.

**Why this matters:** The remote README links the demo, but no deployed revision, project owner, live configuration, or user usage was checked. GitHub and local experiment state are not the same deployable source snapshot.

**Decision needed:** Identify the canonical deployed project/revision, who operates it, who uses it, and whether there are additional changes/configuration to preserve. Do not supply secret values in the answer.

**Answer:** I'm not sure which one is the source of truth. Whichever is the latest is the source of truth. Technically, none of the platforms are working because I think the Grok API is expired, so none of it is working properly. Maybe if we update the API to Claude's, both the platforms will work. Whichever has the latest information is the one which is the source of truth, but both of them are quite primitive in nature at this point, I feel, and they need to be updated. 


**Delivery and constraints**

**31. Are there existing technical constraints?**

Should we retain Next.js and Groq? Are there requirements concerning models, providers, hosting, integrations, budget, or deployment ownership?

**Status:** Answered at direction level — replace current Groq provider, try Claude Sonnet, keep Vercel; renderer/framework changes require evidence.

**Why this matters:** Next.js/Groq are the current implementation, not a confirmed long-term constraint. Hosting, model quality, privacy, maintenance, and budget may influence the right architecture.

**Decision needed:** State fixed requirements versus preferences, providers/services already chosen, and who controls deployment/integration configuration. Identify migrations that are explicitly desired or forbidden.

**Answer:** We want to get rid of Grok and update it with a different model provider. Vercel is good. Next.js is something you had suggested we should use. If you feel there is a better way to build out the platform, we can do that.

Again, I know I go back to Figma all the time, but Figma does it really well, which is why I am not sure what Figma is built on. I think it is not the best way because using it with MCPs is not that helpful, but we can refer to Paper.design. They have done a good job with the platform, where I think everything, as you create it, is done in HTML and CSS, which makes editing with AI much better. Maybe that can be helpful in some way. Look into how Paper.design works, actually. 


**32. Which devices, browsers, languages, and accessibility needs should we support?**

Is the initial experience desktop-only, or does regular use include tablets or phones?

**Status:** Answered — laptop/desktop browser first and meaningful keyboard shortcuts; mobile later.

**Why this matters:** The UI is desktop-oriented with fixed panels, mouse dragging, global shortcuts, and English transcription. Mobile, keyboard-only use, assistive technology, reduced motion, and other languages lack defined acceptance.

**Decision needed:** List supported devices/browsers/input modes, accessibility expectations, language/localization scope, and which capabilities can be desktop-only or deferred in the first release.

**Answer:** Currently, we are supporting browsers only, so it can be used across any device, technically. It's built for laptop first. Down the roadmap, we can think about mobile as well, of course.

From an accessibility perspective, I think having keyboard shortcuts would be helpful for the most obvious choices and the most obvious shortcuts. Even having some specific shortcuts to the things that we are specifically building would also be nice, like using shortcuts like Command 1, Command 2, Command 3, and so on. Whatever else they are, they are the common shortcuts but platform-specific. 


**33. Is there feedback or a known issue that should take priority?**

Beyond the brief, are there problems you personally experienced, demo reactions, or current user needs that the code review cannot reveal?

**Status:** Answered — no additional feedback beyond the answers/brief.

**Why this matters:** You identified a brief as the existing material. This question is for remembered personal experience or any additional feedback that emerges, not a repeated request for materials already said not to exist.

**Decision needed:** Record actual frustrations, reactions, usage, or bug examples if known. State no additional feedback if that is the complete answer; do not invent research to fill the gap.

**Answer:** Nothing beyond what we already have so far and what I've already mentioned above. 


**34. What should the next work prioritize?**

Restoring reliability, validating the main PM/PD workflow, improving the interaction/design, or adding a particular capability? The review found issues in saving, chat context, Mermaid parsing, and layout preservation.

**Status:** Answered — correct generation first, live voice mode second, overall interaction third.

**Why this matters:** The code review established reliability issues, while the exact PM/PD workflow remains undefined. Technical correctness and product validation can have different dependencies and priorities.

**Decision needed:** Rank the next outcomes and explain any urgency. Clarify whether the first authorized implementation work should be a small repair, a workflow/design iteration, or another concrete capability.

**Answer:** Again, like I said, we need to prioritize:
1. The map turning out properly visually and the user being able to edit it to work properly.
2. The interaction itself. We need to improve how the interaction works.
3. The live mode (live chat mode).
I would like for it to be the very first thing that we work on, so let's actually switch it around:
1. Making the map generation turn out properly.
2. Live chat mode.
3. The interaction in general for the product.


**35. Are there collaborators, deadlines, or commercial plans that affect the work?**

Who makes product decisions, who will contribute, and are there expectations around pricing, distribution, or scope?

**Status:** Superseded by Q36 — the professor meeting was cancelled.

**Why this matters:** No collaborator structure, commercial plan, release ownership, timeline, or distribution commitment was supplied. These constraints can materially change scope and operating requirements.

**Decision needed:** Identify decision-makers/contributors, fixed dates, commercial intentions if any, distribution channel, and responsibilities. Explicitly mark any item that is not decided yet.

**Answer:** On Friday at the end of this week, I have a call with a professor of mine where I would like to demo this new version working well. That gives us 4 days, I guess, to work on this.

**Follow-up questions after reviewing your answers and brief**

These follow-ups retain the history and your latest answers. No meeting/demo planning is needed. The immediate work is a reliable graph-editing foundation followed by a full live voice experience. Remaining interaction details can be evaluated through visible prototypes; low-priority export questions do not block that work.

**36. Priority — What time is the professor demo on Friday, October 16, and where will it run?**

**Status:** Closed — meeting cancelled; no active demo deadline.

**Why this matters:** Friday of this week is October 16, 2026, in America/Detroit. We need the real cutoff and whether localhost is sufficient or a verified Vercel deployment is required.

**Decision needed:** Give the time/timezone, desired demo duration, and whether you will share your local browser, send a public link, or both. The existing deployment revision is not verified.

**Answer:** Well this plan just got cancelled so let's not worry about this meeting anymore


**37. Priority — What Claude API access is available, and what testing spend is acceptable?**

**Status:** Answered — Claude Console credits, initial budget about $20, incremental testing; credentials and default Sonnet access subsequently verified October 27.

**Why this matters:** The code uses Groq with Llama models, rather than xAI Grok. Your instruction to replace the provider with Claude Sonnet is clear, but “Claude tokens available” does not identify an integration endpoint, usable API credit, or model. Speech transcription is separate from graph/chat reasoning.

**Decision needed:** Do you have an Anthropic/Claude API account and API credits, or access through another provider? Give any Sonnet version preference and testing budget, or authorize choosing an available Sonnet within a stated limit. Configure credentials locally; do not paste keys here. Is a separate speech-transcription service acceptable after reasoning moves to Claude?

**Answer:** I have claude console credits, I think we can use it a little at a time. I can give you access to about $20 and then increase it if we need more


**38. Priority — What minimum live voice behavior would make Friday's demo successful?**

**Status:** Answered at scope level — build the full live experience without a demo-driven reduction; cadence and output details need prototyping.

**Why this matters:** Listening, interim transcripts, streamed AI text, and validated graph updates are separate capabilities. Extremely frequent updates can cause flicker, reinterpretation and unnecessary requests. Streamed tokens alone are not a correct graph.

**Decision needed:** Would automatically detected spoken phrases update the map while you continue talking, or must nodes change before a phrase finishes? Should Arbor speak back or only display questions/feedback? This defines an acceptable first live version; ordinary recording followed by manual submission is not silently treated as live mode.

**Answer:** We go full send, since the deadline has been removed


**39. Priority — When live mode is uncertain, what pauses and what happens if you do not answer?**

**Status:** Answered at intent level — distinguish conversation from build instructions; trigger phrases are a suggestion to evaluate, not a complete policy.

**Why this matters:** Q16 asks for clarification before uncertain changes, but also suggests continuing if the user does not answer. Listening and unambiguous graph changes can continue independently from the uncertain branch.

**Decision needed:** Choose a default: pause all graph commits; pause only the uncertain branch while listening continues; or show a tentative preview without committing it. If you keep talking/ignore the question, should Arbor continue only with unambiguous content or act on an explicitly visible assumption? Should live deletions be handled through undo, highlighted history, or quick review?

**Answer:** I think the system needs to understand when the user want to have a conversation and when they are instructing you to build. Maybe we could have a few trigger words, phrases and such which tells the model when they need to start building vs replying I guess. I will be able to direct better as I see the output as well


**40. Which assistance level is the default, and must all three levels be selectable for Friday?**

**Status:** Answered — implement all three assistance levels; no demo restriction; default remains a proposed design choice.

**Why this matters:** Full assistance, questions at key situations, and proceeding only from your answers are confirmed desired controls. Their default and release priority remain undefined. Listening and proactive critique need compatible behavior.

**Decision needed:** Choose a default and which modes the demo needs. Should live mode interrupt with opinions/questions or queue brief feedback at pauses? Settings must never silently override your position/styling preservation rule.

**Answer:** We do it all, no demo to be presented

**43. What should adding a link and reopening a source mean initially?**

**Plain-language clarification:** If you paste an article link, should Arbor read the article and use its contents, or only save the link? My proposed initial behavior is to read public pages and save their extracted text with the map so reopening does not lose that context. Sites requiring login can wait; users can paste their text instead. This is a proposal for the later source-input work, not a confirmed answer or a blocker for generation/live mode.

**Status:** Clarification provided below — deferred from immediate graph/live work.

**Why this matters:** You selected text, links and readable PDFs. Storing a URL reference, fetching a public page, and accessing an authenticated document are different workflows. The current app has no generalized link reader.

**Decision needed:** Should public links be fetched into saved text snapshots? Are private/authenticated links required now, or can users paste/export their content initially? Should source text persist after reopening, with a manual refresh when originals change? This does not require cloud storage by itself.

**Answer:** Not sure what you are talking about here.


**44. Should SVG/PDF exports be added now, or should we retain the existing export set initially?**

**Status:** Deferred — low priority, revisit during export work.

**Why this matters:** Existing code has PNG, Markdown reports, Mermaid and Figma JSON/plugin transfer. SVG and PDF are not implemented; SVG appears in the historical brief. “Keep all exports” could mean preserving current features or adding those formats.

**Decision needed:** Confirm whether the first release/demo needs SVG or PDF, or whether PNG, Markdown/PRD-style reports, Mermaid and Figma transfer are sufficient initially. The editable map remains primary.

**Answer:** This is low on priority


**45. Is controlled Figma refresh a first-release requirement or a second-release feature?**

**Status:** Deferred — low priority, revisit with export settings.

**Why this matters:** You want user-triggered refresh when Figma has not been edited. Today's plugin creates a new group and has no stable cross-tool identity, revision tracking, or conflict detection. Reverse import is explicitly second-release scope.

**Decision needed:** Should the first release retain one-way import and defer controlled refresh alongside reverse import, or implement refresh now? If the Figma copy has edits, should it refuse overwrite, create a separate updated copy, or offer a merge/review? Automatic bidirectional synchronization is not assumed.

**Answer:** This is low on priority as well, we can work on this when we are working on export settings



**October 27 implementation follow-through**

The user authorized beginning the recommended reliable-map milestone. No new product questionnaire is needed for this work. Existing answers and deleted Q41/Q42 remain unchanged. The user replied “I’ll configure it locally” to the credential setup request; that is an intention to configure ANTHROPIC_API_KEY in arbor_ai/.env.local, not confirmation it is present. Do not paste secrets into these files or the chat. A presence-only check still found the key absent. Independent graph/save/undo/Claude integration work has proceeded using local provider substitutes; real paid verification remains pending. The next product work after this foundation and a measured Claude trial is the live voice pipeline already described in Q38–Q40, not another open-ended question round.


**Credential follow-through resolved — October 27**

The user subsequently confirmed “I have updated the key.” A presence-only check found it configured, and real Claude Sonnet chat/generation requests succeeded. No further credential question is pending. The key itself is deliberately absent from these documents and chat. The measured synthetic trial and current usage estimates are recorded in plan.md and architecture.md. This update supersedes the earlier key-absent setup note and leaves every original answer unchanged. No new product question was needed.


**October 27 generation failure clarification and resolution**

User clarification preserved: “Immediately. I asked it for help in create an information architecture and had some back n forth”. This identified the normal chat → Generate workflow. It did not reopen the product direction or credential questions. The investigation reproduced a provider rejection of an assistant-ending request and repaired it by representing the Generate action as a model-only final user instruction. The full discussion stays intact. plan.md and architecture.md record the verified fix. No additional project question is pending from this issue.

**October 28 visual and interaction follow-through**

The user requested direct inspection of the current graph in Zen, clearer AI construction guidelines, and more familiar node/connector interaction using Figma as a reference. When concurrent browser activity interrupted inspection, the user confirmed “Zen is idle now.” The audit then exercised the actual intranet map. This confirmation concerns browser availability; it does not alter the product scope or grant permission to discard content.

No new product question is needed before addressing the observed defects. Existing Q9, Q12, Q18, Q23 and Q29 already establish preservation, flexible semantics, readable graphs, expected recovery and connector problems. product.md records proposed defaults; architecture.md records evidence and limits; plan.md records the recommended next work. The proposed layout roles and interaction defaults are recommendations, not additional answers attributed to the user. Preserve all original answers and the deleted Q41/Q42 gaps. Do not create another questionnaire or request the same requirements again.


**October 28 implementation authorization and operational follow-through**

The user approved the four-task editor quality pass with “Alright, why don’t you do that”. Existing answers are sufficient for the implementation; no new product questionnaire is needed. The implementation and verification ledger is in plan.md. A temporary request to reopen Zen concerns computer-control availability only; it does not change the intended product, rewrite an answer or authorize discarding the working map. The original map was downloaded through Arbor’s Editable map export before a separate test session was created.


**October 28 delivery reconciliation**

The user answered the operational browser fallback request with “Use the in-app browser”. The fallback was used only for local editor verification on a disposable imported map; the original Zen graph was retained. The four-task implementation, fresh review fixes and validation are recorded in plan.md and architecture.md. No new product decision is required before reviewing this editor pass. The next major product phase remains the already-requested live voice experience after acceptance of the graph/editor foundation; this note does not silently select a speech provider or alter any existing answer.


**Free connector clarification — October 28**

User requirement preserved: “the connector can be free, it doesn't have to be connected to a node at all times” and “the user should be able to move the endpoints of the connector around as well if they want.” No new product question is necessary. The existing node-only assumption is superseded by node-attached, partly attached and fully free connectors with movable start/end controls. product.md records the behavior; plan.md records implementation and verification. All original answers remain unchanged.


### October 28 directionality clarification

User requirement: “You can add an arrowhead on one end of it to showcase the directionality. Refer to how figma does it.” Implemented direction is start/source → end/target with a filled outward target arrow. This is sufficiently specified to proceed; no additional question is pending for this change.


### Free endpoint and directionality follow-up: closed for implementation

No new question is required for these explicit requests. The delivered defaults are a filled arrow at the target only; either end can be a real node attachment or a free canvas point; drag onto a node to attach, drag away to detach, and hold Alt to bypass snapping. Copying a connector without its attached node captures an independent free endpoint, allowing safe cross-map paste. All source implementation, test evidence, browser evidence and known verification limits are recorded in the existing plan/product/architecture files. The user’s original answers above were preserved unchanged. This closes the questions for this local editor follow-up; it does not invent answers to unrelated product decisions elsewhere in this file.


### Connector alignment report — October 28

The user reported off-center endpoint dots/arrow controls, particularly at high zoom. Reproduced at 216%, traced to control transform origins and border-relative node ports, and corrected. No additional question is needed: the acceptance criterion is exact alignment with the rendered path/arrow tip and node outer boundary across zoom. Measured evidence and verification are in architecture.md and plan.md.


### Layout selector clarification — October 28

User request: explain Automatic, Top to bottom and Left to right, and have selection rearrange the existing map immediately. Answered from the current implementation and implemented. No follow-up question is needed. Automatic chooses compact vertical organization when a primary branch has at least three children and horizontal organization otherwise; explicit directions override that choice. Changing an option applies it now; Tidy Up repeats the current option; Undo restores the prior arrangement. The full behavior and verification are recorded in product.md, architecture.md and plan.md.


### Node connection highlighting request — October 28

User request: clicking a node should highlight its associated arrows so the destinations are clear. Implemented for directly attached incoming and outgoing arrows, with lighter borders on directly connected nodes and the original arrow direction preserved. Shift-selection combines the immediate relationships; blank-canvas selection clearing restores the original styling. This is visual context, so connected elements remain unselected and their saved styling/history do not change. No follow-up question is needed for this request. Implementation and verification are recorded in architecture.md and plan.md.
