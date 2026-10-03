# WisdomTree implementation roadmap

> **For agentic workers:** Use `superpowers:executing-plans` for inline execution,
> or `superpowers:subagent-driven-development` only when delegated execution is
> selected. Work through the checklists and record evidence before marking items
> complete. The user's scope and no-new-tests instructions take precedence.

**Updated:** 2026-10-03.
**Goal:** Help an individual explore topics, connect observations, and develop
finished writing, with deliberate sharing and live collaboration for a small team.
**Architecture:** Keep the existing modular Next.js application and PostgreSQL
storage. Reuse stable content identities, version history, authentication, and
file storage. Consolidate conflicting ownership and editing rules before adding
the shared whiteboard and live editing.
**Stack:** Existing Next.js, React, TypeScript, Drizzle, PostgreSQL, and object
storage. Any additional dependency must solve a demonstrated requirement.
**Archived discussion:** [Personal exploration and shared topic workspaces](./archive/superpowers/specs/2026-10-03-topic-workspace-product-brief.md).

This is the canonical delivery order agreed after the codebase audit. It replaces
the earlier panel-first sequence in
[the initial roadmap](./archive/superpowers/plans/2026-10-03-topic-workspace-roadmap.md).
The [reference-panel plan](./archive/superpowers/plans/2026-10-03-personal-reference-panels.md)
is candidate work for phase 3, not the first prerequisite. Older documents that
prioritize Vaults, immutable-only public publication, or RAG do not override this
roadmap. This document describes intended work, not shipped capabilities.

## Agent entry point and current status

**Session scope (2026-10-03):** implementation resumed at the user’s request.
Phase 1 is in progress on `feat/topic-foundation-20261003` in
`/tmp/wisdomtree-phase1-20261003`. No phase is complete; the earlier panel
prototype remains isolated and unmerged.

Read applicable working instructions, then this roadmap. Read supporting docs,
relevant source, and existing checks only as needed for the current task; the
historical archive is not required onboarding. [docs/README.md](./README.md)
explains document authority. This roadmap is the entry point, not the only file
an agent needs to inspect before changing code.

**Current implementation step:** phase 1 access-path inventory and
permission/lifecycle matrix (1.1–1.2). Resolve blocking decisions D1–D8 before
their dependent work. The phase-1 plan is
`docs/plans/2026-10-03-phase-1-foundation.md` in the implementation worktree;
the older panel-first sequence must not be resumed as-is.
Documentation alignment does not complete phase 1 or prove the product works.
The [phase-1 result](./results/2026-10-03-phase-1-foundation.md) records the first
four-file repair, passing fast/integration/privacy/build checks, and an 8/8 final
browser run. Earlier intermittent failures remain recorded. Phase 1 remains in progress.

Keep product decisions, next steps, and checklist status here. Supporting plans
and result records must identify their roadmap phase and evidence; they cannot
silently override its requirements.

## 1. Leading rule: simplicity

- Preserve working, readable code. Refactor only where a concrete defect or the
  agreed workflow requires it; file length alone is not a reason.
- Reuse Project as the topic workspace identity. Keep existing IDs and URLs unless
  a specific requirement makes a change necessary. Do not introduce another
  Topic/Vault/Space container alongside it merely to change visible terminology.
- Keep one note identity for quick thoughts and long writing, one owning location,
  and one authoritative permission decision for each operation.
- Views and cross-topic references never duplicate content or grant access.
- Services own authorization and transactions. Pages and APIs consume their
  results; UI capability flags describe those same rules.
- Prefer explicit functions and relationships over a generic permission engine,
  universal entity framework, event bus, or plugin system.
- Introduce shared helpers only when they remove real duplication. Keep existing
  UI components, translation catalogs, and visual tokens where useful.
- Preserve source versions and historical evidence even when simplifying the
  writing experience. Do not force users to understand that machinery to write.
- Each phase must provide a usable result and retire the conflicting path it
  replaces, after checking callers and data. Do not indefinitely maintain two
  editing or sharing systems for the same content.

