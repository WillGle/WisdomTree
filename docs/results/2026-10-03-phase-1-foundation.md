# Phase 1 foundation: inventory and implementation record

Status: first repair batch verified; phase 1 remains in progress, 2026-10-03. Baseline `addc66c`; branch
`feat/topic-foundation-20261003`, worktree `/tmp/wisdomtree-phase1-20261003`.
[Roadmap](../roadmap.md) remains the requirements authority. This inventory is
source-derived, not proof that the new ownership model is implemented.

## Access paths and gaps

Paths below are relative to `src/modules/`; HTTP consumers are under `src/app/api/`.

| Surface | Existing enforcement | Required reconciliation |
| --- | --- | --- |
| Project entry/capabilities | `project/service.ts`: `getProject`, `getProjectApplicationAccess`; `auth/core.ts`: durable membership/Core research read | Explicit single topic owner; Core research privileges cannot become an implicit private-content grant. |
| Notes and private drafts | `application/notes.ts` → `knowledge/drafts.ts`: confirmed Project, Vault, draft author, role/scope checks | Personal content owner and deliberate contribution; draft author is not a topic owner. |
| Legacy node reads/writes | `knowledge/service-queries.ts`: `branchVisibilityCondition`, `getNode`; `service-mutations.ts`: catalog/branch/Vault checks | Reconcile admin break-glass, personal branches, protected review and Project access. Keep caller inventory before retiring paths. |
| History and restore | `application/notes.ts`: Project note read before version access/restore; `knowledge/service-queries.ts` and `drafts.ts` | Apply current content access to every historical version; restore must not revive revoked grants. |
| Evidence and provenance | `knowledge/support.ts`, `provenance.ts`: target and linked Project/Vault reads; immutable source version IDs | Keep exact-version provenance while references gain no access; use redacted private links. |
| Materials and versions | `application/materials.ts` → `storage/service.ts`: Project material checks, owner/submission and Vault gates | Private creator-owned intake, explicit contribution, and editor recovery must replace inconsistent submitter/manager rules. |
| File download | `storage/service.ts`: version token and download access context; app material-version and legacy source routes | Blob delivery rechecks Vault membership only. Non-Vault objects remain bearer-token accessible for up to five minutes (`src/lib/sign.ts`). Reconcile this with immediate revocation before new sharing ships. |
| Comments/mentions/presence | `application/collaboration.ts`: entity resolution and operational membership; `notify/service.ts`: anchor authorization | Separate reader/commenter/editor rights; revalidate removed contributors. Presence is not live concurrent editing. |
| Search | `search/service.ts`: readable Project IDs and Vault filters; legacy `knowledge/service-queries.ts` | One effective item visibility rule for results, snippets, suggestions, counts and references. |
| Graph | `knowledge/graph-provider.ts`: branch visibility; Project and personal graph callers | Existing graph visibility is not a shared whiteboard permission contract. |
| Tasks/calendar | `application/tasks.ts`, `pm/service.ts`: Project membership, creator/assignee and legacy global board rules | Owners manage tasks; assignees progress only; task visibility never exposes inaccessible linked content. |
| Public publishing | `application/publication.ts` → `publication/service.ts`; app publication route also reads the note | Repair missing Project prerequisite inside service now. Owner-only publication and public-on-save are later phases, not implemented by this fix. |
| Export/release | `export/service.ts`: global operator export and per-space release/Vault checks | Enumerate exported content under effective access; immutable release history is not the new public-save policy. |
| Membership | `storage/service.ts`: manager/Vault gates, personal-Project guard, last-manager transaction lock; app Project and legacy Space routes | Exactly one transferable owner; removal revokes contribution access (D1); audit owner transfer and member removal. |
| Folders | `storage/service.ts`: same-space moves and folder creator/Vault checks | No current folder-sharing inheritance contract matching D4; do not reuse folder membership as an implicit grant. |

This covers service families and entry points, not yet an exhaustive per-operation
proof. In particular signed download/revocation, legacy exports, every mutation,
and concurrent removal need further investigation before 1.1/1.5 are complete.

## Target permission matrix

Every cell is a target rule from the roadmap, not existing-role equivalence.

| Actor relative to an item | Read | Comment | Edit/delete/restore | Share/publication | Ownership transfer |
| --- | --- | --- | --- | --- | --- |
| Personal content owner | Yes | Yes | Yes | Owner controls | Explicit contribution only |
| Topic owner, contributed item | Yes | Yes | Yes | Owner controls | Controls withdrawal/transfer (D3) |
| Original contributor, still a member | Yes | Yes | Retained edit | No | No unilateral take-back |
| Removed contributor | No retained access (D1) | No retained access | No retained edit | No | No |
| Granted editor | Yes | Yes | Yes, within item/board grants | No | No |
| Granted commenter | Yes | Yes | No | No | No |
| Granted reader | Yes | No | No | No | No |
| Topic member with no item grant | No implicit private-item access | No | No | No | No |
| Outsider/anonymous | Published individual note only | No | No | No | No |

