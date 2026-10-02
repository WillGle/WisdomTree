"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AppProjectDto, AppVaultDto, ApplicationErrorDto } from "@/modules/application";
import type { UiLocale } from "@/modules/auth/profile";
import {
  Button,
  Dialog,
  Inline,
  Select,
  Stack,
  TextArea,
  TextField,
  translate,
  getErrorPresentation,
} from "../../../../components/ui-next";

type Member = { userId: string; displayName: string; role: "owner" | "viewer" | "contributor" };
export function VaultSettings({
  vault,
  members,
  candidates,
  projects,
  linkedProjects,
  locale,
}: {
  vault: AppVaultDto;
  members: Member[];
  candidates: { userId: string; displayName: string }[];
  projects: AppProjectDto[];
  linkedProjects: { id: string; name: string }[];
  locale: UiLocale;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(vault.name);
  const [description, setDescription] = useState(vault.description ?? "");
  const [expectedVersion, setExpectedVersion] = useState(vault.version);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"viewer" | "contributor">("viewer");
  const [projectId, setProjectId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const base = `/api/app/vaults/${vault.id}`;
  const manageableProjects = projects.filter((project) => project.capabilities.canEditProject);
  const availableProjects = manageableProjects.filter(
    (project) => !linkedProjects.some((link) => link.id === project.id),
  );
  const availableMembers = candidates.filter(
    (candidate) => !members.some((member) => member.userId === candidate.userId),
  );
  async function change(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(
          translate(
            locale,
            getErrorPresentation((data as ApplicationErrorDto).error).descriptionKey,
          ),
        );
        return false;
      }
      setMessage(translate(locale, "vault.saved"));
      router.refresh();
      return true;
    } catch {
      setError(translate(locale, "error.internal.description"));
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (await change(base, "PATCH", { name, description, expectedVersion })) setOpen(false);
  }
  return (
    <>
      <Button
        onClick={() => {
          setName(vault.name);
          setDescription(vault.description ?? "");
          setExpectedVersion(vault.version);
          setMessage(null);
          setError(null);
          setOpen(true);
        }}
      >
        {translate(locale, "vault.settings")}
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        title={translate(locale, "vault.settings")}
        closeLabel={translate(locale, "vault.close")}
      >
        <Stack>
          {error ? <p role="alert">{error}</p> : null}
          {message ? <p role="status">{message}</p> : null}
          <Stack as="form" onSubmit={save} gap="3">
            <TextField
              id="vault-edit-name"
              label={translate(locale, "vault.name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={200}
              disabled={busy}
            />
            <TextArea
              id="vault-edit-description"
              label={translate(locale, "vault.descriptionLabel")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              disabled={busy}
            />
            <Button type="submit" variant="primary" loading={busy}>
              {translate(locale, "vault.save")}
            </Button>
          </Stack>
          <section>
            <h3>{translate(locale, "vault.members")}</h3>
            <ul className="grid gap-3 m-0 p-0 list-none">
              {members.map((member) => (
                <li key={member.userId}>
                  <Inline>
                    <span className="break-words">
                      {member.displayName} · {translate(locale, `vault.${member.role}`)}
                    </span>
                    {member.role !== "owner" ? (
                      <>
                        <Select
                          id={`vault-member-${member.userId}`}
                          label={`${translate(locale, "vault.role")}: ${member.displayName}`}
                          value={member.role}
                          disabled={busy}
                          onChange={(event) =>
                            void change(`${base}/members`, "POST", {
                              userId: member.userId,
                              role: event.target.value,
                            })
                          }
                        >
                          <option value="viewer">{translate(locale, "vault.viewer")}</option>
                          <option value="contributor">
                            {translate(locale, "vault.contributor")}
                          </option>
                        </Select>
                        <Button
                          variant="ghost"
                          disabled={busy}
                          onClick={() => void change(`${base}/members/${member.userId}`, "DELETE")}
                        >
                          {translate(locale, "vault.remove")}
                        </Button>
                      </>
                    ) : null}
                  </Inline>
                </li>
              ))}
            </ul>
            {availableMembers.length ? (
              <Stack
                as="form"
                gap="3"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  void change(`${base}/members`, "POST", { userId, role });
                }}
              >
                <Select
                  id="vault-new-member"
                  label={translate(locale, "vault.member")}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                  disabled={busy}
                >
                  <option value="">{translate(locale, "vault.addMember")}</option>
                  {availableMembers.map((candidate) => (
                    <option key={candidate.userId} value={candidate.userId}>
                      {candidate.displayName}
                    </option>
                  ))}
                </Select>
                <Select
                  id="vault-new-role"
                  label={translate(locale, "vault.role")}
                  value={role}
                  onChange={(e) => setRole(e.target.value as "viewer" | "contributor")}
                  disabled={busy}
                >
                  <option value="viewer">{translate(locale, "vault.viewer")}</option>
                  <option value="contributor">{translate(locale, "vault.contributor")}</option>
                </Select>
                <Button type="submit" disabled={busy || !userId}>
                  {translate(locale, "vault.addMember")}
                </Button>
              </Stack>
            ) : null}
          </section>
          <section>
            <h3>{translate(locale, "vault.projects")}</h3>
            <p>{translate(locale, "vault.linkHelp")}</p>
            {linkedProjects.length ? (
              <ul className="grid gap-3 m-0 p-0 list-none">
                {linkedProjects.map((project) => (
                  <li key={project.id}>
                    <Inline>
                      <span className="break-words">{project.name}</span>
                      {manageableProjects.some((candidate) => candidate.id === project.id) ? (
                        <Button
                          disabled={busy}
                          variant="ghost"
                          onClick={() =>
                            void change(`/api/app/projects/${project.id}/vaults`, "DELETE", {
                              vaultId: vault.id,
                            })
                          }
                        >
                          {translate(locale, "vault.remove")}
                        </Button>
                      ) : null}
                    </Inline>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{translate(locale, "vault.noProjects")}</p>
            )}
            {availableProjects.length ? (
              <Stack
                as="form"
                gap="3"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  void change(`/api/app/projects/${projectId}/vaults`, "POST", {
                    vaultId: vault.id,
                  });
                }}
              >
                <Select
                  id="vault-project"
                  label={translate(locale, "vault.chooseProject")}
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                  disabled={busy}
                >
                  <option value="">{translate(locale, "vault.chooseProject")}</option>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
                <Button type="submit" disabled={busy || !projectId}>
                  {translate(locale, "vault.linkProject")}
                </Button>
              </Stack>
            ) : null}
          </section>
        </Stack>
      </Dialog>
    </>
  );
}
