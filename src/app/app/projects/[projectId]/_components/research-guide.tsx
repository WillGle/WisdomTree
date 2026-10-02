"use client";

import { usePathname } from "next/navigation";
import type { UiLocale } from "@/modules/auth/profile";
import type { AppProjectDto } from "@/modules/application";
import { HelpButton, translate, type UiNextMessageKey } from "@/app/components/ui-next";

export function ResearchGuide({
  projectId,
  locale,
  project,
}: {
  projectId: string;
  locale: UiLocale;
  project: AppProjectDto;
}) {
  const pathname = usePathname();
  const base = `/app/projects/${encodeURIComponent(projectId)}`;
  const section = pathname.slice(base.length + 1).split("/")[0];
  const messages: Record<string, UiNextMessageKey[]> = {
    materials: [
      "materials.description",
      "journey.collectHelp",
      "journey.sourcesNextHelp",
      "materials.field.fileHelp",
      "materials.physical.description",
      "materials.lineage.description",
    ],
    notes: [
      "journey.writeHelp",
      "journey.draftHelp",
      "journey.sharedHelp",
      "panel.publicHelp",
      "notes.emptyDescription",
    ],
    activities: ["activities.description", "journey.planHelp", "activities.tasksHelp"],
    tasks: ["tasks.description", "panel.taskHelp", "panel.taskPlanningHelp"],
    people: ["people.projectDescription", "panel.personHelp"],
    library: ["library.description", "panel.libraryHelp"],
    settings: [
      project.isPersonal ? "settings.personalDescription" : "settings.description",
      "settings.researchLensDescription",
      "settings.export.description",
      "settings.membersDescription",
      "settings.libraryOperatorsDescription",
    ],
  };
  return (
    <HelpButton
      locale={locale}
      messageKeys={
        messages[section] ?? [
          "journey.description",
          "journey.collectHelp",
          "journey.writeHelp",
          "journey.shareHelp",
          "journey.planHelp",
        ]
      }
    >
      <section>
        <h3>{translate(locale, "workspace.about")}</h3>
        {project.description ? <p dir="auto">{project.description}</p> : null}
        <p dir="auto">
          {project.isPersonal && project.researchLens === "Personal research workspace"
            ? translate(locale, "projects.personalWorkspace")
            : project.researchLens}
        </p>
      </section>
      <section>
        <h3>{translate(locale, "workspace.access")}</h3>
        <p>
          {translate(
            locale,
            project.operationalMember
              ? "workspace.workAccessDescription"
              : "workspace.researchAccessDescription",
          )}
        </p>
        <ul>
          <li>{translate(locale, "workspace.canReadResearch")}</li>
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
            .filter((key) => project.capabilities[key])
            .map((key) => (
              <li key={key}>
                {translate(
                  locale,
                  key === "canEditProject" && project.isPersonal
                    ? "workspace.canEditPersonalProject"
                    : `workspace.${key}`,
                )}
              </li>
            ))}
        </ul>
      </section>
    </HelpButton>
  );
}