## 2. Agreed product contracts

| Concern | Required behavior |
| --- | --- |
| Audience | Personal exploration first; collaborators extend that same workflow. People recorded in research need not have user accounts. |
| Topic | Ongoing exploration with no required outcome or deadline. A name is sufficient to start. |
| Note | A standalone idea or longer piece of writing; one identity can appear in several topics. |
| Personal content | Notes and materials start private and creator-owned. Topic ownership does not expose unshared content. |
| Direct sharing | The personal owner may grant access without transferring ownership. |
| Contribution | Explicit contribution transfers ownership to exactly one topic. Adding content to that topic's shared folder counts as contribution. Preserve authorship and contributor edit rights. |
| Topic-owned content | The topic owner controls access and publishing. Other topics can reference it without acquiring ownership or access. |
| Sharing | Individual items, bulk selection, and folders whose existing and future contents inherit access. Highest applicable granted access wins: edit > comment > read-only. |
| Permissions | Read-only, comment, and edit. Editors can contribute, edit, and recoverably delete where permitted. Only the owner changes sharing/public status. |
| Whiteboard | One shared arrangement per topic, automatically containing relevant atomic notes. Private items appear only to authorized viewers. |
| Panels | Each user chooses their own open panels and arrangement. Notes and materials open beside writing. |
| Collaboration | Authorized users see shared text edits and card movement live. Read-only access does not permit board mutations. |
| Connections | Manual links plus explained suggestions from words/shared context. Suggestions search accessible content only. Existing inaccessible note links display “Private note.” |
| Tasks | Visible to topic members. Owners create/manage/assign; assignees update their own progress. Tasks may have deadlines. |
| Materials | Upload and view/play supported documents, images, and recordings inside the app. |
| Publishing | Individual notes only; owner opts in. Every successful save by an authorized editor then updates the public page. Deletion immediately hides the public page. |
| Accountability | Record who changed what and when; retain previous content and recover deletions. Restoring content must not silently restore old permissions. |

### Decisions to resolve before dependent implementation

Agreed rules above are not reopened by this table. Resolve each remaining edge
once, record the outcome here, and implement against it. Independent work can
continue while an answer is pending; do not guess a privacy or ownership rule.

| ID | Decision needed | Required before |
| --- | --- | --- |
| D1 — resolved 2026-10-03 | Removal from a topic revokes the contributor’s retained access to their contributions. Preserve authorship and history. | Implement in phase 2 member-removal/contributor-access behavior. |
| D2 — resolved 2026-10-03 | Exactly one owner per topic; ownership may transfer to another member. Existing Projects still require a verified owner mapping before migration. | Phase 2 ownership migration and owner-management UI. |
| D3 — resolved 2026-10-03 | The topic owner controls contribution withdrawal and ownership transfers. Contributors cannot take back ownership unilaterally. Reference/grant transition details must respect D4. | Phase 2 transfer/withdrawal operations. |
| D4 — resolved 2026-10-03 | Highest applicable grant wins: edit > comment > read-only. Moving an item removes old-folder inheritance, applies new-folder inheritance, and preserves direct shares. No restricted-item exceptions inside shared folders. | Phase 2 folder access. |
| D5 — resolved 2026-10-03 | Deleting a published note immediately hides its public page. Restoring content leaves it unpublished until the owner explicitly republishes. Preserve recoverable content and history. | Phase 2 deletion contract; phase 6 public behavior. |
| D6 | The first supported preview/playback formats and handling of unsupported formats. Proposed starting set: PDF, plain text, PNG/JPEG/WebP, browser-supported audio, with download fallback. | Phase 3 material viewers. |
| D7 | Durable save/checkpoint boundaries during live editing; attribution for multiple editors; board restoration scope; visibility of historical logs. | Phase 4 synchronization/history design. |
| D8 | Whether personal panel layouts persist across reload/devices. The unfinished panel prototype preserves them only while mounted. | Phase 3 layout persistence. |

## 3. Starting point and scope boundaries

