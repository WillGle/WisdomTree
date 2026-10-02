# WisdomTree Target Architecture

This document defines the **target product architecture** for WisdomTree.

It is intentionally stricter than a code inventory. The repository may still contain compatibility routes, legacy storage concepts, or transitional implementation details. Those do not redefine the target product.

The target is:

> **A collaborative research knowledge platform that turns discussion, source material, fieldwork, and research work into traceable, versioned, retrievable, and publishable knowledge.**

---

## 1. Architectural goals

WisdomTree must optimize for:

1. research provenance;
2. Project ownership;
3. controlled collaboration;
4. durable internal knowledge;
5. simple retrieval;
6. controlled public publication;
7. privacy and authorization correctness;
8. maintainability for a small team.

The system should stay a modular monolith unless a concrete operational need proves otherwise.

The default rule is:

> **Prefer explicit domain code over generic infrastructure.**

Do not add queues, workers, event buses, plugin systems, universal entity models, generic relation frameworks, or global client stores unless an actual requirement justifies them.

---

## 2. Product architecture

WisdomTree has four principal product layers and two supporting layers.

```text
┌──────────────────────────────────────────────┐
│ COMMUNITY / DISCUSSION                       │
│ Posts · Comments · Replies · Mentions · Tags │
└──────────────────────┬───────────────────────┘
                       │ curate
                       ▼
┌──────────────────────────────────────────────┐
│ RESEARCH KNOWLEDGE                           │
│ Projects · Notes · Materials · Evidence      │
│ Versions · People · Activities · Provenance  │
└──────────────┬───────────────────┬───────────┘
               │                   │
          coordinate           retrieve
               │                   │
               ▼                   ▼
┌──────────────────────┐   ┌───────────────────┐
│ WORK                 │   │ SEARCH / RAG      │
│ Tasks · My Work      │   │ Search now        │
│ Calendar views       │   │ RAG later         │
└──────────────────────┘   └──────────┬────────┘
                                      │
                                      ▼
                           knowledge discovery

Research Knowledge
        │
        │ explicit publish
        ▼
┌──────────────────────────────────────────────┐
│ PUBLICATION                                  │
│ Immutable public revisions · stable URLs     │
└──────────────────────────────────────────────┘

Optional Project capability:
Library circulation
```

The intended research lifecycle is:

```text
Discuss
→ Collect
→ Research
→ Attach evidence
→ Synthesize
→ Curate
→ Retrieve
→ Publish
```

---

## 3. Core architectural principle: Project first

Every durable operational or research object must have an authoritative Project context.

A Project is the main scoping unit for:

- Notes;
- Materials;
- Activities;
- Tasks;
- People relationships;
- community discussions when Project-scoped;
- optional Library circulation.

Target Project workspace:

```text
Project
├── Overview
├── Notes
├── Materials
├── Activities
├── Tasks
├── People
└── Library      # optional capability
```

The existence of legacy Space or Branch identifiers in storage must not leak into the target product model.

Project ownership must not be inferred from:

- title;
- tags;
- creator;
- filenames;
- branch name;
- UI location.

Unknown ownership must remain unknown or explicitly legacy/unassigned until migrated safely.

---

## 4. Community / discussion layer

### 4.1 Purpose

Community is where ideas are explored.

It is not the durable knowledge source of truth.

Target community concepts:

- Post;
- Comment;
- Reply;
- Mention;
- Tag;
- Discussion;
- Activity / feed projection.

Current comment, reply, mention, presence, and notification infrastructure should be reused where it fits.

### 4.2 Post is not Note

A Post is conversational.

A Note is curated knowledge.

```text
Post
- exploratory
- social
- fluid
- discussion-oriented

Note
- deliberate
- versioned
- durable
- provenance-aware
```

Do not collapse them into a universal content object.

### 4.3 Project scope

The preferred target is:

```text
Post → exactly one Project
```

A global Community feed may aggregate Posts from Projects visible to the current user.

This preserves Project ownership while still allowing cross-Project discovery.

If a future requirement needs a truly organization-global Post, it should be designed explicitly rather than silently creating a second ownership model.

### 4.4 Curation path

Community content may become research knowledge through an explicit curation action.

```text
Post / Discussion
        ↓
researcher reviews
        ↓
create or enrich Note draft
        ↓
attach exact evidence
        ↓
publish official NoteVersion
```

A Post does not become authoritative merely because it is popular or highly discussed.

### 4.5 RAG treatment

Community discussion may be searchable.

It should not automatically be treated as authoritative research context for RAG.

Curated Notes and Materials remain the default knowledge sources.

---

## 5. Research knowledge layer

This is the durable internal source of truth.

Primary entities:

```text
Project
Note
NoteDraft
NoteVersion
Material
SourceVersion
Person
Activity
Evidence relationships
```

