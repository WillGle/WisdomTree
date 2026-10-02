"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AppVaultDto, ApplicationErrorDto } from "@/modules/application";
import type { UiLocale } from "@/modules/auth/profile";
import {
  Button,
  Dialog,
  EmptyState,
  Stack,
  Surface,
  TextArea,
  TextField,
  translate,
  getErrorPresentation,
} from "../../../components/ui-next";

import styles from "../vault.module.css";

export function VaultRetry({ locale }: { locale: UiLocale }) {
  const router = useRouter();
  return <Button onClick={() => router.refresh()}>{translate(locale, "vault.retry")}</Button>;
}
export function VaultList({ vaults, locale }: { vaults: AppVaultDto[]; locale: UiLocale }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/app/vaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(
          translate(
            locale,
            getErrorPresentation((data as ApplicationErrorDto).error).descriptionKey,
          ),
        );
        return;
      }
      setOpen(false);
      router.push(`/app/vaults/${data.vault.id}`);
      router.refresh();
    } catch {
      setError(translate(locale, "error.internal.description"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack>
      <div>
        <Button
          variant="primary"
          onClick={() => {
            setName("");
            setDescription("");
            setError(null);
            setOpen(true);
          }}
        >
          {translate(locale, "vault.create")}
        </Button>
      </div>
      {!vaults.length ? (
        <EmptyState
          title={translate(locale, "vault.empty")}
          description={translate(locale, "vault.emptyHelp")}
        />
      ) : null}
      {(["owner", "shared"] as const).map((group) => {
        const rows = vaults.filter((vault) =>
          group === "owner" ? vault.role === "owner" : vault.role !== "owner",
        );
        if (!rows.length) return null;
        return (
          <section key={group}>
            <h2>{translate(locale, group === "owner" ? "vault.mine" : "vault.shared")}</h2>
            <ul className={styles.list}>
              {rows.map((vault) => (
                <li key={vault.id}>
                  <Surface className={styles.content}>
                    <Link href={`/app/vaults/${vault.id}`}>
                      <strong className={styles.title}>{vault.name}</strong>
                    </Link>
                    {vault.description ? <p className={styles.title}>{vault.description}</p> : null}
                    <p className={styles.secondary}>{translate(locale, `vault.${vault.role}`)}</p>
                  </Surface>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <Dialog
        open={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        title={translate(locale, "vault.create")}
        closeLabel={translate(locale, "vault.close")}
      >
        <Stack as="form" onSubmit={create}>
          <TextField
            id="vault-name"
            label={translate(locale, "vault.name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={200}
            disabled={busy}
          />
          <TextArea
            id="vault-description"
            label={translate(locale, "vault.descriptionLabel")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            disabled={busy}
            rows={3}
          />
          {error ? <p role="alert">{error}</p> : null}
          <Button type="submit" variant="primary" loading={busy}>
            {translate(locale, "vault.create")}
          </Button>
        </Stack>
      </Dialog>
    </Stack>
  );
}
