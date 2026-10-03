# WisdomTree documentation

Updated: 2026-10-03. This directory separates agreed product intent, existing
implementation references, and historical evidence.

## Start here

Read [roadmap.md](./roadmap.md) first. It owns current product contracts, open
decisions, implementation order, acceptance criteria, and progress. It is the
agent entry point, not a replacement for applicable working instructions or
inspection of the code being changed.

Implementation resumed on 2026-10-03 at the user’s request. The roadmap records
the current phase-1 work and the separately paused panel prototype. Old plans
do not override the current implementation sequence.

| Document | Purpose and authority |
| --- | --- |
| [Roadmap](./roadmap.md) | Canonical requirements, decisions D1–D8, six phases, and completion evidence. |
| [Product](./product.md) | Short audience and workflow summary; details defer to the roadmap. |
| [Architecture](./architecture.md) | Existing implementation and legacy mechanisms; verify relevant source before changing them. Not a competing target specification. |
| [Operations](./operations.md) | Development, deployment, recovery, and isolated validation procedures; read when needed. |
| [Vietnamese vocabulary](./vocabulary-vi.md) | Current translation sources and wording review rules. |
| [Archive](./archive/README.md) | Complete index of previous designs, audits, implementation results, and artifacts. |

## Keeping information consistent

- Simplicity leads: preserve working foundations; add only what the agreed need requires.
- Record a product decision in the roadmap first, then align the short summary or
  affected reference. Do not create a second authoritative requirements list.
- Keep unresolved decisions explicit. Proposed behavior is not implemented behavior.
- For implementation, read the relevant source, existing checks, and the accepted
  phase plan, if one exists. Old plans do not authorize work or override the roadmap.
- Preserve historical results, commit references, and failures. Their pass/fail
  claims apply to the recorded revision and environment, not today's application.
- Code and migrations establish current schema/API behavior; the roadmap states
  what must change. A mismatch is a gap to investigate, not permission to silently
  change either the requirement or the data.
- Keep internals and technical documentation in English. Use existing localization
  catalogs for UI copy; see the vocabulary reference for both active catalog locations.

The dated Vault plans and initial panel-first roadmap under `archive/superpowers/` are
superseded. The personal reference-panel plan is a paused phase-3 candidate;
its unfinished prototype is not a completed roadmap phase. Result documents
remain historical evidence. Future phase results must link back to this roadmap.

Only the six top-level documents are maintained as active references. The old
`target-architecture.md` and `superpowers/` structure now live entirely in
`archive/`. Add a focused phase plan under `docs/plans/` and a result under
`docs/results/` only when that work is needed; neither directory is an additional
requirements authority. Do not add new work to the archived plan structure.
