# Architecture

Updated: 2026-10-03. This is the current implementation reference for planning.
[roadmap.md](./roadmap.md) owns product requirements and the six-phase change
sequence. Source inspection establishes existing mechanisms; it does not prove
the planned behavior or runtime readiness.

## Foundation to retain

WisdomTree is one Next.js App Router application with React, TypeScript, Drizzle,
PostgreSQL, and file storage. Keep this structure unless an agreed requirement
exposes a concrete limitation. No framework replacement is planned.

| Area | Existing location | Responsibility |
| --- | --- | --- |
| Delivery | `src/app/` | Pages and HTTP routes; call services rather than query the database directly. |
| Application facade | `src/modules/application/` | Project-oriented operations and DTOs for the UI. |
| Domain services | `src/modules/` | Authorization, reads, mutations, transactions, and audit. |
| Persistence | `src/db/`, `src/modules/*/schema.ts`, `drizzle/` | Database connection, schema declarations, and tracked migrations. |
| UI and localization | `src/app/components/ui-next/`, `src/lib/vi/` | Existing components, styles, VI/EN catalogs, and legacy translations. |

`scripts/boundaries.test.ts` checks delivery-layer database imports as part of
`npm test`. Inspect service dependencies directly; this check does not establish
that every domain boundary or permission is correct.

## Product mapping

The agreed topic workspace reuses the existing Project identity and stable URLs.
Quick atomic notes and longer writing use one note identity. References across
topics must not copy content or grant access. These are target contracts; current
storage associations still need the phase-1 migration inventory.

| Existing modules | Reuse or reconciliation needed |
| --- | --- |
| `project`, `application` | Workspace identity, current membership/capabilities, and delivery operations. |
| `knowledge` | Notes, drafts, content versions, links, graph, and existing editing paths. |
| `storage` | Materials, file versions, folders, storage access, and source extraction. |
| `auth`, `vault` | Authentication and overlapping access rules to trace before implementing the new ownership model. |
| `pm`, `activity` | Existing tasks and work context; reconcile with topic-owner and assignee controls. |
| `person` | Research people independent from authenticated accounts. |
| `notify`, `audit` | Comments, notifications, and attributed changes. |
| `publication`, `export` | Existing public revisions and export mechanisms; reconcile public-on-save without discarding history. |
| `circulation` | Existing physical-library behavior outside this release's new workflow; no automatic removal. |

## Authorization gap

Authorization currently spans the legacy role/scope catalog in
`src/modules/auth/authorize.ts`, Project permissions in `project/service.ts`,
Core research access in `auth/core.ts`, Vault checks in `vault/access.ts`, and
knowledge/storage visibility conditions. Core access to shared Projects is not
blanket access to personal Projects.

This is not yet one implementation of the agreed personal-owner/topic-owner
contract. Phase 1 inventories readers and mutations, then establishes the
permission matrix and service-level enforcement. UI capabilities must describe
those same decisions. Topic membership or a cross-topic reference must not be
assumed to grant access to a linked item.

## Editing, history, and publication gaps

Existing private drafts, version checks, comments, presence, and graph views are
reusable foundations. Presence and immediate saves do not establish synchronized
concurrent editing; the graph does not establish a shared whiteboard arrangement.

The roadmap requires private capture, explicit contribution, recoverable changes,
live text and board updates, and owner-enabled publication that updates after a
successful save. Existing wiki review and public-revision paths must be traced
before replacement. Decisions D1–D8 remain in the roadmap; no implementation
choice here settles them.

Services use `ApiError`; application consumers also use the mapped DTO contract
in `src/modules/application/errors.ts`. Preserve intentional denied/missing
responses and version conflicts. Unexpected failures must remain errors rather
than masquerading as missing notes.

## Validation and older mechanisms

Follow the roadmap's phase gates and [operations.md](./operations.md) for isolated
validation. A documentation update is not a completed implementation phase.

Earlier wiki lifecycle, release, library, and graph descriptions are retained in
[the archived architecture reference](./archive/previous-reference/architecture.md).
Use them only to investigate a specific existing caller, then verify current code.
They do not prescribe the new workflow.
