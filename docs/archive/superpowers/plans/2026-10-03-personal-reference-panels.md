# Personal Reference Panels Implementation Plan

> **Status — 2026-10-03:** Paused prototype plan, retained as a phase-3 candidate. Reconcile it with phases 1–2 before reuse. Its unfinished implementation is unmerged and has no accepted final validation.
> Current requirements, order, and progress: [canonical roadmap](../../../roadmap.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline implementation, or superpowers:subagent-driven-development if the user selects delegated execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write in the existing note editor with independently opened reference notes and materials beside it.

**Architecture:** Keep the existing NoteWorkspace mounted as the main writing surface. Add a client-side reference panel host whose data comes from authenticated application facade reads. Reuse Markdown rendering and authorized material delivery; do not duplicate notes, embed entire app routes, or introduce a second editor engine.

**Tech Stack:** Existing Next.js App Router, React, TypeScript, CSS Modules, application facade, PostgreSQL, and browser-native document/media viewers. No new dependencies.

**Spec:** [topic workspace product brief](../specs/2026-10-03-topic-workspace-product-brief.md), content/navigation and personal panel layout requirements. [Roadmap](./2026-10-03-topic-workspace-roadmap.md) defines remaining scope.

## Global Constraints

- "Panel layouts are personal."
- "Opening, closing, or resizing a panel does not rearrange another person's screen."
- "Board access never overrides an item's privacy or ownership."
- Preserve current permissions and publication behavior in this slice.
- The main editor remains the only editing surface in this increment; reference panels are readers.
- Follow existing UI tokens, CSS Modules, and the VI/EN translation catalogs.
- No new tests per user instruction; run existing checks and disposable manual scenarios.
- No lockfile changes, production DB mutation, or deployment.

## Review Focus

1. An unsaved editor must remain mounted when opening, resizing, or closing a reference (Tasks 2 and 4).
2. A foreign project ID or revoked access must not reveal reference content or leave stale content displayed after an access failure (Tasks 1 and 4).
3. Slow responses must not populate the wrong panel after replacement or closing (Task 2).
4. Unsupported media and failed saves must leave existing content usable (Tasks 3 and 4).
5. Keyboard users and narrow screens must retain access to all panels without forced page overflow (Tasks 2 and 4).

These are manual acceptance checks, not newly authorized automated test files.

## Task 1: Authenticated reference projection

**Files:**
- Create: `src/modules/application/references.ts`.
- Modify: `src/modules/application/index.ts`.
- Create: `src/app/api/app/projects/[projectId]/references/route.ts`.
- Reuse: `src/modules/application/notes.ts`, `materials.ts`, `errors.ts`.

**Interfaces:**

```ts
export type ReferenceTarget =
  | { kind: "note"; projectId: string; id: string }
  | { kind: "material"; projectId: string; id: string };
export type ReferenceDto =
  | { kind: "note"; projectId: string; id: string; title: string;
      contentMd: string; version: number }
  | { kind: "material"; projectId: string; id: string; title: string;
      versions: Array<{ id: string; seq: number; mimeType: string;
        originalFilename: string; sizeBytes: number }> };
export async function getAppReference(
  actor: Principal, target: ReferenceTarget,
): Promise<ReferenceDto>;
```

- [ ] Use `getAppProjectNote(actor, projectId, id)` and `getAppProjectMaterial(actor, projectId, id)` for authorization and data. Explicitly project the fields above; do not expose draft, provenance, or capability data accidentally. Notes in reference panels are currently saved official notes; keep private draft editing in the existing main workspace.
- [ ] Expose `GET .../references?kind=note|material&id=<uuid>` with `requirePrincipal`, input validation, `toApplicationError`, and `Cache-Control: private, no-store`. Return `{ reference: ReferenceDto }`. Never accept a client-supplied actor or owner.
- [ ] With the isolated seeded DB, manually request an accessible note/material, missing item, other-project item, unauthenticated request, and unauthorized item. Confirm allowed responses contain only projected fields and denied requests disclose no title/content.
- [ ] Run `npm run typecheck`, `npm run lint`, and `npm run test:boundaries`. Commit only these files after checks pass.

## Task 2: Personal reference panel host

**Files:**
- Create under `src/app/app/projects/[projectId]/notes/_components/`:
  `reference-panels.tsx`, `reference-panel-state.ts`, `reference-panels.module.css`.
- Modify there: `note-workspace.tsx`.
- Modify: `src/app/components/ui-next/localization/locales/vi.ts`, `en.ts`.
- Reuse: `src/app/components/ui-next/typography/markdown-view.tsx`.

**Interfaces:**

```ts
export type ReferencePanel = { key: string; target: ReferenceTarget; width: number };
export function referenceKey(target: ReferenceTarget): string;
// React component props:
// { locale: UiLocale; panels: ReferencePanel[];
//   onClose: (key: string) => void;
//   onResize: (key: string, width: number) => void }
```

- [ ] Keep layout state local to `NoteWorkspace`; store IDs and widths only, never content in browser storage. In this increment the layout lasts for the mounted workspace; cross-device persistence is not promised.
- [ ] Derive `referenceKey` from kind, projectId, and id. Opening an already-open target focuses its panel. Open and close panels without changing the main editor's React key or reinitializing its draft state.
- [ ] Fetch Task 1's endpoint per panel. Abort on close/replacement and verify the panel key before applying responses. Show loading, retry, and inaccessible states locally; clear previously loaded content on an authorization failure. Revalidate references on window focus and main-route refresh; continuous revocation delivery is a later live-collaboration requirement.
- [ ] Render note references using existing MarkdownView. Provide labeled close controls and keyboard-operable resize separators. Use widths with a 280px minimum; scroll within the panel region when necessary. At viewport widths of 900px or below, expose a tab switcher with one visible surface while keeping the editor mounted.
- [ ] Integrate existing focus mode deliberately: entering editor focus hides references, exiting restores them. Do not leave references focusable behind an inert overlay.
- [ ] Manually type unsaved content, open two references, resize, close one, switch narrow-screen tabs, and toggle focus mode. Confirm text/selection and save state survive. Delay a response and close its panel; confirm it never reappears elsewhere.
- [ ] Run `npm run typecheck`, `npm run lint`, `npm run test:style-contract`, and `npm run test:ui-next-contrast`. Commit the checked slice.

## Task 3: Open references and view materials

**Files:**
- Modify: `notes/_components/note-workspace.tsx` and `reference-panels.tsx` under the project route.
- Create there: `reference-picker.tsx`, `material-reference.tsx`.
- Modify the same VI/EN catalogs from Task 2.
- Reuse existing project note/material list API routes and the exact-version material download route.

**Interfaces:**
- `ReferencePicker` props: `{ projectId: string; locale: UiLocale; onSelect: (target: ReferenceTarget) => void; onClose: () => void }`.
- `MaterialReference` props: `{ reference: Extract<ReferenceDto, { kind: "material" }>; locale: UiLocale }`.
- Existing byte delivery: `GET /api/app/projects/{projectId}/materials/{id}/versions/{versionId}/download`.

- [ ] Add an "Open beside" action to the main workspace with a note/material picker sourced from authorized project list APIs. Filter the returned list locally; reuse existing dialog primitives. Do not include private drafts belonging to other authors.
- [ ] Add the same action to accessible note navigation/evidence entries that already carry an actual project identity. Do not guess the current project for cross-project references. Direct targets from accessible cross-project evidence are allowed; global cross-project browsing waits for the access slice.
- [ ] Material panels select an actual version from ReferenceDto and construct its authorized relative download URL. Never reuse a signed URL across users or persist it as layout state.
- [ ] Initially preview PDF, plain UTF-8 text, PNG/JPEG/WebP images, and browser-supported audio. Use native PDF embedding, escaped text, image elements, and audio controls. Unknown types or unsupported codecs display a download fallback. Do not execute HTML/SVG uploads. This is the proposed initial format set for plan review.
- [ ] Reuse current file delivery first. Validate actual PDF rendering and audio playback/seek against it; if response headers or byte-range support block playback, stop this task and specify the narrow storage-delivery change with its privacy checks before expanding scope. Do not silently claim playback works from an element rendering.
- [ ] Manually open two references beside a draft, play a recording, render a PDF and an image, read text containing markup, select an older file version, and exercise unsupported-format and download-failure states.
- [ ] Run `npm test`. Commit this slice after recording browser outcomes and limitations.

## Task 4: Integrated browser validation and handover

**Files:**
- Create: `docs/superpowers/results/2026-10-03-personal-reference-panels-result.md`.
- Modify product files from Tasks 1–3 only if validation finds a defect within this slice.

- [ ] Follow `tests/README.md` to create, migrate, and seed an isolated test database; use that same isolated database for the browser server. Never run `npm run demo` on normal application data.
- [ ] Run existing `npm test`, `npm run test:integration`, `npm run test:privacy`, production build, `npm run test:standalone`, and the existing research-intent E2E suite. Reseed the isolated DB between suites when their fixtures mutate shared state.
- [ ] In two independent authenticated browser sessions, open different panel layouts and verify neither affects the other. Check actual data and UI at 390px and 1440px, keyboard opening/closing/resizing, main-editor autosave, failed-save retention, access denial, and permitted file viewing/playback.
- [ ] Record exact commands, exit statuses, screenshots, and manual results in the result document. Explicitly state that this slice does not deliver live co-editing, the whiteboard, new ownership rules, or public-on-save behavior.
- [ ] Run `git diff --check`, inspect the staged diff, and commit only this slice's final fixes and result document. Dispose only the test database and artifacts created for this run.

## Self-review and execution handoff

This plan covers the first useful panel increment, not all ten product acceptance
scenarios. Full product coverage is mapped across the roadmap's six slices.
No new automated tests are scheduled, in accordance with the user instruction;
manual coverage does not replace durable regression tests.

Review the proposed slice order, read-only reference-panel boundary, initial
format set, and session-only layout persistence before execution. Recommended
execution: inline, because these tasks share one existing workspace and can be
implemented without competing edits. Independent review is useful after the slice;
delegated execution remains an explicit user choice.
