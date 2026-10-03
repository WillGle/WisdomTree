# WisdomTree: personal exploration and shared topic workspaces

Date: 2026-10-03.
Status: product brief for review, based on the owner's decisions in conversation.
This records intended behavior, not an implementation or release claim. Technical
design and implementation planning follow review of this brief.

## Purpose and audience

WisdomTree helps a person explore topics over time, connect scattered ideas, and
develop them into finished writing. Deliberate sharing extends that personal
workflow to a small team working together live.

The primary user collects notes across multiple apps and struggles to resume an
exploration or combine fragments into a coherent result. Teammates need the same
capabilities for field notes, recordings, images, documents, and information about
people involved. Participants recorded in the content need not have app accounts.

Success means being able to capture a thought, find its context later, connect it
to other ideas, and write something useful without leaving the workspace.

## Reference journey

The owner and their brother explore Computational Aerodynamics. One brings
software knowledge, the other aviation maintenance experience. They do not need
an agreed deliverable before starting.

1. Each collects personal notes and materials privately.
2. Each deliberately contributes selected content to the shared topic.
3. They arrange atomic notes on the topic whiteboard, connect ideas, and discuss
   material they can both access.
4. The topic owner assigns concrete next steps; assignees update progress.
5. Each uses a personal panel layout to read sources beside their writing.
6. They develop longer explanations or reports inside WisdomTree.
7. The content owner can publish an individual note. Later successful saves by
   authorized editors update its public page, with attributed history.

The topic can remain open for years and produce multiple outcomes. Deadlines
belong to tasks, not to a required topic completion date.

## Content and navigation

- An atomic note is a standalone idea. Rough fragments are valid starting points.
  A note can develop into longer writing using the same content and history.
- A note has one identity and can appear in several topics without duplication.
  Edits affect that same note wherever it is referenced.
- A topic's main view is a whiteboard where relevant atomic notes appear
  automatically. Recent notes and the task board remain readily accessible.
- Users create thoughts directly on the whiteboard, arrange cards, and connect
  notes. They should not need to define a research outcome before capturing ideas.
- Each topic has one shared card arrangement. What a person can see or change
  still depends on their permissions.
- Panel layouts are personal. Opening, closing, or resizing a panel does not
  rearrange another person's screen. Notes, longer writing, and materials can
  remain open side by side.
- Materials include documents, field records, images, and voice recordings.
  Initial scope includes upload and in-app viewing or playback for supported
  formats. Detailed page, passage, and timestamp annotations are deferred.

## Ownership, privacy, and contribution

### Personal content

Notes and materials start private and belong to their creator. Merely being
associated with a topic does not expose personal content to its owner or members.
A private note may appear in its author's topic view without appearing to others.

Personal owners can share their items directly with selected people. Direct
sharing alone is distinct from deliberately contributing ownership to a topic.

### Topic-owned content

Deliberately contributing an item to a topic transfers ownership to that topic.
The topic owner controls it, including access and publication. The creator keeps
authorship credit and the highest collaborator permission: edit, including
recoverable deletion and restoration. Edit permission is not ownership.

Adding content to a topic's shared folder counts as contribution. The app must
explain ownership transfer and inherited visibility before it occurs. An owner
cannot obtain private content merely by owning the topic.

Each contributed item has exactly one owning topic. Other topics can reference
the same item without taking ownership or gaining access. This applies to reused
materials as well as notes.

### Sharing and folders

- Owners can share individual items or select several items and share in bulk.
- Sharing a folder grants inherited access to its current and future contents.
- Editors can add their own content to a shared folder and edit permitted content.
- Only owners change access permissions or public status. For topic-owned
  content, those powers belong to the topic owner.
- Board access never overrides an item's privacy or ownership.

| Permission | Allowed behavior |
| --- | --- |
| Read-only | View accessible content and live updates; no mutations. |
| Comment | Read and comment; no content edits or card movement. |
| Edit | Create and move permitted cards, connect notes, contribute content, and edit, delete, or restore permitted items. |

Content and board permissions both apply: board edit permission does not grant
editing rights to a separately restricted item referenced there.

## Connections and suggestions

Users create links manually. Simple suggestions use matching words and shared
context, such as a common source or an existing linked note. Each suggestion
explains its reason and requires the user to choose whether to create a link.
Meaning-based AI suggestions are outside this first version.

Suggestions search only content the viewer may read. An existing link to an
inaccessible note displays "Private note" without title, content, or preview.
This intentionally reveals that a connection exists, not the private content.
Creating a link never grants access to its destination.