The audit baseline is main commit `addc66c`. It already has authentication,
Projects, private drafts, notes, materials, tasks, versions, comments, presence,
and publication. These are reusable foundations, not proof the new contracts work.

Earlier execution produced uncommitted reference-panel changes on
`feat/topic-workspace-20261003`, in `/tmp/wisdomtree-topic-workspace-20261003`.
They are paused, unmerged, and not an accepted phase. Locate and review that work
before reusing it; a temporary directory is not a durable delivery record.

Evidence from the earlier run:

- Baseline `npm test` passed, including 20 unit files and layer/style checks.
- The modified worktree's clean-seed integration run passed 29 files.
- The research-intent browser suite had 6 passing and 2 failing scenarios; the
  failing cases reference `.ui-next-research-path`, absent from the baseline UI.
- The initial worktree build passed; a subsequent rebuild failed resolving Next.js
  files through shared dependencies. The final modified source has no accepted
  complete build/browser gate. Re-establish isolated dependencies before reuse.

These observations are historical execution evidence, not current phase completion.
Checkboxes record only verified work. See the current phase result for evidence.

**Outside this release:** AI/RAG, automatic AI linking, public folder/topic sites,
page/timestamp annotations, standalone chat, portfolio builders, and additional
project-management features. Existing functionality outside the new workflow is
not automatically authorized for deletion. The previous RAG roadmap is preserved
in Git history and is no longer an active priority.

## 4. Sequence and phase contracts

| Phase | Deliverable | Depends on | Required handoff |
| --- | --- | --- | --- |
| 1 | Clear ownership, permission, and save/share/publish contracts; focused baseline repairs. | Audit and agreed brief | Permission matrix, lifecycle table, migration inventory, corrected baseline evidence. |
| 2 | Personal content, explicit contribution, direct/bulk/folder access, versioned recovery. | Phase 1; D1–D5 as applicable | Working services/APIs/UI; safe migration mapping; denied-access evidence across old and new surfaces. |
| 3 | Topic whiteboard, personal panels, long writing and material viewing. | Phase 2; D6 and D8 | Usable topic workspace with preserved content, positions, and local writing state. |
| 4 | Live editing and board updates with durable attribution and recovery. | Phases 2–3; D7 | Concurrent-session, reconnect, revocation, and restart evidence. |
| 5 | Correct task controls and simple connection suggestions. | Phase 2; phase 3 integration; phase 4 event integration | Owner/assignee enforcement and explainable privacy-filtered suggestions. |
| 6 | Public-on-save publishing and complete end-to-end release validation. | Phases 1–5; D5 | Public/private boundary proof, migration rehearsal, acceptance results, operational handover. |

Use the ordered phases for integration. Independent preparation may overlap, but
never call a later feature complete while its ownership or persistence dependency
is missing. Each phase needs a small file-level implementation plan under `docs/plans/`
before edits;
this roadmap establishes required outcomes without inventing unreviewed APIs.

## Phase 1 — Consolidate rules and repair the foundation

**Primary code:** `src/modules/auth/authorize.ts`, `auth/core.ts`,
`project/service.ts`, `vault/access.ts`, `application/context.ts`,
`application/notes.ts`, `application/tasks.ts`, `publication/service.ts`,
`knowledge/drafts.ts`, and their API callers. Paths are under `src/modules/`
unless otherwise stated.

- [ ] **1.1 Inventory access paths.** Trace note/material reads, writes, history,
  comments, search, graph, export, publication, file URLs, task previews, and
  membership changes. Record the current check and intended owner for each.
- [ ] **1.2 Define the permission matrix.** Include personal owner, topic owner,
  original contributor, editor, commenter, reader, unrelated member, outsider,
  and anonymous visitor. Evaluate direct service calls as well as HTTP requests.
- [ ] **1.3 Define content operations.** Separate saving, direct sharing,
  contribution, public publishing, deletion, and restoration. Document ownership,
  visibility, durable version, and audit effects of each operation.
