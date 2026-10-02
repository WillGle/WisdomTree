import Link from "next/link";
import {
  listAppProjectNotes,
  listAppProjectVaults,
  toApplicationError,
} from "@/modules/application";
import { redirect } from "next/navigation";
import { Surface, translate, ErrorState, getErrorPresentation } from "../../../components/ui-next";
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
  const vaults = await listAppProjectVaults(actor, projectId);
  const locale = application.locale;
  const base = `/app/projects/${encodeURIComponent(projectId)}`;
  const recentNotes = [...notes]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="ui-next-research-home">
      <section className="ui-next-research-intro" aria-labelledby="research-home-title">
        <h2 id="research-home-title">{translate(locale, "journey.title")}</h2>
        <p>{translate(locale, "journey.description")}</p>
      </section>
      <div className="ui-next-research-path">
        {(
          [
            { key: "collect", help: "collectHelp", module: "materials", action: "openSources" },
            { key: "write", help: "writeHelp", module: "notes", action: "openNotes" },
            { key: "share", help: "shareHelp", module: "notes", action: "openNotes" },
          ] as const
        )
          .filter((step) => workspace.modules[step.module])
          .map((step, index) => (
            <section className="ui-next-research-step" key={step.key}>
              <span className="ui-next-research-step__number" aria-hidden="true">
                {index + 1}
              </span>
              <h3>{translate(locale, `journey.${step.key}`)}</h3>
              <p>{translate(locale, `journey.${step.help}`)}</p>
              <Link href={`${base}/${step.module}`}>
                {translate(locale, `journey.${step.action}`)} <span aria-hidden="true">→</span>
              </Link>
            </section>
          ))}
      </div>
      <section className="ui-next-research-panel" aria-labelledby="project-vaults-title">
        <h2 id="project-vaults-title">{translate(locale, "vault.title")}</h2>
        <p>{translate(locale, "vault.linkHelp")}</p>
        {vaults.length ? (
          <ul>
            {vaults.map((vault) => (
              <li key={vault.id}>
                <Link href={`/app/vaults/${vault.id}`}>{vault.name}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>{translate(locale, "vault.empty")}</p>
        )}
      </section>
      {noteResult.error ? (
        <ErrorState
          title={translate(locale, getErrorPresentation(noteResult.error.error).titleKey)}
          description={translate(
            locale,
            getErrorPresentation(noteResult.error.error).descriptionKey,
          )}
          action={<Link href={base}>{translate(locale, "vault.retry")}</Link>}
        />
      ) : (
        <div className="ui-next-research-home__columns">
          <section className="ui-next-research-panel" aria-labelledby="research-drafts-title">
            <h2 id="research-drafts-title">{translate(locale, "journey.resume")}</h2>
            {drafts.length ? (
              <ul className="ui-next-research-resume">
                {drafts.map((draft) => (
                  <li key={draft.id}>
                    <Link href={`${base}/notes/${encodeURIComponent(draft.noteId ?? draft.id)}`}>
                      <strong>{draft.title || translate(locale, "notes.untitled")}</strong>
                      <span>
                        {translate(
                          locale,
                          draft.noteId ? "notes.state.draft_changes" : "notes.state.new_draft",
                        )}{" "}
                        <span aria-hidden="true">→</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="ui-next-research-empty">
                <p>{translate(locale, "journey.draftsEmptyHelp")}</p>
              </div>
            )}
            <div className="ui-next-research-actions">
              {workspace.project.capabilities.canCreateNote ? (
                <Link
                  className="ui-next-button ui-next-button--primary"
                  href={`${base}/notes?create=1`}
                >
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
          </section>
          <section className="ui-next-research-panel" aria-labelledby="research-recent-title">
            <h2 id="research-recent-title">{translate(locale, "journey.recent")}</h2>
            {recentNotes.length ? (
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
            ) : (
              <p>{translate(locale, "journey.recentEmpty")}</p>
            )}
            <Link href={`${base}/notes`}>
              {translate(locale, "journey.openNotes")} <span aria-hidden="true">→</span>
            </Link>
          </section>
        </div>
      )}
      {workspace.modules.tasks || workspace.modules.activities ? (
        <section className="ui-next-research-planning" aria-labelledby="research-planning-title">
          <div>
            <h2 id="research-planning-title">{translate(locale, "nav.organize")}</h2>
            <p>{translate(locale, "journey.planHelp")}</p>
          </div>
          <div className="ui-next-research-actions">
            {workspace.modules.tasks ? (
              <Link href={`${base}/tasks`}>{translate(locale, "project.tasks")}</Link>
            ) : null}
            {workspace.modules.activities ? (
              <Link href={`${base}/activities`}>{translate(locale, "project.activities")}</Link>
            ) : null}
            <Link href={`${base}/people`}>{translate(locale, "project.people")}</Link>
          </div>
        </section>
      ) : null}
      <details className="ui-next-research-about">
        <summary>{translate(locale, "journey.projectInfo")}</summary>
        <div className="ui-next-project-overview grid grid-cols-2 max-md:grid-cols-1 gap-6">
          <section aria-labelledby="project-about-title" className="min-w-0">
            <h2 id="project-about-title" className="m-0 mb-3 text-lg font-bold">
              {translate(application.locale, "workspace.about")}
            </h2>
            <Surface>
              <p dir="auto" className="m-0 leading-relaxed break-words">
                {workspace.project.description ||
                  (workspace.project.isPersonal &&
                  workspace.project.researchLens === "Personal research workspace"
                    ? translate(application.locale, "projects.personalWorkspace")
                    : workspace.project.researchLens)}
              </p>
            </Surface>
          </section>
          <section aria-labelledby="project-access-title" className="min-w-0">
            <h2 id="project-access-title" className="m-0 mb-3 text-lg font-bold">
              {translate(application.locale, "workspace.access")}
            </h2>
            <Surface tone="sunken">
              <h3 className="m-0 text-base font-semibold">
                {translate(
                  application.locale,
                  workspace.project.operationalMember
                    ? "projects.workAccess"
                    : "projects.researchAccess",
                )}
              </h3>
              <p className="m-0 mt-2 text-sm text-ui-text-secondary">
                {translate(
                  application.locale,
                  workspace.project.operationalMember
                    ? "workspace.workAccessDescription"
                    : "workspace.researchAccessDescription",
                )}
              </p>
              <ul className="mt-4 space-y-1 text-sm text-ui-text-secondary pl-5 list-disc">
                <li>{translate(application.locale, "workspace.canReadResearch")}</li>
                {(
                  [
                    "canCreateNote",
                    "canCreateMaterial",
                    "canCreateActivity",
                    "canCreateTask",
                    "canManagePeople",
                    "canEditProject",
                    "canPublish",
                  ] as const
                )
                  .filter((capability) => workspace.project.capabilities[capability])
                  .map((capability) => (
                    <li key={capability}>
                      {translate(
                        application.locale,
                        capability === "canEditProject" && workspace.project.isPersonal
                          ? "workspace.canEditPersonalProject"
                          : `workspace.${capability}`,
                      )}
                    </li>
                  ))}
              </ul>
            </Surface>
          </section>
        </div>
      </details>
    </div>
  );
}