The design should remain explicit rather than merging these into a universal `Entity`.

---

## 6. Note architecture

### 6.1 Working state

Target flow:

```text
create Project Note
        ↓
author-private draft
        ↓
edit / autosave
        ↓
attach evidence
        ↓
internal publish
        ↓
immutable NoteVersion
```

A private draft:

- belongs to an author;
- belongs to a Project;
- supports optimistic concurrency;
- is not readable by another user merely because that user belongs to the Project.

### 6.2 Official Note

The official Note represents current curated internal knowledge.

Readers, search, provenance, Graph, and publication should use official research state unless a feature is explicitly about the current user's draft.

### 6.3 Immutable versions

Every official publication appends an immutable NoteVersion.

Historical versions are never rewritten.

Restore must append a new version or create a new working draft based on a historical version. Restore must never mutate history in place.

---

## 7. Research provenance

### 7.1 Exact-version support

Evidence must reference immutable versions.

```text
NoteVersion
├── SourceVersion
└── NoteVersion
```

Do not model authoritative research support as:

```text
Note → current Source
Note → current Note
```

because those targets can change.

### 7.2 Historical evidence snapshot

When a working draft becomes an official NoteVersion, its evidence set must be snapshotted to that exact version.

```text
Draft support
    ↓ publish
Version-scoped support snapshot
```

Later edits must not change prior support history.

### 7.3 Unknown versus empty

Historical provenance must distinguish:

```text
unknown
```

from:

```text
known empty
```

A historical version with no trustworthy provenance backfill must not be presented as having no evidence.

### 7.4 Cross-Project evidence

Cross-Project evidence is permitted only when:

1. the actor may mutate the target working draft; and
2. the actor may research-read the supporting Project.

This does not grant operational membership in the supporting Project.

---

## 8. Materials and extraction

### 8.1 Material model

Material is a Project-owned research source.

Possible content includes:

- documents;
- scans;
- books;
- images;
- audio;
- video;
- archival records;
- reference data;
- text files.

### 8.2 Source versions

Material content is versioned with immutable SourceVersions.

Research evidence points to the exact SourceVersion used.

### 8.3 Extraction

The target path is:

```text
Material
   ↓
SourceVersion
   ↓
text extraction / OCR
   ↓
ExtractionCandidate
   ↓
researcher review
   ↓
Project Note draft
```

Storage failure and extraction failure must remain separate concerns. Original source content should remain available even when extraction fails.

---

## 9. People

Person is a research-domain identity.

```text
Person != authenticated User
```

A Person may be:

- a research subject;
- collaborator;
- author;
- historical figure;
- interview participant;
- community member.

A Person may belong to many Projects.

A User account may optionally correspond to a Person, but this must not be assumed.

Person relationships must not implicitly grant authorization.

---

## 10. Activities

Activity is a Project-owned research context.

Examples:

- interview;
- field visit;
- archive visit;
- workshop;
- meeting;
- review session.

Activity may relate to:

```text
Activity
├── People
├── Materials
├── Notes
└── Tasks
```

Activity is not merely a calendar event.

Calendar may project Activity-related or Task-related time information, but must not become the canonical Activity model.

---

## 11. Tasks and work coordination

Tasks support research work.

Target Task semantics should remain narrow.

Recommended durable fields:

- Project;
- title;
- state;
- assignee;
- due date;
- optional priority;
- optional Activity;
- optional research-object target;
- notes;
- completion metadata.

Avoid making software-delivery concepts part of the core domain unless TMKT has a real workflow requiring them.

Examples of concepts that should not be considered core by default:

- feature / bug / improvement taxonomies;
- sprint;
- story points;
- velocity;
- engineering ticket KPIs.

`My Work` is a projection across Project-owned work.

Calendar is a work projection, not a top-level domain.

---

## 12. Library circulation capability

Library is an optional Project capability.

```text
Project
+
library_circulation
```

When disabled:

```text
Project
├── Notes
├── Materials
├── Activities
├── Tasks
└── People
```

When enabled:

```text
Project
├── Notes
├── Materials
├── Activities
├── Tasks
├── People
└── Library
```

Library may manage:

- physical holdings;
- copy or shelf metadata;
- loan request;
- approval / decline;
- handover;
- return;
- circulation history;
- Project-scoped library operators.

Tempo is the first known Project using this capability.

No business rule may depend on:

- Project name = Tempo;
- a special Tempo Project type;
- a hard-coded Tempo UUID.

Materials remain the research-source repository. Library circulation adds physical-loan behavior.

---

## 13. Search architecture

### 13.1 Current search

Current search should remain:

```text
request
→ resolve actor
→ calculate readable Project scope
→ search only within that scope
→ return product-facing DTOs
```

Authorization must happen before or as part of retrieval.

UI must not receive hidden data and then filter it client-side.

### 13.2 Searchable research

