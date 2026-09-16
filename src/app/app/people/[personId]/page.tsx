import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer, PageHeader, Stack, Surface, translate, Button } from "@/app/components/ui-next";
import { getAppPerson, toApplicationError } from "@/modules/application";
import { getAppRequestContext } from "../../_lib/request-context";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = await params;
  const { actor, application } = await getAppRequestContext();
  let person: Awaited<ReturnType<typeof getAppPerson>>;
  try {
    person = await getAppPerson(actor, personId);
  } catch (error) {
    if (toApplicationError(error).error === "not_found") notFound();
    throw error;
  }
  
  return (
    <PageContainer width="standard">
      <Stack>
        <PageHeader 
          title={person.displayName}
          description={person.summary ?? undefined}
          actions={
            <Link href="/app/people" className="text-ui-accent underline-offset-[0.18em] hover:underline">
              {translate(application.locale, "people.allPeople")}
            </Link>
          }
        />
        
        <Surface className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">{translate(application.locale, "people.projects")}</h3>
              {person.projects.length ? (
                <ul className="space-y-2">
                  {person.projects.map((project) => (
                    <li key={project.id}>
                      <Link 
                        href={`/app/projects/${project.id}`}
                        className="text-ui-accent hover:underline"
                      >
                        {project.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ui-text-muted">{translate(application.locale, "people.noProjects")}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-3">{translate(application.locale, "people.activities")}</h3>
              {person.activities.length ? (
                <div className="space-y-3">
                  {person.activities.map((activity) => (
                    <div key={activity.id} className="p-3 border border-ui-border rounded-lg bg-ui-surface">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link 
                            href={`/app/projects/${activity.project.id}/activities/${activity.id}`}
                            className="text-ui-accent font-medium hover:underline"
                          >
                            {activity.title}
                          </Link>
                          {activity.roleLabel && (
                            <span className="ml-2 text-sm text-ui-text-muted">— {activity.roleLabel}</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-ui-text-muted">
                        <span className="inline-block bg-ui-surface-secondary px-2 py-1 rounded text-xs">
                          {activity.project.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-ui-text-muted">{translate(application.locale, "people.noActivities")}</p>
              )}
            </div>
          </div>
        </Surface>
      </Stack>
    </PageContainer>
  );
}
