"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UiLocale } from "@/modules/auth/profile";
import { translate } from "@/app/components/ui-next";

export function ResearchGuide({ projectId, locale }: { projectId: string; locale: UiLocale }) {
  const pathname = usePathname();
  const base = `/app/projects/${encodeURIComponent(projectId)}`;
  const section = pathname.slice(base.length + 1);
  // Detail screens have their own contextual actions; keep their reading area clear.
  if (!section || section.includes("/") || section === "settings") return null;
  const collecting = section === "materials";
  const writing = section === "notes";
  if (!collecting && !writing && section !== "activities" && section !== "tasks") return null;

  return (
    <aside className="ui-next-research-guide" aria-label={translate(locale, "journey.title")}>
      <p>
        {translate(
          locale,
          collecting ? "journey.collectHelp" : writing ? "journey.writeHelp" : "journey.planHelp",
        )}
      </p>
      <Link href={`${base}/${collecting ? "notes" : "materials"}`}>
        {translate(locale, collecting ? "journey.openNotes" : "journey.openSources")}{" "}
        <span aria-hidden="true">→</span>
      </Link>
    </aside>
  );
}