- [ ] **1.4 Reconcile old authority.** Map global roles, Core privileges, Space
  membership, Vault ownership, personal branches, and protected-review paths to
  the agreed rules. Record what remains operational/admin-only, what is replaced,
  and what requires data migration. Do not silently keep an owner bypass.
- [ ] **1.5 Make services authoritative.** Move missing resource-access
  prerequisites into mutation services, including publication; routes should not
  be the only protection. Derive UI capabilities from the same resource decision.
- [x] **1.6 Restore permission-key type safety.** Preserve literal catalog keys
  instead of widening them to arbitrary strings in `auth/authorize.ts`.
- [x] **1.7 Correct note-page errors.** In
  `src/app/app/projects/[projectId]/notes/[noteId]/page.tsx`, preserve intentional
  missing/inaccessible handling while letting unexpected failures reach the error
  boundary. Do not present a service outage as a missing note.
- [x] **1.8 Repair stale acceptance checks.** Update existing checks for current
  behavior, including obsolete research-page selectors. Keep meaningful access,
  save, and layout assertions; do not hide failures by deleting their purpose.
- [ ] **1.9 Inventory migration and retirement.** Locate existing ownership/data
  associations and callers of old Vault/editing paths. Separate safe code removal
  from data that must be mapped or retained. Document unresolved records.
- [ ] **1.10 Align authoritative documentation.** Update product/architecture
  descriptions and documentation links as rules settle. Mark historical plans as
  superseded without erasing useful history. Do not describe planned features as
  already implemented.

**Exit gate:** One reviewed permission matrix and lifecycle table; every mutation
has its required resource check inside the service; baseline defects addressed;
existing checks run with exact outcomes; no silently inferred ownership or
permissions. Schema-affecting implementation proceeds only after its relevant
D1–D5 decision is recorded.

## Phase 2 — Personal content, contribution, sharing, and recovery

**Primary code:** `src/modules/project/schema.ts`, `knowledge/schema.ts`,
`knowledge/drafts.ts`, `knowledge/service-queries.ts`,
`knowledge/service-mutations.ts`, `storage/schema.ts`, `storage/service.ts`,
`storage/object-store.ts`, `audit/service.ts`, the application facade,
`src/app/api/blob/[token]/route.ts`, and `drizzle/` migrations.

- [ ] **2.1 Define the minimal schema delta.** Reuse stable note/material and
  Project IDs. Represent creator separately from effective owner, and topic
  references separately from ownership. Enforce exactly one owning topic after
  contribution; do not create another parallel content store.
- [ ] **2.2 Make personal notes durable.** Save an atomic or long note privately
  without first publishing an official team version. Preserve existing drafts,
  content, history, and evidence during transition. Permit rough capture without
  requiring a research purpose or completed title before saving.
- [ ] **2.3 Make personal materials durable.** Upload privately, report upload
  failures accurately, and keep successful files usable while extraction is
  pending. Do not require extraction success for basic reading/download.
- [ ] **2.4 Implement contribution.** Clearly disclose transfer and audience;
  atomically transfer ownership, preserve creator attribution and identity, grant
  contributor rights, and record the event. Repeated submission cannot duplicate
  content or transfer it twice.
- [ ] **2.5 Implement direct and bulk sharing.** Support read/comment/edit grants
  and revocation for selected people. Only the effective owner changes grants.
  Define and display atomic versus per-item bulk outcomes; no silent partial
  sharing when an item is denied, stale, or missing.
- [ ] **2.6 Implement shared folders.** Include notes and materials; inherit
  current/future access under D4. Explain contribution when adding personal
  content. Prevent cycles and unauthorized moves; preserve explicit grants
  according to the chosen policy, without granting access accidentally.
- [ ] **2.7 Implement cross-topic references.** Reuse one item without copying it
  or expanding permission. Removing a reference does not delete the original.
  Personal topic association must not count as contribution without consent.
- [ ] **2.8 Implement recoverable deletion.** Retain identities, file versions,
  authorship and evidence. Restore content using current access rules; never
  resurrect revoked grants. Apply D3/D5 to withdrawal and public content.
