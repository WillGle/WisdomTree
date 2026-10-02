import Link from "next/link";
import { listAppProjectNotes, toApplicationError } from "@/modules/application";
import { redirect } from "next/navigation";
import { translate, ErrorState, getErrorPresentation } from "../../../components/ui-next";
import { getProjectWorkspaceContext } from "./_lib/workspace-context";

const switchableModules = [
  "notes",
  "materials",
  "activities",
  "tasks",
  "people",
  "library",
] as const;

export default async function AppProjectOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ module?: string }>;
}) {
  const { projectId } = await params;
  const requestedModule = (await searchParams).module;
  const { actor, application, workspace } = await getProjectWorkspaceContext(projectId);

  if (
    requestedModule &&
    switchableModules.includes(requestedModule as (typeof switchableModules)[number])
  ) {
    if (workspace.modules[requestedModule as (typeof switchableModules)[number]]) {
      redirect(`/app/projects/${projectId}/${requestedModule}`);
    }
    redirect(`/app/projects/${projectId}`);
  }

  const noteResult = await listAppProjectNotes(actor, projectId).then(
    (data) => ({ data, error: null }),
    (error) => ({ data: null, error: toApplicationError(error) }),
  );
  const notes = noteResult.data?.notes ?? [];
  const drafts = noteResult.data?.drafts ?? [];
  const locale = application.locale;
  const base = `/app/projects/${encodeURIComponent(projectId)}`;
  const recentNotes = [...notes]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="ui-next-research-home">
      <div className="ui-next-research-actions">
        {workspace.project.capabilities.canCreateNote ? (
          <Link className="ui-next-button ui-next-button--primary" href={`${base}/notes?create=1`}>
            {translate(locale, "journey.newNote")}
          </Link>
        ) : null}
        {workspace.project.capabilities.canCreateMaterial ? (
          <Link
            className="ui-next-button ui-next-button--secondary"
            href={`${base}/materials?create=1`}
          >
            {translate(locale, "journey.addSource")}
          </Link>
        ) : null}
      </div>
      {noteResult.error ? (
        <ErrorState
          title={translate(locale, getErrorPresentation(noteResult.error.error).titleKey)}
          description={translate(
            locale,
            getErrorPresentation(noteResult.error.error).descriptionKey,
          )}
          action={<Link href={base}>{translate(locale, "vault.retry")}</Link>}
        />
      ) : drafts.length || recentNotes.length ? (
        <div className="ui-next-research-home__columns">
          {drafts.length ? (
            <section className="ui-next-research-panel" aria-labelledby="research-drafts-title">
              <h2 id="research-drafts-title">{translate(locale, "journey.resume")}</h2>
              <ul className="ui-next-research-resume">
                {drafts.slice(0, 5).map((draft) => (
                  <li key={draft.id}>
                    <Link href={`${base}/notes/${encodeURIComponent(draft.noteId ?? draft.id)}`}>
                      <strong>{draft.title || translate(locale, "notes.untitled")}</strong>
                      <span>
                        {translate(
                          locale,
                          draft.noteId ? "notes.state.draft_changes" : "notes.state.new_draft",
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={`${base}/notes`}>
                {translate(locale, "journey.openNotes")} <span aria-hidden="true">→</span>
              </Link>
            </section>
          ) : null}
          {recentNotes.length ? (
            <section className="ui-next-research-panel" aria-labelledby="research-recent-title">
              <h2 id="research-recent-title">{translate(locale, "journey.recent")}</h2>
              <ul className="ui-next-research-resume">
                {recentNotes.map((note) => (
                  <li key={note.id}>
                    <Link href={`${base}/notes/${encodeURIComponent(note.id)}`}>
                      <strong>{note.title}</strong>
                      {note.summary ? <span>{note.summary}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={`${base}/notes`}>
                {translate(locale, "journey.openNotes")} <span aria-hidden="true">→</span>
              </Link>
            </section>
          ) : null}
        </div>
      ) : (
        <p>{translate(locale, "vault.noNotes")}</p>
      )}
    </div>
  );
}
