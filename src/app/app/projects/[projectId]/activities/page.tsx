import { listAppProjectActivities } from "@/modules/application";
import { requireProjectModule } from "../_lib/workspace-context";
import { ActivitiesView } from "./_components/activities-view";

export default async function ProjectActivitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ create?: string }>;
}) {
  const { projectId } = await params;
  const { create } = await searchParams;
  const { actor, application, workspace } = await requireProjectModule(projectId, "activities");
  const activities = await listAppProjectActivities(actor, projectId);
  return (
    <ActivitiesView
      projectId={projectId}
      locale={application.locale}
      activities={activities}
      initialCreate={create === "1"}
      canCreate={workspace.project.capabilities.canCreateActivity}
    />
  );
}
