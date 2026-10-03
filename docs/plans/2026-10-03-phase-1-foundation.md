# Phase 1 foundation implementation plan

> Use `superpowers:executing-plans` inline. The user's no-new-tests instruction
> overrides test-generation defaults. Use existing suites and disposable manual
> checks; do not add dependencies or migrate application data.

**Goal:** Begin roadmap phase 1 with a concrete access/lifecycle inventory and
repair the confirmed publication, permission-type, page-error, and stale-selector defects.
**Architecture:** Preserve current services and contracts while closing existing
prerequisite gaps. Owner-based sharing and public-on-save remain subsequent work.
**Stack:** Existing TypeScript, Next.js, Drizzle, PostgreSQL, and Playwright.
**Spec:** [Roadmap](../roadmap.md), phase 1 and D1–D8.

## Constraints and review focus

- Keep the curated docs and paused panel work intact; isolated branch starts at `addc66c`.
- No new test files, dependencies, schema migrations, or live data mutations.
- Core publishing must not bypass personal Project read access via direct calls.
- Unexpected note-load failures must reach the error boundary; genuinely missing
  notes/drafts remain 404. Missing optional collaboration may remain absent.
- Permission keys must reject typos at compile time without widening at callers.
- Existing viewport checks must still measure current page frames and task actions.
- D1 removal revokes contribution access; preserve authorship/history. Other
  unresolved ownership edges are not implementation defaults.

## Task 1: Inventory and contracts

- [ ] Trace application and legacy service paths for notes, materials, versions,
  collaboration, discovery, download, publication, and membership.
- [ ] Record target actor permissions and lifecycle effects, marking decisions
  and data mappings that cannot yet be implemented.
- [ ] Save the inventory and evidence in `docs/results/2026-10-03-phase-1-foundation.md`.

## Task 2: Existing authorization and error defects

Files: `src/modules/auth/authorize.ts`, `src/modules/publication/service.ts`,
`src/app/app/projects/[projectId]/notes/[noteId]/page.tsx`.

- [x] Run existing baseline `npm test` before editing.
- [x] Preserve literal catalog keys with `satisfies`; keep role/scope entry typing.
- [x] Make publication source loading require Project research access inside its
  transaction before reading a source snapshot, for publish and unpublish.
- [x] Narrow the missing-note fallback to the initial note read. Propagate
  unexpected failures and required-context failures; handle draft mismatch as 404.
- [x] Run existing fast checks and isolated integration/privacy suites. Manually
  exercise direct publication of another user's personal note on disposable data.

## Task 3: Repair existing browser checks and validate

File: `tests/e2e/research-intent.spec.ts`.

- [x] Replace removed layout selectors with current research-home/actions frames;
  preserve the existing geometry, overflow, and task save assertions.
- [x] Build the final source and run existing research-intent E2E at 390/1440px
  against a separately seeded test DB/object directory and standalone server.
- [x] Review the final diff independently; record exact checks and remaining gaps.
- [x] Update only roadmap items backed by evidence. Do not call phase 1 complete
  while the full service-authority/migration contracts remain unresolved.

This plan starts the authorized roadmap; it does not claim all six phases fit
this repair batch. Phase-2 ownership migration requires verified data mapping and
resolved decisions. No assumption about a Project creator or manager establishes
its new owner.
