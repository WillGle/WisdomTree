import { readFile } from "node:fs/promises";
import { Client } from "pg";
import { assertIsolatedTestDatabase } from "../../tests/db-safety";

assertIsolatedTestDatabase();

async function main() {
  const args = process.argv.slice(2);
  const index = args.indexOf("--mapping");
  if (
    index < 0 ||
    !args[index + 1] ||
    args.some((arg, i) => i !== index + 1 && arg !== "--mapping" && arg !== "--apply")
  ) {
    throw new Error("Usage: map-project-vaults.ts --mapping <json-file> [--apply]");
  }
  const mapping: unknown = JSON.parse(await readFile(args[index + 1], "utf8"));
  if (!Array.isArray(mapping)) throw new Error("Mapping must be an array.");
  const seen = new Set<string>();
  for (const row of mapping) {
    if (
      !row ||
      typeof row.projectId !== "string" ||
      typeof row.ownerUserId !== "string" ||
      seen.has(row.projectId)
    ) {
      throw new Error("Each Project needs one explicit, unique owner mapping.");
    }
    seen.add(row.projectId);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    const report = [];
    for (const { projectId, ownerUserId } of mapping) {
      const {
        rows: [project],
      } = await client.query(
        "SELECT p.project_id, p.personal_owner_id FROM projects p JOIN spaces s ON s.id=p.project_id WHERE p.project_id=$1 AND s.archived_at IS NULL FOR UPDATE OF p,s",
        [projectId],
      );
      const {
        rows: [owner],
      } = await client.query("SELECT id FROM users WHERE id=$1 AND disabled_at IS NULL FOR SHARE", [
        ownerUserId,
      ]);
      const {
        rows: [existing],
      } = await client.query("SELECT owner_user_id FROM vaults WHERE id=$1", [projectId]);
      if (
        !project ||
        !owner ||
        (project.personal_owner_id && project.personal_owner_id !== ownerUserId) ||
        (existing && existing.owner_user_id !== ownerUserId)
      ) {
        throw new Error(`Invalid or conflicting owner mapping for Project ${projectId}.`);
      }
      const {
        rows: [counts],
      } = await client.query(
        `SELECT
          (SELECT count(*)::int FROM tree_nodes WHERE project_id=$1) AS notes,
          (SELECT count(*)::int FROM node_drafts WHERE project_id=$1) AS drafts,
          (SELECT count(*)::int FROM sources WHERE space_id=$1) AS resources,
          (SELECT count(*)::int FROM space_members WHERE space_id=$1) AS members`,
        [projectId],
      );
      const {
        rows: [membership],
      } = await client.query(
        "SELECT member_role FROM space_members WHERE space_id=$1 AND user_id=$2",
        [projectId, ownerUserId],
      );
      report.push({
        projectId,
        ownerUserId,
        ...counts,
        alreadyMapped: Boolean(existing),
        ownerPreviousRole: membership?.member_role ?? null,
        ownerMembershipChanges: membership?.member_role !== "manager",
      });
      if (args.includes("--apply")) {
        await client.query(
          "INSERT INTO vaults(id,owner_user_id) VALUES($1,$2) ON CONFLICT(id) DO NOTHING",
          [projectId, ownerUserId],
        );
        await client.query(
          "INSERT INTO space_members(space_id,user_id,member_role,added_by) VALUES($1,$2,'manager',$2) ON CONFLICT(space_id,user_id) DO UPDATE SET member_role='manager'",
          [projectId, ownerUserId],
        );
        await client.query(
          "INSERT INTO project_vaults(project_id,vault_id) VALUES($1,$1) ON CONFLICT DO NOTHING",
          [projectId],
        );
        await client.query(
          "UPDATE tree_nodes SET vault_id=$1 WHERE project_id=$1 AND vault_id IS NULL",
          [projectId],
        );
        await client.query(
          "UPDATE node_drafts SET vault_id=$1 WHERE project_id=$1 AND vault_id IS NULL",
          [projectId],
        );
      }
    }
    await client.query(args.includes("--apply") ? "COMMIT" : "ROLLBACK");
    console.log(
      JSON.stringify(
        { mode: args.includes("--apply") ? "applied" : "dry_run", projects: report },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Mapping failed.");
  process.exitCode = 1;
});
