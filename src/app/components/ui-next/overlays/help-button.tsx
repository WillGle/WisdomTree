"use client";

import { useState, type ReactNode } from "react";
import type { UiLocale } from "@/modules/auth/profile";
import { IconButton } from "../primitives/button";
import { translate, type UiNextMessageKey } from "../localization";
import { Dialog } from "./dialog";

export function HelpButton({
  locale,
  messageKeys = [],
  children,
}: {
  locale: UiLocale;
  messageKeys?: UiNextMessageKey[];
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const title = translate(locale, "common.help");
  return (
    <>
      <IconButton
        type="button"
        variant="ghost"
        aria-label={title}
        title={title}
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">?</span>
      </IconButton>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        closeLabel={translate(locale, "common.close")}
      >
        <div className="ui-next-project-help">
          {messageKeys.map((key) => (
            <p key={key}>{translate(locale, key)}</p>
          ))}
          {children}
        </div>
      </Dialog>
    </>
  );
}
