# Topic Workspace Delivery Roadmap

**Status:** proposed sequence for review; no implementation started.
**Spec:** [approved product brief](../specs/2026-10-03-topic-workspace-product-brief.md).
**Inspected baseline:** `db915a6`.

## Approach

Reuse the existing Project identity for the topic workspace during incremental
implementation. Keep internal IDs and URLs stable. Changing visible vocabulary
is a separate copy decision, not a reason to migrate every Project table.

Deliver independent slices. Start with personal panels, which are useful with
current content and access rules. Ownership changes need a dedicated design
before they can safely replace the existing branch/space authorization model.
Live collaborative writing also needs a dedicated persistence and synchronization
design; existing comments and presence do not implement concurrent editing.

## Current source evidence

| Requirement | Existing foundation | Gap |
| --- | --- | --- |
| Private writing | `knowledge/drafts.ts`, `nodeDrafts` in `knowledge/schema.ts` | Private drafts are not yet reusable personal atomic notes with item-level sharing. |
| Topic identity | `project/schema.ts`, `project/service.ts` | Shared membership roles do not establish the requested single owner and per-item rights. |
| Materials | `storage/schema.ts`, `storage/service.ts`, `application/materials.ts` | Folder access currently follows spaces; notes and materials need a consistent contribution rule. |
| Multi-panel writing | `notes/_components/note-workspace.tsx`, `note-editor.tsx`, `material-detail.tsx` under the project routes | Existing note workspace has reader/editor and inspector, not independently opened references. |
| History | `treeNodeVersions`, `sourceVersions`, `audit/service.ts` | Existing snapshot and audit support must be extended to recoverable deletion and collaborative attribution. |
| Tasks | `pm/service.ts`, `application/tasks.ts` | Current `canEdit` is creator-or-assignee; new rules distinguish owner management from assignee progress. |
| Public notes | `publication/service.ts` | Publication points to a selected immutable version and reports unpublished changes; public-on-save is a behavior change. |
| Connections | `knowledge/service-mutations.ts` link synchronization; `application/graph.ts` | Graph viewing is not a manually arranged whiteboard. Explainable suggestions and private placeholders need scoped projections. |
| Live work | `application/collaboration.ts` | Comments/presence APIs are not concurrent note and board synchronization. |

Paths in this table are relative to `src/modules/` unless a project route is named.
These are source observations, not current runtime PASS claims.

## Delivery slices and dependencies

| Slice | Deliverable | Depends on | Completion evidence |
| --- | --- | --- | --- |
| 1. Personal panels | Write with several reference notes/materials alongside; layouts affect only the current user. | Current app | Browser proof of preserved drafts, independent panels, authorized references, and material playback. |
| 2. Ownership and sharing | Personal items; explicit topic contribution; one owning topic; direct/bulk/folder grants; author attribution; recoverable changes. | Reviewed ownership design | Isolated DB authorization matrix and migration dry run, including old routes and revoked downloads. |
| 3. Topic whiteboard | Automatic note cards, stored positions, manual connections, recent notes and task entry points. | Slice 2 | Reload preserves positions; private notes absent from other users' responses; keyboard and narrow-screen interactions work. |
| 4. Live collaboration | Concurrent shared writing and board movement, access revocation, durable checkpoints and attributed history. | Slices 2–3 and synchronization design | Two actual browser sessions, overlapping edits, disconnect/reconnect, revocation, recovery, and persistence after restart. |
| 5. Connections and task rules | Explained accessible-note suggestions; private link placeholders; owner-managed tasks and assignee-only progress changes. | Slice 2; integrate with slice 3 | Direct API and browser permission scenarios; suggestions expose no private candidates. |
| 6. Public-on-save writing | Owner-only publish/unpublish; successful collaborator saves update the public page. | Slices 2 and 4 | Anonymous reads before/after saves, denied publishing by editors, history attribution, no private source disclosure. |

Slice 1 is a deliberately limited increment: one existing main writing surface
with reference panels. Multiple simultaneously editable panels and the whiteboard
panel join it after shared editing is designed. It is not the full product.

## Ownership design decisions required for slice 2

Resolve these together in that slice's spec before schema or authorization edits:

- Durable topic owner identity and treatment of existing shared Projects. Never
  infer production ownership from the first member or rewrite existing grants.
- Direct sharing versus contribution, with explicit consent and stable item IDs.
- Contributor rights after removal, withdrawal of a contribution, ownership
  transfer between topics, and prevention of an ownerless topic.
- Inherited plus direct grants, moves out of shared folders, and folder ancestry.
- Whether personal items may be referenced by a shared topic before contribution;
  a reference must never silently transfer ownership or grant rights.
- Deletion of a public note, restoration behavior, and access to historical logs.

Map all read/write surfaces, including search, graph, export, legacy API routes,
comments, notifications, publication, and file tokens. A new UI hiding an item is
not authorization. Make ownership, content mutation, and audit commit together.
Use additive migrations and preserve historical evidence and source versions.

## Live collaboration design decisions required for slice 4

Specify concurrent text merge behavior, durable save/checkpoint semantics,
contributor attribution, board conflict rules, authenticated subscriptions,
revocation on an open connection, reconnect reconciliation, and deployment support.
Select dependencies only after that design; do not label polling presence as live
co-editing or use last-writer-wins overwrites for simultaneous text changes.

## Scope and validation

Do not add AI, public collection sites, source annotations, chat, or portfolio
features. Do not remove existing features just because they are not in the brief.
Preserve existing source/version provenance while changing the editing workflow.

The user's instruction is to run existing checks and not write new tests unless
asked. Each slice therefore requires existing suites plus recorded disposable
manual/API/browser scenarios. Document gaps in durable regression coverage;
never weaken an old assertion merely to turn the gate green. Contract changes
that make existing assertions obsolete must be reported for an explicit decision.

Use the isolated database protocol in `tests/README.md`; never seed or migrate the
normal database during validation. Run relevant cheap gates per change, stateful
suites for domain changes, and production browser checks for user-facing delivery.
No migration, release, or runtime readiness claim follows from this roadmap.

## Next executable plan

[Slice 1: personal reference panels](./2026-10-03-personal-reference-panels.md).
Later slices require their own concrete design and file-level implementation plan.
The unresolved decisions above are not authorization to guess product behavior.
