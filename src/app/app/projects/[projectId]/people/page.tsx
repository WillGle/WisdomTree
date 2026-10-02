import { requireProjectModule } from "../_lib/workspace-context";
import { listAppProjectPeople } from "@/modules/application";
import { PeopleDirectory } from "../../../people/_components/people-directory";

export default async function ProjectPeoplePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ create?: string }>;
}) {
  const { projectId } = await params;
  const { create } = await searchParams;
  const { actor, application, workspace } = await requireProjectModule(projectId, "people");
  const people = await listAppProjectPeople(actor, projectId);
  return (
    <PeopleDirectory
      locale={application.locale}
      people={people}
      projectId={projectId}
      initialCreate={create === "1"}
      canCreate={workspace.project.capabilities.canManagePeople}
    />
  );
}
