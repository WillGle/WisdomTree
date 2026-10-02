import { pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { users } from "../auth/schema";
import { projects } from "../project/schema";
import { spaces } from "../storage/schema";

// A Vault owns content; linking it to a Project never grants membership.
export const vaults = pgTable("vaults", {
  id: uuid("id")
    .primaryKey()
    .references(() => spaces.id, { onDelete: "restrict" }),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  description: text("description"),
});

export const projectVaults = pgTable(
  "project_vaults",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.projectId, { onDelete: "restrict" }),
    vaultId: uuid("vault_id")
      .notNull()
      .references(() => vaults.id, { onDelete: "restrict" }),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.vaultId] })],
);