- [ ] **2.9 Close alternate access paths.** Apply the same rules to search,
  backlinks, graph, exports, comments/mentions, notifications, task links,
  historical versions, and file delivery. Recheck download access after revocation;
  do not rely solely on a previously issued URL or client-side hiding.
- [ ] **2.10 Expose useful history.** Let authorized people inspect content
  changes and recover items. Filter audit details so unrelated private titles,
  collaborators, or grant changes do not leak through history.
- [ ] **2.11 Rehearse migration.** Use disposable old-schema data and a fresh DB.
  Supply verified owner mappings, report ambiguous records, preserve counts/IDs/
  file keys/versions, and demonstrate retry/rollback behavior. Do not apply to the
  normal database during development.
- [ ] **2.12 Retire replaced paths.** Remove superseded UI/API entry points only
  after data and caller checks. Keep compatibility only where an actual caller
  requires it, with an explicit removal condition.

**Exit gate:** Private content is invisible to topic owners until deliberately
shared/contributed; all grant levels work; contribution preserves identity; bulk
and folder sharing follow recorded rules; cross-topic links grant nothing;
revoked access fails on every inspected read surface; deletion is recoverable;
migrations pass without losing historical evidence.

## Phase 3 — Topic whiteboard and personal writing workspace

**Primary code:** `src/app/app/projects/[projectId]/page.tsx`, its `_components/`,
`notes/_components/`, `materials/_components/`, shared `src/app/components/ui-next/`,
`src/modules/application/notes.ts`, `materials.ts`, `graph.ts`, and phase-2 services.
Use a small dedicated board module if persistent board operations need one; do not
turn the existing force-directed graph into a second source of truth.

- [ ] **3.1 Simplify topic entry.** Start a topic with a name. Make research
  description and other metadata optional. Use consistent visible language while
  retaining stable route and database identities.
- [ ] **3.2 Build the primary workspace.** Make whiteboard, recent notes, and the
  task board readily accessible. Keep materials and collaborators close to the
  work; avoid mandatory dashboard steps before writing.
- [ ] **3.3 Support thought capture.** Create a note directly on the board with
  an explicit keyboard/button alternative to clicking empty space. Save privately
  by default; clearly distinguish a shared-folder contribution context.
- [ ] **3.4 Persist the board.** Store positions per topic and note reference;
  automatically place new relevant notes without duplicating cards or resetting
  existing arrangements. Reloads preserve positions. Moving a card cannot mutate
  its ownership or permissions.
- [ ] **3.5 Enforce board visibility/actions.** Readers observe, commenters
  discuss, and editors arrange only permitted shared state. Private cards and
  their content/positions are not serialized to unauthorized collaborators.
  Resolve private-to-shared placement using phase-1 rules, not hidden client state.
- [ ] **3.6 Build personal panels.** Open notes/materials beside writing; support
  multiple panels without duplicating editor state for the same note. Opening,
  resizing, focusing, or closing a reference must not discard unsaved work.
  Persist layouts only as decided in D8, separate from shared board positions.
- [ ] **3.7 Review the paused panel prototype.** Reuse only verified parts.
  Replace unnecessary per-panel polling/heavy detail reads with the smallest
  appropriate read path; integrate later live updates instead of maintaining
  parallel refresh systems. Preserve real project identity for cross-topic opens.
- [ ] **3.8 Support long writing.** Reuse the note model and suitable editor
  components. Keep source notes/materials visible beside the editor. Saving must
  not require promotion, research classification, or public publication.
- [ ] **3.9 Deliver material viewers.** Implement D6 with real files and exact
  selected versions. Provide error/retry/download states and safe rendering.
  Confirm audio playback/seek and PDF reading, not just the presence of an element.
- [ ] **3.10 Make navigation accessible.** Provide keyboard card actions, clear
  focus, readable controls, and usable narrow-screen panel switching. Preserve
  writing state while switching surfaces; dialogs must return focus correctly.
- [ ] **3.11 Handle errors locally.** A failed reference must not replace the
  whole workspace. Cancel obsolete fetches, prevent late responses filling a
  different panel, retain failed-save text, and accurately display save status.

