# Operations

Runtime reference for the existing application. Product scope and progress live
in [roadmap.md](./roadmap.md). These procedures are not instructions to deploy,
seed, or resume implementation during a documentation-only session.

## Local development

```sh
npm ci
npm run setup:system     # once per machine: pandoc + poppler + tesseract(-vie)
npm run dev             # db up → migrate → next dev; no seed
```

Sign-in on a dev machine: the demo picker on `/login` (exists only when
`NODE_ENV !== "production"`). Real sign-in is Google OIDC —
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`; access is
invite-only. For a seeded demo you can reach with your own Gmail, set
`SEED_ADMIN_EMAIL` before `db:seed`.

For a disposable demo only, `npm run demo:dev` migrates and destructively seeds
before starting development. **`db:seed` TRUNCATEs every table** and refuses to run without
`ALLOW_DESTRUCTIVE_SEED=1`. To restart without touching data:
`npm run start:prod`. First install on a real empty DB:
`npm run db:bootstrap -- --admin-email … --admin-name …` (non-destructive).

Development uses `.next-dev`; production builds use `.next` (see
`next.config.ts`). Do not rebuild over a running server that uses the same build
directory. For stale development chunks, stop the parent dev process, confirm
which output directory is stale, move aside only that generated directory, and
restart one server. Do not delete application data to repair a build cache.

## Environment

See [.env.example](../.env.example) for the full list. The ones that
matter in production: `DATABASE_URL` and `SESSION_SECRET` (both refused
missing), `CRON_SECRET` (deadline-reminder cron), `TRUST_PROXY=1` only
behind a proxy that rewrites forwarding headers, the Google OIDC
triple, and the tunables `SESSION_IDLE_MS` and `USER_RATE_LIMIT`.

`VAULT_GIT_DIR` optionally changes the directory containing per-space bare Git
mirrors (default `./data/vault-repos`).

## Deploy

```sh
export SESSION_SECRET=$(openssl rand -base64 32)
export CRON_SECRET=$(openssl rand -base64 32)
export TRUST_PROXY=1
docker compose --profile deploy up -d --build
```

One image; the `migrate` service runs `drizzle/*.sql` to completion
before `app` starts and never seeds. The `appdata` volume holds
`/app/data` (uploads, the export content repo) — without it a redeploy
deletes every uploaded file. Health: `GET /api/health` (unauthenticated
`SELECT 1`), wired to the container healthcheck. The image carries
`git`, `pandoc`, poppler and tesseract with Vietnamese data.

Cron, on the host:

- Housekeeping tick: `POST /api/cron/dispatch` with
  `Authorization: Bearer $CRON_SECRET` — deadline reminders (the one
  time-driven notification producer; everything else is written by its
  mutation) plus the stale-session purge.
- Backups: `scripts/backup.sh [dest]` — `pg_dump` plus separate verified
  tarballs of the object store and `VAULT_GIT_DIR` (suggested crontab inside
  the script). Keep all artifacts from the same run together.

## Tests

`npm test` = lint + typecheck + unit + boundaries + sign/time contracts and
contrast/style checks. Stateful suites require a separately created, migrated,
and seeded disposable database selected by `TEST_DATABASE_URL`, with a distinct
`test` segment in its name. Never use the normal application database. Match the
test/runtime database URLs and isolate object storage for browser tests. See
[tests/README.md](../tests/README.md) for the runner and fixture procedures.
`npm run test:e2e` builds on a standalone build; its global-setup signs in by
inserting a session row (no in-app backdoor). On NixOS the bundled Playwright
chromium lacks system libs — point `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` at a
system chromium.

Retired wiki-release procedures are in the
[archived operations reference](./archive/previous-reference/operations.md).
Verify the current route and service before using an old procedure.
