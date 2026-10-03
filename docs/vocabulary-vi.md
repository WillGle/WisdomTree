# UI Vocabulary (Vietnamese)

[roadmap.md](./roadmap.md) defines the current product concepts. This document
records current translation sources and ownership; it does not require the new UI
to expose Space, Branch, Vault, or other storage concepts.

Existing copy lives in two places: the workspace VI/EN catalogs under
`src/app/components/ui-next/localization/locales/`, and legacy copy/state/error
translations under `src/lib/vi/`. Inspect the surface's existing catalog before
editing it. Neither catalog alone is a complete vocabulary for the application.

Final Vietnamese wording for Topic, atomic note, contribution, and the new sharing
controls still needs review. Topic reuses the Project identity internally; a copy
change does not imply a schema rename. Legacy labels are preserved in the
[archived vocabulary](./archive/previous-reference/vocabulary-vi.md); they are not
an approved naming scheme for planned screens.

## Governance

- Engineering owns the internal (English) terms; the humanities team
  owns and approves the Vietnamese the reader sees.
- A new user-facing concept needs a Vietnamese term before it ships;
  record proposed wording as pending review in the relevant existing catalog.
- Internals (code, APIs, errors, docs) stay English; the FE translator
  layer is the only place Vietnamese lives.
