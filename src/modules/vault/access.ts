import { and, eq, isNull, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db, type Tx } from "@/db";
import { forbidden, notFound } from "@/lib/errors";
import type { Principal } from "../auth/principal";
import { users } from "../auth/schema";
import { spaceMembers, spaces } from "../storage/schema";
import { vaults } from "./schema";

export type VaultAction = "read" | "draft" | "write" | "manage";

export async function requireVaultAccess(
  actor: Principal,
  vaultId: string,
  action: VaultAction,
  runner: Tx | typeof db = db,
) {
  const [row] = await runner
    .select({ id: vaults.id, ownerUserId: vaults.ownerUserId, memberRole: spaceMembers.memberRole })
    .from(vaults)
    .innerJoin(spaces, and(eq(spaces.id, vaults.id), isNull(spaces.archivedAt)))
    .innerJoin(users, and(eq(users.id, actor.userId), isNull(users.disabledAt)))
    .leftJoin(
      spaceMembers,
      and(eq(spaceMembers.spaceId, vaults.id), eq(spaceMembers.userId, actor.userId)),
    )
    .where(eq(vaults.id, vaultId));
  const denial = action === "read" ? notFound() : forbidden();
  if (!row || (row.ownerUserId !== actor.userId && !row.memberRole)) throw denial;
  const role =
    row.ownerUserId === actor.userId
      ? "owner"
      : row.memberRole === "viewer"
        ? "viewer"
        : "contributor";
  if ((action === "write" || action === "manage") && role !== "owner") throw denial;
  if (action === "draft" && role === "viewer") throw denial;
  return { id: row.id, ownerUserId: row.ownerUserId, role } as const;
}

/** Legacy spaces keep their policy; adopted Vaults always add a durable gate. */
export async function requireSpaceVaultAccess(
  actor: Principal,
  spaceId: string | null | undefined,
  action: VaultAction,
  runner: Tx | typeof db = db,
) {
  if (!spaceId) return;
  const [vault] = await runner.select({ id: vaults.id }).from(vaults).where(eq(vaults.id, spaceId));
  if (vault) return requireVaultAccess(actor, vault.id, action, runner);
}

export function restrictVaultSpaceVisibility(actor: Principal, spaceColumn: AnyPgColumn): SQL {
  return sql`(NOT EXISTS (SELECT 1 FROM vaults AS scope_vault WHERE scope_vault.id = ${spaceColumn})
    OR EXISTS (SELECT 1 FROM vaults AS scope_vault
      JOIN spaces AS scope_space ON scope_space.id = scope_vault.id AND scope_space.archived_at IS NULL
      JOIN users AS scope_user ON scope_user.id = ${actor.userId} AND scope_user.disabled_at IS NULL
      WHERE scope_vault.id = ${spaceColumn} AND (scope_vault.owner_user_id = ${actor.userId}
        OR EXISTS (SELECT 1 FROM space_members AS scope_member
          WHERE scope_member.space_id = scope_vault.id AND scope_member.user_id = ${actor.userId}))))`;
}
