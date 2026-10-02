import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db, type Tx } from "@/db";
import { ApiError, forbidden, notFound, versionConflict } from "@/lib/errors";
import type { Principal } from "../auth/principal";
import { authorize } from "../auth/authorize";
import { users } from "../auth/schema";
import { recordAudit } from "../audit/service";
import type { AppVaultDto } from "../application/dto";
import { requireProjectResearchRead } from "../auth/core";
import { projects } from "../project/schema";
import { spaces, spaceMembers } from "../storage/schema";
import { requireVaultAccess, restrictVaultSpaceVisibility } from "./access";
import { vaults, projectVaults } from "./schema";

type Runner = Tx | typeof db;
const invalid = () => new ApiError(400, "invalid_vault", "Invalid Vault details.");
function nameValue(name: string) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 200) throw invalid();
  return name.trim();
}
function descriptionValue(description: string | null | undefined) {
  if (description === undefined || description === null) return null;
  if (typeof description !== "string" || description.length > 2000) throw invalid();
  return description.trim() || null;
}
async function activeActor(actor: Principal, runner: Runner) {
  const [user] = await runner
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, actor.userId), isNull(users.disabledAt)));
  if (!user) throw forbidden();
}
async function audit(
  tx: Tx,
  actor: Principal,
  action: string,
  vaultId: string,
  details: Record<string, unknown> = {},
) {
  await recordAudit(tx, actor, {
    accountability: "member",
    action,
    targetType: "vault",
    targetId: vaultId,
    details,
  });
}
async function readVault(
  actor: Principal,
  vaultId: string,
  runner: Runner = db,
): Promise<AppVaultDto> {
  const access = await requireVaultAccess(actor, vaultId, "read", runner);
  const [row] = await runner
    .select({
      id: vaults.id,
      name: spaces.name,
      description: vaults.description,
      version: spaces.version,
    })
    .from(vaults)
    .innerJoin(spaces, eq(spaces.id, vaults.id))
    .where(eq(vaults.id, vaultId));
  if (!row) throw notFound();
  return {
    ...row,
    role: access.role,
    capabilities: {
      canManage: access.role === "owner",
      canWrite: access.role === "owner",
      canDraft: access.role !== "viewer",
    },
  };
}
export async function createVault(
  actor: Principal,
  input: { name: string; description?: string },
): Promise<AppVaultDto> {
  const name = nameValue(input.name);
  const description = descriptionValue(input.description);
  return db.transaction(async (tx) => {
    await activeActor(actor, tx);
    const [space] = await tx
      .insert(spaces)
      .values({ name, type: "team", createdBy: actor.userId })
      .returning();
    await tx.insert(vaults).values({ id: space.id, ownerUserId: actor.userId, description });
    await tx
      .insert(spaceMembers)
      .values({
        spaceId: space.id,
        userId: actor.userId,
        memberRole: "manager",
        addedBy: actor.userId,
      });
    await audit(tx, actor, "vault.create", space.id);
    return readVault(actor, space.id, tx);
  });
}
export async function listVaults(actor: Principal): Promise<AppVaultDto[]> {
  const rows = await db
    .select({ id: vaults.id })
    .from(vaults)
    .innerJoin(spaces, eq(spaces.id, vaults.id))
    .where(restrictVaultSpaceVisibility(actor, spaces.id))
    .orderBy(asc(spaces.name), asc(vaults.id));
  return Promise.all(rows.map((row) => readVault(actor, row.id)));
}
export const getVault = (actor: Principal, vaultId: string) => readVault(actor, vaultId);
export async function updateVault(
  actor: Principal,
  vaultId: string,
  input: { name?: string; description?: string | null; expectedVersion: number },
): Promise<AppVaultDto> {
  if (
    !Number.isInteger(input.expectedVersion) ||
    input.expectedVersion < 1 ||
    (input.name === undefined && input.description === undefined)
  )
    throw invalid();
  const name = input.name === undefined ? undefined : nameValue(input.name);
  const description =
    input.description === undefined ? undefined : descriptionValue(input.description);
  return db.transaction(async (tx) => {
    await requireVaultAccess(actor, vaultId, "manage", tx);
    const current = await readVault(actor, vaultId, tx);
    if (current.version !== input.expectedVersion) throw versionConflict();
    if (
      (name === undefined || name === current.name) &&
      (description === undefined || description === current.description)
    )
      return current;
    const [updated] = await tx
      .update(spaces)
      .set({
        ...(name === undefined ? {} : { name }),
        updatedAt: new Date(),
        version: sql`${spaces.version} + 1`,
      })
      .where(and(eq(spaces.id, vaultId), eq(spaces.version, input.expectedVersion)))
      .returning({ id: spaces.id });
    if (!updated) throw versionConflict();
    if (description !== undefined)
      await tx.update(vaults).set({ description }).where(eq(vaults.id, vaultId));
    await audit(tx, actor, "vault.update", vaultId);
    return readVault(actor, vaultId, tx);
  });
}
export async function listVaultMembers(actor: Principal, vaultId: string) {
  const access = await requireVaultAccess(actor, vaultId, "manage");
  const rows = await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      memberRole: spaceMembers.memberRole,
    })
    .from(spaceMembers)
    .innerJoin(users, eq(users.id, spaceMembers.userId))
    .where(eq(spaceMembers.spaceId, vaultId))
    .orderBy(asc(users.displayName));
  return rows.map((row) => ({
    userId: row.userId,
    displayName: row.displayName,
    role:
      row.userId === access.ownerUserId
        ? ("owner" as const)
        : row.memberRole === "viewer"
          ? ("viewer" as const)
          : ("contributor" as const),
  }));
}
export async function listVaultMemberCandidates(actor: Principal, vaultId: string) {
  await requireVaultAccess(actor, vaultId, "manage");
  return db
    .select({ userId: users.id, displayName: users.displayName })
    .from(users)
    .where(isNull(users.disabledAt))
    .orderBy(asc(users.displayName));
}
export async function setVaultMember(
  actor: Principal,
  input: { vaultId: string; userId: string; role: "viewer" | "contributor" },
): Promise<void> {
  if (input.role !== "viewer" && input.role !== "contributor") throw invalid();
  await db.transaction(async (tx) => {
    const access = await requireVaultAccess(actor, input.vaultId, "manage", tx);
    if (input.userId === access.ownerUserId) throw forbidden();
    const [user] = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, input.userId), isNull(users.disabledAt)));
    if (!user) throw notFound();
    const [current] = await tx
      .select({ role: spaceMembers.memberRole })
      .from(spaceMembers)
      .where(and(eq(spaceMembers.spaceId, input.vaultId), eq(spaceMembers.userId, input.userId)));
    if (current?.role === input.role) return;
    await tx
      .insert(spaceMembers)
      .values({
        spaceId: input.vaultId,
        userId: input.userId,
        memberRole: input.role,
        addedBy: actor.userId,
      })
      .onConflictDoUpdate({
        target: [spaceMembers.spaceId, spaceMembers.userId],
        set: { memberRole: input.role },
      });
    await audit(tx, actor, "vault.member.set", input.vaultId, {
      userId: input.userId,
      role: input.role,
    });
  });
}
export async function removeVaultMember(
  actor: Principal,
  vaultId: string,
  userId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    const access = await requireVaultAccess(actor, vaultId, "manage", tx);
    if (userId === access.ownerUserId) throw forbidden();
    const removed = await tx
      .delete(spaceMembers)
      .where(and(eq(spaceMembers.spaceId, vaultId), eq(spaceMembers.userId, userId)))
      .returning();
    if (removed.length) await audit(tx, actor, "vault.member.remove", vaultId, { userId });
  });
}
async function requireProjectManage(actor: Principal, projectId: string, runner: Runner) {
  await activeActor(actor, runner);
  await requireProjectResearchRead(actor, projectId, runner);
  authorize(actor, "storage.space.members.manage", { spaceId: projectId, kind: "write" });
  const [membership] = await runner
    .select({ role: spaceMembers.memberRole })
    .from(spaceMembers)
    .where(and(eq(spaceMembers.spaceId, projectId), eq(spaceMembers.userId, actor.userId)));
  if (actor.role !== "admin_op" && membership?.role !== "manager") throw forbidden();
}
export async function linkProjectVault(
  actor: Principal,
  projectId: string,
  vaultId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await requireProjectManage(actor, projectId, tx);
    await requireVaultAccess(actor, vaultId, "read", tx);
    const added = await tx
      .insert(projectVaults)
      .values({ projectId, vaultId })
      .onConflictDoNothing()
      .returning();
    if (added.length) await audit(tx, actor, "vault.project.link", vaultId, { projectId });
  });
}
export async function unlinkProjectVault(
  actor: Principal,
  projectId: string,
  vaultId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await requireProjectManage(actor, projectId, tx);
    await requireVaultAccess(actor, vaultId, "read", tx);
    const removed = await tx
      .delete(projectVaults)
      .where(and(eq(projectVaults.projectId, projectId), eq(projectVaults.vaultId, vaultId)))
      .returning();
    if (removed.length) await audit(tx, actor, "vault.project.unlink", vaultId, { projectId });
  });
}
export async function listProjectVaults(
  actor: Principal,
  projectId: string,
): Promise<AppVaultDto[]> {
  await requireProjectResearchRead(actor, projectId);
  const rows = await db
    .select({ id: projectVaults.vaultId })
    .from(projectVaults)
    .where(
      and(
        eq(projectVaults.projectId, projectId),
        restrictVaultSpaceVisibility(actor, projectVaults.vaultId),
      ),
    );
  return Promise.all(rows.map((row) => readVault(actor, row.id)));
}
export async function listVaultProjects(actor: Principal, vaultId: string) {
  await requireVaultAccess(actor, vaultId, "read");
  const rows = await db
    .select({ id: projects.projectId, name: spaces.name })
    .from(projectVaults)
    .innerJoin(projects, eq(projects.projectId, projectVaults.projectId))
    .innerJoin(spaces, eq(spaces.id, projects.projectId))
    .where(eq(projectVaults.vaultId, vaultId));
  const visible = [];
  for (const row of rows) {
    try {
      await requireProjectResearchRead(actor, row.id);
      visible.push(row);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error;
    }
  }
  return visible;
}