## Live collaboration and history

Authorized collaborators see shared note edits and whiteboard movement live.
Private content must not leak through live updates, previews, or suggestions.
Read-only users can observe updates but cannot change the shared state.

All changes are attributable: record who changed what and when. History covers
content edits, file replacements, deletion/restoration, board changes, and access
and publishing actions. Earlier content versions and deleted items are
recoverable. Restoring content must not silently restore obsolete access grants.

Live edits and durable saves are distinct. The UI must identify unsaved or failed
saves and must not claim content is saved before persistence succeeds. History
must retain contributor attribution even when several people edit together.

## Tasks

Each topic has one task board visible to all its members; it is not public on the
internet. This lets collaborators see assignments, deadlines, and workload.

Topic owners create, assign, and manage tasks. Assignees can update their own
progress, such as To do, In progress, and Done. Other task-management powers do
not follow automatically from note or board edit permissions.

Tasks can refer to notes and materials, but task visibility does not grant access
to those items. Private linked content must not leak into task previews.

## Writing and publication

Longer essays, reports, and explanations are written inside WisdomTree. Users
keep reference notes and materials open beside the editor.

Only individual notes are publicly published in the first version. Only their
owner can publish or unpublish them. Publishing does not expose their containing
topic, folder, or otherwise private linked content.

After publication, every successful save by an authorized editor updates the
public page immediately, without a separate release step. The editor must make
the public consequence clear. Earlier versions remain in history; public access
to that history is not implied.

## First-version boundaries

Included: personal capture, topics, atomic notes, live shared whiteboards,
personal multi-panel layouts, long-form writing, basic material viewing/playback,
manual and suggested connections, item/bulk/folder sharing, ownership transfer,
permissions, attributed version history and recovery, topic tasks, and individual
note publishing.

Deferred: whole-topic or folder websites, source annotations tied to passages or
timestamps, and AI connection suggestions. Chat, portfolios, and broader project
management are not requirements established by this conversation. Existing
features are not authorized for removal by this brief.

## Acceptance scenarios

1. Returning to a topic exposes recent work, accessible atomic notes, and pending
   tasks without requiring a finished research plan.
2. A personal note remains inaccessible to the topic owner until its creator
   deliberately shares or contributes it.
3. Contribution explains the transfer; afterward the topic owner manages access
   and the creator retains authorship and edit access.
4. One note appears in two topics with the same identity; the referencing topic
   gains no ownership or additional access.
5. Two authorized editors see note and board changes live while using different
   panel layouts. A reader cannot mutate either shared content or arrangement.
6. Bulk sharing affects selected items; folder sharing also applies to subsequent
   contributions, with clear visibility and ownership consequences.
7. Deleted notes and replaced files can be recovered with actor attribution.
8. Members see task workload; owners assign tasks and assignees update progress.
9. The owner publishes a note; a collaborator's successful save updates the public
   page and history records the author of the change.
10. Private link placeholders and suggestions reveal no inaccessible titles,
    previews, or content.

## Decisions needed before technical implementation

These are deliberately unresolved product edges, not permission to invent behavior:

- Whether topic ownership can have multiple owners or be transferred, and what
  happens to contributor access after removal from a topic.
- Whether a contributed item can return to personal ownership or move to another
  owning topic, and how existing references behave during that transition.
- How direct grants and inherited folder grants combine when an item moves, and
  whether any folder-level permission exceptions are needed.
- Whether contributors can withdraw contributions after ownership transfer, and
  what deleting an already-public note does to its public page.
- Which file formats must render or play in the first version, with download
  fallback for unsupported formats.
- Save/checkpoint boundaries for live editing, reconnect behavior, and how much
  board history needs direct restoration as opposed to an audit record.

## Relationship to the existing application

This brief captures the latest conversational intent. Existing README/product
documents describe earlier product framings and are not proof this scope exists.
In particular, this brief's public-on-save behavior differs from the earlier
immutable public-revision model, and topic ownership differs from the earlier
creator-controlled sharing model after contribution.

"Topic" is the user's product concept here. Whether it maps to the existing
Project domain requires a source audit; this brief does not prescribe a schema
rename, a new container, or a database migration.

After product review, compare the current implementation with these requirements
and plan independent phases: ownership/access/history; personal content and
materials; the live whiteboard and panels; connections and tasks; writing and
public saving. These are planning boundaries, not approved implementation steps.
