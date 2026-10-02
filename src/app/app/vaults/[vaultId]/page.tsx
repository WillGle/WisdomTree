import Link from "next/link";
import {
  getAppVault,
  listAppVaultNotes,
  listAppVaultResources,
  listAppVaultMembers,
  listAppVaultMemberCandidates,
  listAppVaultProjects,
  toApplicationError,
} from "@/modules/application";
import {
  PageContainer,
  PageHeader,
  Stack,
  Surface,
  ErrorState,
  getErrorPresentation,
  translate,
} from "../../../components/ui-next";
import { getAppRequestContext } from "../../_lib/request-context";
import { VaultRetry } from "../_components/vault-list";
import { VaultSettings } from "./_components/vault-settings";

import styles from "../vault.module.css";

export default async function VaultPage({ params }: { params: Promise<{ vaultId: string }> }) {
  const { vaultId } = await params;
  const { actor, application, projects } = await getAppRequestContext();
  const locale = application.locale;
  try {
    const vault = await getAppVault(actor, vaultId);
    const [content, resources, linkedProjects, members, candidates] = await Promise.all([
      listAppVaultNotes(actor, vaultId),
      listAppVaultResources(actor, vaultId),
      listAppVaultProjects(actor, vaultId),
      vault.capabilities.canManage ? listAppVaultMembers(actor, vaultId) : [],
      vault.capabilities.canManage ? listAppVaultMemberCandidates(actor, vaultId) : [],
    ]);
    return (
      <PageContainer>
        <Stack gap="4">
          <Link href="/app/vaults">← {translate(locale, "vault.title")}</Link>
          <PageHeader
            title={vault.name}
            description={vault.description ?? undefined}
            actions={
              vault.capabilities.canManage ? (
                <VaultSettings
                  vault={vault}
                  members={members}
                  candidates={candidates}
                  projects={projects}
                  linkedProjects={linkedProjects}
                  locale={locale}
                />
              ) : undefined
            }
          />
          <p className={styles.copy}>
            {translate(locale, `vault.${vault.role}`)} · {translate(locale, "vault.private")}
          </p>
          <p className={styles.secondary}>{translate(locale, "vault.contentHelp")}</p>
          <Surface className={styles.content}>
            <h2>{translate(locale, "vault.notes")}</h2>
            {content.notes.length ? (
              <ul>
                {content.notes.map((note) => (
                  <li key={note.id} className={styles.title}>
                    {note.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{translate(locale, "vault.noNotes")}</p>
            )}
          </Surface>
          <Surface className={styles.content}>
            <h2>{translate(locale, "vault.resources")}</h2>
            {resources.length ? (
              <ul>
                {resources.map((resource) => (
                  <li key={resource.id} className={styles.title}>
                    {resource.title}
                    {resource.mimeType === "application/pdf"
                      ? " · PDF"
                      : resource.mimeType?.startsWith("text/")
                        ? ` · ${translate(locale, "vault.textResource")}`
                        : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{translate(locale, "vault.noResources")}</p>
            )}
          </Surface>
          <Surface className={styles.content}>
            <h2>{translate(locale, "vault.drafts")}</h2>
            {content.drafts.length ? (
              <ul>
                {content.drafts.map((draft) => (
                  <li key={draft.id} className={styles.title}>
                    {draft.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{translate(locale, "vault.noDrafts")}</p>
            )}
          </Surface>
          <Surface className={styles.content}>
            <h2>{translate(locale, "vault.projects")}</h2>
            <p>{translate(locale, "vault.linkHelp")}</p>
            {linkedProjects.length ? (
              <ul>
                {linkedProjects.map((project) => (
                  <li key={project.id}>
                    <Link href={`/app/projects/${project.id}`}>{project.name}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{translate(locale, "vault.noProjects")}</p>
            )}
          </Surface>
        </Stack>
      </PageContainer>
    );
  } catch (error) {
    const copy = getErrorPresentation(toApplicationError(error).error);
    return (
      <PageContainer>
        <ErrorState
          title={translate(locale, copy.titleKey)}
          description={translate(locale, copy.descriptionKey)}
          action={<VaultRetry locale={locale} />}
        />
      </PageContainer>
    );
  }
}