Core research search may include:

- Projects;
- official Notes;
- Materials;
- People;
- selected operational context where authorization allows it.

Private drafts are not general search results.

### 13.3 Search implementation

PostgreSQL full-text search is an appropriate baseline.

Do not add vector infrastructure merely because RAG is planned.

---

## 14. Future provenance-aware RAG

RAG is a future layer, not a current product dependency.

The target pipeline is:

```text
Question
   ↓
actor authorization
   ↓
candidate retrieval
   ↓
official NoteVersion / SourceVersion resolution
   ↓
provenance expansion
   ↓
context assembly
   ↓
LLM
   ↓
answer + traceable citations
```

The preferred behavior is not:

```text
question
→ arbitrary chunk
→ answer
```

RAG should prefer curated knowledge and exact provenance.

### 14.1 Private data

Private drafts must not become RAG context unless the feature explicitly targets the draft owner and the authorization contract allows it.

### 14.2 Community data

Posts and comments may be searchable or optionally retrievable as discussion context.

They should be clearly separated from curated research evidence.

---

## 15. Publication architecture

Public publication is separate from internal Note publication.

### 15.1 Public revision

Publishing selects an exact NoteVersion and creates or activates an immutable public revision.

```text
NoteVersion
    ↓
PublicRevision
```

The public revision stores a stable snapshot suitable for anonymous reading.

### 15.2 Publication pointer

A publication record holds:

- stable public slug;
- current public revision;
- publication state;
- timestamps.

### 15.3 Invariant

Internal edits do not automatically modify public content.

```text
Internal v5 → Public revision 2

Internal moves to v6
Public remains revision 2
```

until explicit publish.

### 15.4 Unpublish

Unpublish makes public content unavailable without rewriting historical publication records.

---

## 16. Graph architecture

Graph is a secondary visualization.

It may visualize relationships among:

- Projects;
- Notes;
- Materials;
- People;
- provenance relationships;
- selected other research connections.

Graph must not become:

- the source of truth;
- a replacement for explicit domain schemas;
- a reason to introduce a generic graph database.

Target principle:

```text
explicit relationships
        ↓
Graph projection
```

not:

```text
Graph abstraction
        ↓
everything else
```

---

## 17. Application navigation

Target global product hierarchy remains research-first.

Baseline:

```text
Overview
Projects
My Work
People
Search
```

The final placement of the future Community surface remains a product decision.

Supporting surfaces should not automatically become primary navigation.

Preferred placement:

```text
Notifications → header / utility
Calendar      → My Work / work view
Graph         → research exploration / Search-adjacent tool
Admin         → capability-gated utility
```

Functionality may exist without becoming a primary product pillar.

---

## 18. Authorization architecture

### 18.1 Core rule

Authorization belongs in server/domain services.

Never rely on hidden UI controls as the access-control mechanism.

### 18.2 Access categories

The target product distinguishes:

```text
research-readable
operational-member
Core / governance authority
library operator
author-private draft owner
```

These are not interchangeable.

### 18.3 Research-read

Research-read may grant access to official research across a Project.

It does not automatically grant:

- Task access;
- Activity access;
- Project mutation;
- private draft access;
- Library operations.

### 18.4 Operational membership

Operational membership permits Project work according to action capability.

### 18.5 Core

Core may have cross-Project research visibility and public publication authority without becoming an operational member.

### 18.6 Library operator

Library operator is scoped to a capability-enabled Project.

### 18.7 Non-disclosure

Denied reads should use non-disclosing behavior where revealing record existence would violate privacy boundaries.

---

## 19. Application facade

The UI should call a Project-centric application layer.

```text
UI
 ↓
application facade
 ↓
domain services
 ↓
database
```

The facade exists to provide stable product-facing operations and DTOs.

It must not become:

- a second domain layer;
- a universal entity framework;
- an ORM wrapper.

Its job is to prevent compatibility concepts such as raw Space / Branch mechanics from leaking into target UI.

---

## 20. Server/client split

Prefer server-first rendering and reads.

Use client components only for interaction that genuinely needs browser state, such as:

- editor/autosave;
- dialogs;
- evidence picker;
- search dialog;
- local filters;
- focus mode;
- collaboration interaction;
- Graph canvas;
- responsive drawers.

Do not introduce a global client state store without a demonstrated cross-cutting state need.

---

## 21. Persistence

PostgreSQL is authoritative for:

- Projects;
- research identities;
- Notes;
- versions;
- evidence relationships;
- Materials;
- Activities;
- Tasks;
- authorization data;
- publication state;
- circulation state;
- audit data.

Object/file storage holds source bytes where appropriate.

Generated views, exports, Graph data, search indexes, and future embeddings are projections.

They must be reproducible from authoritative state or clearly identified as disposable derived data.

---

## 22. Transactions and history