**Exit gate:** A user can capture, reopen, connect, and develop a thought with
sources beside it. Board positions persist; two users have independent panel
layouts; private content remains private; keyboard and 390px/1440px browser flows
work. This phase alone is not proof of concurrent collaborative editing.

## Phase 4 — Live collaboration, durable saves, and attribution

**Primary code:** Existing note save/history services, board operations,
`src/modules/application/collaboration.ts`, `src/modules/notify/service.ts`,
`src/modules/audit/service.ts`, editor state, and authenticated delivery routes.

- [ ] **4.1 Specify the synchronization contract.** Resolve D7. Choose the
  smallest proven approach for simultaneous text edits and board moves. Record
  transport, persistence, authorization, reconnect, and deployment requirements;
  compare a maintained editing dependency with the complexity of writing our own.
- [ ] **4.2 Implement authorized live sessions.** Authenticate connections and
  authorize each subscribed resource and mutation. Membership in a topic is not
  permission to receive all its notes. Never broadcast private payloads for the
  client to filter afterward.
- [ ] **4.3 Implement shared text editing.** Merge concurrent edits without
  silently overwriting another person's work. Reopening the same note in another
  panel must use its existing identity and collaboration state.
- [ ] **4.4 Implement live board operations.** Propagate permitted card movement,
  note creation, links, and deletion consistently. Specify deterministic handling
  of competing moves and deletion during another user's edit.
- [ ] **4.5 Implement durable checkpoints.** Distinguish locally typed, delivered,
  and durably saved content. Record contributor attribution and restorable versions
  together with committed changes. Do not credit a merged edit to an arbitrary
  final saver or claim a save before persistence succeeds.
- [ ] **4.6 Handle disconnects and retries.** Retain unsaved work, show connection
  state, reconcile on reconnect, and prevent duplicate operations. Do not promise
  a full offline editing mode beyond the explicitly supported recovery behavior.
- [ ] **4.7 Enforce revocation mid-session.** Stop writes and future delivery when
  access changes, including stale tabs/sessions. Clear inaccessible active views
  appropriately; previously downloaded bytes cannot be recalled from a reader.
- [ ] **4.8 Verify restart and recovery.** Persisted notes, board positions, and
  attributed history survive server restart. Undo/restore respects current rights
  and does not silently erase another collaborator's later changes.
- [ ] **4.9 Remove redundant refresh paths.** Integrate panels, recent notes,
  comments/presence where appropriate, and shared board updates without multiple
  unrelated polling loops for the same data.

**Exit gate:** Two independent browser sessions demonstrate overlapping edits,
shared moves, correct author attribution, reader/commenter denials, connection
loss/rejoin, revocation, and server-restart recovery. Presence indicators or
sequential saves do not satisfy this gate.

## Phase 5 — Task permissions and useful connections

**Primary code:** `src/modules/pm/service.ts`, `pm/schema.ts`,
`application/tasks.ts`, `knowledge/service-mutations.ts`, `application/search.ts`,
`search/service.ts`, `application/graph.ts`, task APIs, task dialog/board, Calendar,
My Work, and whiteboard connection controls.

- [ ] **5.1 Separate task abilities.** Replace broad `canEdit` assumptions with
  owner management and assignee progress capabilities. Owners alone create,
  assign/reassign, and change task details; assignees can update their own status.
  Assignment is a task-specific ability, not note or board edit permission.
- [ ] **5.2 Enforce the rules server-side.** Reject assignee changes to ownership,
  assignments, title, deadlines, or other management fields, including mixed
  requests containing both an allowed status and a forbidden field. Preserve
  optimistic concurrency and status history.
- [ ] **5.3 Show shared workload.** Topic members see the task board, assignees,
  progress, and optional deadlines. Calendar and My Work expose the same abilities.
  Automatic previews of linked private items reveal no private content.
- [ ] **5.4 Implement manual connections.** Link existing notes without copying
  them. Show “Private note” for an existing inaccessible destination; do not expose
  its title, preview, or contents through link metadata or public rendering.
