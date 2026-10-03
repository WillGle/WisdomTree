# Product

Updated: 2026-10-03. This describes the intended product, not a claim that every
capability is implemented. [roadmap.md](./roadmap.md) owns the detailed contracts,
open decisions, implementation sequence, and acceptance criteria.

## Who it serves

WisdomTree helps an individual explore topics over time, keep scattered notes and
materials together, connect ideas, and develop finished writing. A small team can
join that same workflow through deliberate sharing. Researchers and nontechnical
collaborators should be able to use it without learning the storage model.

For example, a software developer and an aviation technician explore Computational
Aerodynamics together. Each collects observations from their own background. They
share useful material, connect ideas, and discover an outcome as they learn.
A topic may stay open for years; only the tasks inside it need deadlines.

## The everyday workflow

1. Capture a personal note or material privately: field notes, images, recordings,
   documents, or a quick thought. People mentioned need not have app accounts.
2. Connect standalone atomic notes across topics without copying them. A note may
   grow into longer writing using the same identity and history.
3. Choose what to share directly or deliberately contribute to a shared topic.
   Select individual items, a batch, or a shared folder.
4. Explore the topic through recent notes, a shared atomic-note whiteboard, and
   a task board. Keep materials or reference notes open beside the editor in a
   personal panel layout.
5. Collaborate live within granted access, then turn the work into an essay,
   report, explanation, or other written outcome inside WisdomTree.
6. Optionally publish an individual note. After the owner enables publication,
   successful saves by authorized editors update its public page with history.
   Deleting the note immediately hides that public page. Restoring the content
   leaves it unpublished until the owner republishes.

## Ownership and collaboration

Personal content belongs to its creator and starts private. Direct sharing grants
read, comment, or edit access without transferring ownership. Deliberate
contribution transfers ownership to exactly one topic; adding personal content to
that topic's shared folder counts as contribution. The contributor remains the
author and retains edit rights, including recoverable deletion and restoration.
The topic owner controls sharing and publication of contributed content.

Other topics may reference the same item, but a reference grants neither ownership
nor access. When several grants apply, the highest permission wins: edit, then
comment, then read-only. Moving an item replaces its inherited folder access
while keeping direct shares. Shared folders have no restricted-item exceptions.
Inaccessible linked notes show “Private note”; shared views and
suggestions must not reveal private content. Folder access applies to existing and
future contents. Decision status and remaining edge cases are recorded in the roadmap.

The whiteboard arrangement is shared; panel arrangements are personal. Read-only
users cannot mutate the board. Tasks are visible to topic members so they can see
workload; that does not make tasks public on the internet. Topic owners manage
and assign tasks; assignees update their own progress. Content changes must retain
attribution, versions, and recovery. Live save/history details remain D7.

## Boundaries

Simplicity leads. Reuse the existing Project identity for topics and the existing
note, storage, authentication, and history foundations where they meet the need.
UI/UX overhaul is allowed within these product contracts. There is no requirement
to replace the application architecture or preserve obsolete navigation.

The first scope excludes AI/RAG, chat, portfolios, public collections, and source
annotation. Connection suggestions start with accessible words and shared context,
with explicit acceptance. Opening or playing materials is enough initially;
formats and panel persistence remain D6 and D8.

[architecture.md](./architecture.md) describes existing mechanisms, including
legacy wiki review and publication paths. Those mechanisms are migration context,
not alternative requirements for the intended personal-first workflow.