Topic ownership never grants access to unshared personal content. Separate direct
sharing and folder inheritance combine using the highest applicable grant
(edit > comment > read-only), confirmed in D4. Folder-move and exception behavior
remain unconfirmed. Original authorship survives withdrawal, transfer and removal.
D5 confirms deletion immediately hides the public page; restoration publication
behavior remains unconfirmed.

## Content lifecycle

| Operation | Ownership/visibility | Durable effect |
| --- | --- | --- |
| Personal capture/save | Creator-owned and private by default | Versioned content, attributed author/editor |
| Direct share | Owner unchanged; explicit recipient role | Grant/revoke plus attributed log |
| Contribute/shared-folder add | Transfer to exactly one topic; explain consequences | Preserve identity, creator, versions; record contribution and effective access |
| Cross-topic reference | Ownership and access unchanged | Reference to same item; inaccessible link becomes “Private note” |
| Edit | Existing effective grants still apply | Version/checkpoint and actor attribution; public update only after owner opted in |
| Delete/restore | Recoverable, never silent permission restoration | Deletion immediately hides the public page; preserve history. Restoration publication behavior remains unconfirmed (D5). |
| Remove contributor | Revoke retained contribution access | Preserve authorship/history; invalidate live/read access |
| Transfer topic ownership | Exactly one owner, recipient is a member (D2) | Atomic owner change and attributed audit |
| Withdraw/transfer contribution | Topic owner controls (D3) | Preserve identity/history; grant and reference transitions depend on D4 |
| Publish/unpublish | Individual note, owner-controlled | Public state change with audit; later successful saves update public page |

## Migration/retirement inventory

- `projects.personalOwnerId` identifies a personal workspace. Shared Projects have
  no equivalent single topic-owner field; `createdBy` and manager memberships are
  evidence candidates, not approved owner mappings. Do not choose silently.
- `treeNodes.projectId`, branch ownership, `node_drafts` author/Project/Vault fields,
  source space/submitter/folder fields, and Vault owner rows represent different
  existing boundaries. Inventory actual records before schema changes.
- Preserve stable note/material IDs, exact version references, publication slugs,
  audit history, and file object keys. Do not copy notes merely to contribute them.
- Current personal-note promotion copies content to a shared draft. Replace that
  workflow only after contribution transfer exists and old caller/data obligations
  are accounted for. Preserve historical promotion provenance.
- Keep legacy APIs until callers and permission behavior are covered; no deletion
  or runtime data migration is authorized merely by archiving the old docs.
- Database inventory so far is disposable fixtures only. Real-data owner mapping,
  ambiguous records, rollback/retry rehearsal and retirement decisions remain open.

## Repairs and evidence

The current repair batch changes four existing files: permission catalog typing,
publication source authorization, note-page error handling, and browser selectors.
No dependencies, migrations, or new test files are introduced.

Validation logs: `/tmp/wisdomtree-phase1-evidence-20261003/`.

- Baseline and final `npm test`: passed (20 unit files; 287 delivery files in
  the boundary check). Initial sandbox run blocked tsx IPC; rerun passed.
- Existing integration: 29 files passed on isolated fixtures.
- Existing privacy: 2 files passed after resetting only the disposable database.
- Production build: passed; existing Next/ESLint configuration warning remains.
- Direct-service manual check: unrelated Core user publishing/unpublishing another
  user's personal note receives `not_found 404`; authorized owner succeeds.
  Probe used only disposable fixtures and no repository test additions.
- Independent static review: no actionable defects in the four-file repair.
- First E2E run: 6 passed, 2 failed because the scroll selector matched both the
  task body and nested help body. Narrowed it to the direct child without removing
  the scroll, geometry, overflow, or save assertions. The next run passed both
  viewport scenarios (7/8 overall), but private-draft creation stayed on the list
  after HTTP 201. This separate intermittent navigation failure is being checked
  without weakening the existing assertion. A clean-fixture confirmation run
  passed private-draft creation but failed the 390px task geometry measurement
  because the metadata bounding box was null (7/8 overall). There is no all-green
  final browser run at that point. Logs: `e2e-final.log` and `e2e-confirm.log`.
- The failed mobile snapshot showed the loading fallback. Changed the existing
  numeric geometry assertion to poll until both real boxes exist and satisfy the
  same inequality; no timeout increase or geometry condition removal.
- Final research-intent E2E: **8/8 passed**, including 390px and 1440px
  (`e2e-ready.log`, 15.8s). Earlier navigation failure did not recur; its cause
  is not established and a single final pass does not establish flake-free behavior.
- Scoped Prettier check and `git diff --check`: passed.

Remaining phase-1 work: exhaustive mutation/caller inventory, signed-file
revocation reconciliation, approved migration owner mapping, and final lifecycle
rules as D4/D5 settle. No phase-completion claim. No product-data migrations ran.

## Next work

Keep the observed intermittent note-create navigation failure on the next
browser investigation list. Complete the access-path inventory, then
resolve D4/D5 and verify actual owner mappings before phase-2 schema work.
D1–D3 and the confirmed D4 grant-precedence/D5 deletion rules are recorded in the
roadmap. Folder moves/exceptions and restoration publication remain open. These
new ownership, grant-precedence and deletion rules are not yet implemented.

Source remains uncommitted in the isolated worktree. The main checkout retains
the documentation curation and receives this plan/result record only.