- [ ] **5.5 Implement simple suggestions.** Use matching words and shared sources,
  tags, or connections already available. Filter authorization before ranking or
  returning candidates. Show a concrete reason and require confirmation to link.
- [ ] **5.6 Bound discovery work.** Limit returned candidates, avoid loading an
  entire growing corpus into the browser, and exclude duplicate/self suggestions.
  Do not add AI, embeddings, or a new search service for this requirement.
- [ ] **5.7 Integrate without clutter.** Make connections and workload available
  from the topic workspace; suggestions remain optional and never interrupt
  capture or automatically rearrange the board.

**Exit gate:** Owners manage tasks, assignees only update their progress, all topic
members see workload, unauthorized writes fail, links preserve identity/privacy,
and each suggestion has an understandable reason and an explicit accept action.

## Phase 6 — Public-on-save publication and release verification

**Primary code:** `src/modules/publication/service.ts`, `publication/schema.ts`,
`application/publication.ts`, the authoritative save/checkpoint service,
`src/app/api/app/projects/[projectId]/notes/[noteId]/publication/route.ts`,
`src/app/p/[slug]/page.tsx`, history views, and publication controls.

- [ ] **6.1 Implement owner-only public controls.** Publish/unpublish an individual
  note; editors cannot change public status. Show clearly when a note is public
  and that successful saves will update its public page.
- [ ] **6.2 Connect durable saves to public state.** Every successful authorized
  save/checkpoint of a published note updates the public representation, including
  collaborator edits. Preserve stable URLs and prior versions without a second
  manual publishing step. Failed saves must not advance the public page.
- [ ] **6.3 Preserve concurrency and attribution.** Concurrent saves cannot move
  the public page backward or lose contributors' history. Saving concurrently with
  unpublish/deletion must not unintentionally republish the note; apply D5.
- [ ] **6.4 Protect public boundaries.** Publication grants no access to its topic,
  folder, private linked notes, private file URLs, or internal history. Render
  inaccessible references safely. Public visibility of a note does not make its
  authors' other content discoverable.
- [ ] **6.5 Verify public freshness.** Test anonymous reads after successful saves,
  failed saves, unpublish, deletion, restoration, and access changes. Check cache
  behavior and real served content, not just database rows.
- [ ] **6.6 Run the full acceptance journey.** Execute the scenarios below against
  the final integrated build with separate user sessions and an anonymous reader.
- [ ] **6.7 Rehearse installation and upgrade.** Validate fresh and existing-data
  migrations, verified ownership mapping, file availability, backup/restore,
  standalone assets, deployment configuration, and health checks in isolation.
- [ ] **6.8 Finish documentation and cleanup.** Update product, architecture,
  operations, vocabulary, and entry links to match delivered behavior. Remove
  verified obsolete code/imports and superseded UX paths; preserve migration
  history and unrelated features/data.
- [ ] **6.9 Produce the handover.** Record commits, migration steps, gate results,
  browser evidence, remaining limitations, and recovery instructions. Separately
  report local validation, merge status, migration status, and deployment status.

**Exit gate:** The complete private-to-shared-to-public journey works, public saves
are fresh and attributable, unauthorized access is denied, recovery is proven,
and no required acceptance item is hidden behind a blanket PASS claim.

## 5. Whole-product acceptance checklist

Use the Computational Aerodynamics example with a topic owner, contributor,
commenter, reader, unrelated user, and anonymous visitor. Use separate sessions.

- [ ] **A1 — Explore without a plan:** create an open-ended topic, capture an
  untitled thought, upload material, leave, and resume through recent notes/tasks.
- [ ] **A2 — Privacy first:** the topic owner cannot read another person's private
  notes/files through UI, APIs, search, board payloads, history, or downloads.
- [ ] **A3 — Deliberate contribution:** contribute content after seeing the transfer
  notice; confirm one identity, topic ownership, preserved author, and correct
  contributor rights. Apply the recorded removal/withdrawal decisions.