Research mutations that create a new official version and its provenance snapshot should commit atomically.

Examples:

```text
create NoteVersion
+
snapshot exact evidence
+
update current official state
```

must not leave partial historical truth.

Audit/version history is append-oriented.

Do not rewrite historical data to make migrations appear cleaner.

---

## 23. Compatibility and legacy code

The repository may retain compatibility concepts such as:

- Space;
- Branch;
- legacy Tree APIs;
- old export/release mechanisms;
- legacy routes;
- temporary projections.

These are implementation history, not target product vocabulary.

Compatibility code may remain when:

- target behavior still depends on it;
- migration safety requires it;
- historical records depend on it.

It should be removed when:

1. no target consumer remains;
2. migration / history safety has been verified;
3. tests no longer depend on the compatibility behavior.

Never delete migrations or historical data merely to simplify the current conceptual model.

---

## 24. Module direction

Current/target logical modules:

```text
auth
project
knowledge
storage
person
activity
pm
notify
search
publication
circulation
application
audit
```

A future Community/Post feature may become either:

```text
community
```

or a deliberately expanded collaboration domain.

Do not split it into a separate service unless scale or operations prove that necessary.

---

## 25. UI/content architecture

UI locales:

- Vietnamese
- English

Application chrome remains LTR.

Research content is arbitrary Unicode and should use content-aware direction such as `dir="auto"` where appropriate.

UI typography and research-content typography are separate concerns.

Do not claim full Hán-Nôm or multilingual glyph support until actual content corpora and deployment fonts have been tested.

---

## 26. Dependency policy

Prefer zero new dependencies for ordinary product slices.

Add a dependency only when it provides clear value that would be costly or risky to reproduce.

Avoid dependency-driven architecture.

In particular, do not adopt a heavy editor, global state library, UI framework, workflow engine, vector database, or plugin framework before the product requires it.

---

## 27. Architectural non-goals

WisdomTree must not optimize toward becoming:

- Notion;
- Obsidian;
- Discourse;
- Jira;
- Trello;
- Koha;
- Docusaurus;
- a generic CMS;
- a generic database builder;
- a generic automation engine.

Commodity features should stay simple.

Complexity is justified primarily by research-specific correctness:

- provenance;
- exact versions;
- evidence;
- privacy;
- curation;
- publication boundaries.

---

## 28. Current implementation versus target

### Already aligned

The current codebase already contains strong foundations for:

- Project ownership;
- Project Notes and private drafts;
- immutable Note versions;
- exact version-scoped research provenance;
- Materials and SourceVersions;
- extraction;
- canonical People;
- Activities;
- Project Tasks;
- search;
- stable public publication;
- optional Library circulation capability;
- collaboration primitives;
- Graph;
- authorization boundaries.

### Needs simplification or alignment review

Current code may contain behavior that is broader than the target product, especially:

- software-ticket-style Task semantics;
- Task KPI surfaces;
- sprint / estimate concepts;
- primary-nav promotion of supporting tools;
- legacy Space / Branch APIs and terminology;
- legacy export/release paths.

These must be evaluated by actual consumer tracing and product need, not deleted mechanically.

### Planned

Still planned or evolving:

- first-class Community/Post domain and UI;
- final Community navigation placement;
- provenance-aware RAG;
- final cleanup of remaining compatibility surfaces.

---

## 29. Architectural invariants

The following should be treated as acceptance rules.

1. **Project ownership is explicit.**
2. **Private drafts remain private to their author unless a feature explicitly changes that contract.**
3. **Official research versions are immutable.**
4. **Historical evidence points to exact immutable versions.**
5. **Unknown historical provenance is not presented as known-empty.**
6. **Cross-Project research access does not imply operational membership.**
7. **Person identity does not imply User identity.**
8. **Library is an optional Project capability, not a Tempo special case.**
9. **Internal changes do not automatically alter public content.**
10. **Graph is a projection, not the source of truth.**
11. **Search and future RAG respect authorization before retrieval.**
12. **Community discussion is not automatically authoritative knowledge.**
13. **Tasks support research coordination; they are not the product identity.**
14. **Compatibility infrastructure may support the target but must not define the target UI/domain vocabulary.**
15. **When two designs satisfy the same need, prefer the one with fewer concepts.**

---

## 30. Target mental model

The entire architecture can be summarized as:

```text
COMMUNITY
discussion and exploration
        │
        ▼
RESEARCH
Materials + fieldwork + Notes
        │
        ▼
PROVENANCE
exact evidence + immutable versions
        │
        ├───────────────┐
        ▼               ▼
RETRIEVAL            COORDINATION
Search / RAG         Tasks / Activities
        │
        ▼
PUBLICATION
explicit public revision
```

WisdomTree should remain centered on the transition:

> **from conversation and source material to trustworthy, traceable knowledge.**