- [ ] **A4 — Share at scale:** share selected items, share a folder, add future
  contents, change/revoke grants, and verify the chosen inheritance rules.
- [ ] **A5 — Reuse ideas:** reference one note from two topics; edit it once and
  observe the same content without new ownership or unintended access.
- [ ] **A6 — Think together:** create/move/connect permitted cards in two sessions;
  confirm private cards remain private and readers cannot mutate the board.
- [ ] **A7 — Write with sources:** use different personal panel layouts, read/play
  materials beside a long note, and preserve unsaved text through panel changes.
- [ ] **A8 — Collaborate reliably:** overlap text edits, disconnect/reconnect,
  revoke access, restart the server, and inspect accurate versions and actors.
- [ ] **A9 — Coordinate work:** owner creates/assigns a dated task; assignee changes
  progress but cannot change management fields; members see the shared workload.
- [ ] **A10 — Discover connections:** manually link and accept an explained
  suggestion; inaccessible existing destinations show only “Private note.”
- [ ] **A11 — Recover content:** edit, replace a file, delete, and restore; verify
  preserved identity/history and that revoked access remains revoked.
- [ ] **A12 — Publish deliberately:** owner publishes one note; collaborator saves
  an edit; anonymous reader sees the update, but gains no access to private
  sources, topic data, history, or public controls.
- [ ] **A13 — Handle failure honestly:** failed upload/save/reference load retains
  existing work and offers a usable recovery path; no false “Saved” state.
- [ ] **A14 — Use it across screens:** complete core flows by keyboard and at
  390px/1440px, checking focus, readable controls, and usable panel switching.

## 6. Validation and progress discipline

The standing instruction is **do not write new tests unless asked**. Run existing
checks; update existing checks when their accepted behavior changes. Use recorded
disposable service/API/browser scenarios for uncovered requirements, and explicitly
report the resulting gaps in durable automated coverage. Do not weaken assertions
just to get a green run.

| Change | Required evidence |
| --- | --- |
| Small source change | Relevant existing checks, lint/typecheck as applicable, and `git diff --check`. |
| UI/layout change | Existing unit/style/contrast checks and actual browser interactions, including narrow/wide screens. |
| Authorization/content mutation | Existing integration/privacy/usecase suites plus the affected actor/resource scenarios. |
| Schema/ownership migration | Fresh install, old-schema upgrade, explicit mapping, preserved IDs/counts/history, and retry/recovery evidence. |
| Live synchronization | Independent concurrent sessions, lost connection, revocation, durable save, and restart scenarios. |
| Final candidate | Full existing suites, production build, standalone assets, E2E, and A1–A14. |

Existing commands are `npm test`, `npm run test:integration`,
`npm run test:usecase`, `npm run test:privacy`, `npm run build`,
`npm run test:standalone`, and `npm run test:e2e`. `npm run test:all` combines them;
verify its fixture assumptions instead of treating its existence as proof.

Follow [tests/README.md](../tests/README.md): use a distinctly named isolated test
database, matching test/runtime database URLs, and separate object storage. Reseed
between stateful suites when required. Never use normal app data for destructive
seeding. Do not run a build over a server using that build directory. Check final
source rather than citing a successful build made before the last edit.

For each phase, record a result under `docs/results/` containing its
source commit range, checklist status, commands and exact outcomes, scenario
results, artifact paths, decisions, unresolved issues, and next dependency. Mark
items complete only with evidence. A failing or unavailable required gate remains
visible; static checks do not establish browser, concurrent-editing, migration, or
deployment readiness.

## 7. Immediate next actions

- [ ] Start phase 1 with the access-path inventory and permission/lifecycle matrix.
- [x] Resolve D1–D5 product decisions. Verify existing Project owner mappings separately before migration.
- [ ] Repair the focused baseline defects and stale existing checks.
- [ ] Produce the minimal phase-2 schema/migration plan from that evidence.
- [ ] Keep the unfinished panel work isolated until phase 3 review; do not merge
  it solely because parts of an earlier validation run passed.
