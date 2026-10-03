# Vault Foundation Implementation Plan

> **Status — 2026-10-03:** Historical implementation plan. The Vault-centered product direction is superseded. Retain this for migration context, not instructions to resume work.
> Current requirements, order, and progress: [canonical roadmap](../../../roadmap.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. User instructions override skill defaults: do not write new tests, preserve unrelated dirty state, and make minimal changes.

**Goal:** Cho người dùng tạo nhiều vault độc lập, quản lý người được đọc và liên kết vault với hồ sơ dự án, đồng thời giữ dữ liệu và đường dẫn cũ hoạt động.

**Architecture:** Vault mở rộng Space lưu trữ hiện có; Project tiếp tục là hồ sơ dự án với phạm vi quyền riêng. Ghi chú có chủ sở hữu nội dung là Vault; file tiếp tục thuộc Space của Vault. ProjectVault nối hai đối tượng mà không chuyển dữ liệu hoặc cấp quyền. Quyền vault được kiểm tra từ DB, kể cả trên đường đọc/ghi cũ.

**Tech Stack:** Next.js App Router, TypeScript, PostgreSQL, Drizzle ORM; UI components, CSS và object store hiện có.

**Spec:** `docs/superpowers/specs/2026-10-02-vault-first-design.md`, bản cập nhật được người dùng duyệt sau commit `0ed9a80`.

## Global Constraints

- “Không có AI trong phạm vi này.”
- “Không viết test mới nếu chưa được yêu cầu.” Chạy test sẵn có và ghi bằng chứng kiểm tra thủ công cho hành vi mới; không tự thêm hoặc mở rộng test files.
- “Không dọn code, sửa tài liệu cũ hoặc đụng các thay đổi chưa commit ngoài phạm vi triển khai được duyệt.” Không stage thay đổi có sẵn, lockfile hoặc artifact dùng thử.
- “Quyền Project/Activity và Vault được kiểm tra độc lập, kể cả trong graph/search và API phục vụ file.”
- “Không chạy chuyển đổi dữ liệu thật cho đến khi có danh sách ánh xạ và bằng chứng trên dữ liệu dùng thử.”
- “Chỉ hiện thao tác sản phẩm khi backend tương ứng hoạt động; không dùng nút giả hoặc màn hình hứa chức năng chưa có.”
- Không cài thêm dependency, không đổi provider/auth, không publish hoặc merge vào nhánh chính trong kế hoạch này.

## Phạm vi và phần chưa triển khai

Đây là phần 1 trong mục 9 của spec, không phải toàn bộ overhaul. Kết quả sử dụng được: tạo vault, xem danh sách/nội dung, mời người đọc hoặc cộng tác viên, và liên kết với Project. Chủ vault có thể lưu ghi chú/file qua API nền tảng; người đọc chỉ đọc. Cộng tác viên có thể giữ bản nháp riêng, nhưng chưa có thao tác gửi/duyệt đóng góp ở UI trước phần 2.

Hoạt động độc lập, bổ sung thời gian/địa điểm/phân loại, graph theo vai trò, báo cáo/portfolio, trình viết trực quan, đọc–ghi chú song song, public vault và chat mới thuộc các kế hoạch sau. Giữ các tính năng Project/Activity hiện có truy cập được. Không tuyên bố những phần này đã hoàn thành sau phần 1.

## Review Focus

1. Principal cũ sau khi bị gỡ quyền: không tiếp tục đọc hoặc lưu vào vault dù membership đã được cache trong request/session object.
2. Một Project liên kết hai Vault: người đọc Project không tự có quyền đọc cả hai; Core/admin không tự vượt quyền vault mới.
3. Vault mới cùng tên hoặc tạo đồng thời: không dùng tên làm định danh, không tạo Project giả, không tạo nhiều vault mặc định do race.
4. API cũ, search, graph, embed và history: không tạo lối vòng qua quyền vault mới hoặc làm mất phiên bản cũ.
5. Signed download URL: không cấp URL từ quyền Project và không tiếp tục phục vụ file vault riêng sau khi bị gỡ quyền.

Các mục này được kiểm tra thủ công ở task sở hữu hành vi và task 7. Test sẵn có là bằng chứng hồi quy, không tự chứng minh hành vi mới.

## Quyết định dữ liệu và tương thích

- Thêm `vaults`: `id` là PK/FK tới `spaces.id`, `ownerUserId` bắt buộc FK User, `description` tùy chọn. Tên, archivedAt và version lấy từ Space; không lưu hai bản metadata giống nhau. Space của vault mới dùng type `team` để tận dụng thành viên; đây là enum nội bộ, không có nghĩa vault công khai hoặc thuộc nhóm.
- Tận dụng `space_members` cho VaultMember. Chủ có role `manager`; cộng tác viên `contributor`; người chỉ đọc `viewer`. Với Space đã thuộc Vault, chỉ chủ vault quản lý thành viên hoặc sửa bản chính; role manager cũ không tự thành chủ.
- Thêm `project_vaults(project_id, vault_id)` với PK ghép. Không có thao tác cấp membership khi tạo/xóa liên kết.
- Thêm nullable `vault_id` vào `tree_nodes` và `node_drafts`. Ghi chú mới trong Vault có `project_id = NULL`; không cần tạo Project. `sources.space_id` chính là Space/Vault chứa file, không thêm cột vault_id trùng lặp.
- Branch có `space_id` của Vault; không tạo cây ghi chú song song. Ownership Note/Draft phải khớp Vault của Branch. Không sửa các bảng phiên bản bất biến để backfill quyền.
- Legacy Project có thể giữ cùng ID với Space lưu trữ trong giai đoạn chuyển tiếp. Chỉ khi đã xác nhận chủ vault mới ánh xạ Space đó thành Vault và thêm ProjectVault. `project_id` cũ của Note không còn cấp quyền đọc vượt Vault khi vault_id đã có.
- Không tự ánh xạ Shared Project bằng createdBy. Công cụ chuyển đổi tạo báo cáo dry-run và chỉ apply mapping `{ projectId, ownerUserId }` rõ ràng trên DB dùng thử ở giai đoạn này. Personal Project có thể đề xuất chủ hiện tại trong báo cáo, vẫn không tự chạy apply trên DB thật.
- Nội dung legacy chưa ánh xạ dùng chính sách cũ. Vault đã ánh xạ dùng chính sách mới. Việc liên kết một Project khác không thay đổi nguồn sở hữu hoặc ánh xạ legacy của nội dung.
- API Project cũ chỉ thao tác kho legacy gốc của Project; không suy ra một vault ghi mặc định từ nhiều liên kết ProjectVault. ID nội dung/phiên bản và URL cũ được giữ.

## Setup — thực hiện trước Task 1

- [x] At execution start, isolate from dirty checkout: preserve a binary diff and each identified untracked file outside the repository in a task-owned /tmp folder. If worktree is chosen, replay only the captured baseline into it; keep baseline ownership so existing diffs are not staged as feature work. Never stash/reset/clean the user's checkout.
- [x] Run baseline npm test before edits; if failures exist, record exact output and treat unrelated errors as baseline, not permission to fix them. Re-run appropriate gates after each change; do not report a gate as PASS when baseline failure still affects it.
- [x] Create disposable test DB with distinct `test` segment and task-owned object storage. Set TEST_DATABASE_URL and DATABASE_URL to that same DB for direct commands. Seed only this DB using the documented destructive seed flag; do not start or migrate normal application DB as a shortcut.

Setup là điều kiện trước khi sửa code, không phải bước kiểm tra cuối. Đặt FILE_STORAGE_DIR thành đường dẫn tuyệt đối riêng trong /tmp của task, ví dụ `/tmp/wisdomtree-vault-phase1-<run-id>/objects`; không dùng kho file ứng dụng đang chạy.

## Task 1: Schema và công cụ ánh xạ dùng thử

**Files:** Create `src/modules/vault/schema.ts`, `drizzle/0056_vault_foundation.sql`, `scripts/db/map-project-vaults.ts`; modify `src/modules/knowledge/schema.ts`.

**Interfaces:** Export `vaults`, `projectVaults`; add `treeNodes.vaultId` and `nodeDrafts.vaultId`. Mapping script accepts `--mapping <json-file>` and optional `--apply`; default is dry-run. Mapping is an array of `{ projectId: string, ownerUserId: string }`.

- [x] Kiểm tra lại tên migration tiếp theo; hiện cuối chuỗi là `0055_task_ticket_model_and_status_history.sql`. Nếu có migration mới, chọn số tiếp theo và cập nhật tên trong plan trước khi viết.
- [x] Tạo bảng/cột theo quyết định dữ liệu. Ràng buộc FK cho ProjectVault và ownership Note/Draft–Branch–Vault bằng migration; nếu cột vault_id có giá trị thì branch.space_id phải khớp. Không bỏ FK hiện có hoặc cập nhật version rows.
- [x] Viết mapping script kiểm tra DB isolated bằng `tests/db-safety.ts`, reject user không hoạt động, Project/Space không tồn tại, vault đã có chủ khác và mapping trùng/mâu thuẫn. Dry-run báo số bản ghi, các ID và quyền thành viên bị ảnh hưởng; không đọc/xuất nội dung file hay bí mật cấu hình.
- [x] `--apply` thực hiện mỗi mapping trong transaction: tạo Vault trên Space cũ, giữ owner membership manager, thêm ProjectVault, gắn vault_id cho Note/Draft tương ứng. Không di chuyển file, không xóa Project, không thay đổi ID hoặc public revisions. Apply lại mapping giống nhau không tạo bản sao.
- [x] Trên DB dùng thử, chạy migration từ schema hiện tại và từ DB mới; chạy dry-run, apply, apply lần hai. So sánh số Note/Source/Version/Publication và ID trước/sau; mapping không hợp lệ rollback toàn bộ mapping đó. Chưa commit task schema riêng nếu code đọc/ghi Task 2 chưa bảo vệ được Vault vừa ánh xạ.

**Verification:** `npm run typecheck`; `DATABASE_URL="$TEST_DATABASE_URL" npm run db:migrate` chỉ sau khi kiểm tra tên DB có segment `test`. Expected: exit 0, migration không làm mất bản ghi. Ghi kết quả cụ thể, không dùng kết quả từ DB thật.

## Task 2: Quyền vault và các lối truy cập cũ

**Files:** Create `src/modules/vault/access.ts`; modify `src/modules/auth/core.ts`, `src/modules/knowledge/service-queries.ts`, `src/modules/knowledge/service-mutations.ts`, `src/modules/knowledge/drafts.ts`, `src/modules/knowledge/support.ts`, `src/modules/knowledge/graph-provider.ts`, `src/modules/storage/service.ts`, `src/modules/storage/candidates.ts`, `src/modules/notify/service.ts`, `src/modules/publication/service.ts`, `src/modules/knowledge/publication.ts`, `src/modules/export/service.ts`, `src/modules/application/search.ts`, `src/modules/application/graph.ts`, `src/modules/application/provenance.ts`.

**Interfaces:** In access.ts define `VaultAction = "read" | "draft" | "write" | "manage"`; `requireVaultAccess(actor: Principal, vaultId: string, action: VaultAction, runner?: Tx | typeof db): Promise<{ id: string; ownerUserId: string; role: "owner" | "contributor" | "viewer" }>`; `restrictVaultSpaceVisibility(actor: Principal, spaceColumn: AnyPgColumn): SQL`.

- [x] Implement durable owner/membership/account-active checks. read = owner/member; draft = owner/contributor; write/manage = owner. Denied reads return 404, authenticated denied writes 403. Global role/Core không tạo quyền Vault.
- [x] restrictVaultSpaceVisibility trả điều kiện cho phép Space chưa là Vault, hoặc Vault có owner/membership bền vững. Dùng thêm vào query legacy; không biến quyền legacy thành quyền đọc Vault. Không dựa vào actor.spaceIds cho việc gỡ quyền.
- [x] Giữ requireProjectResearchRead bảo vệ hồ sơ Project theo quyền Project hiện có. Check Vault áp dụng thêm cho nội dung, không dùng nó để chặn metadata Project mà actor vẫn có quyền đọc. Các query search/graph/provenance lọc riêng từng loại node và bỏ cạnh khi một đầu không được đọc; không ẩn Project chỉ vì Vault liên kết riêng tư.
- [x] Gắn check vào đầu đọc/ghi Note/Draft, Source/versions/download, evidence, comments/presence và export/publication nội bộ nếu nội dung thuộc Vault. Nếu Note chưa có vault_id nhưng Branch thuộc Vault, không được bỏ qua check. Query đọc danh sách phải lọc trước limit/count; không fetch rộng rồi lọc ở UI.
- [x] Chặn publishDraft, updateNode, restore/merge/archive, upload/replace/rename/withdraw và quản lý membership từ đường cũ nếu actor không phải chủ vault đã ánh xạ. Contributor chỉ sửa bản nháp của mình, không bản nháp của người khác. Giữ chính sách cũ cho Space chưa thuộc Vault.
- [x] Không bật public publishing Vault mới ở phần 1. Publication cũ đã xuất bản vẫn đọc ẩn danh từ snapshot; thao tác xuất bản mới của nội dung đã thuộc Vault cần chủ Vault và luồng legacy đã hỗ trợ, không chỉ Core.
- [x] Kiểm tra thủ công owner, contributor, viewer, outsider, Core/admin không phải thành viên và Principal được lấy trước lúc gỡ membership. Kiểm tra GET trực tiếp, API cũ, search/graph/history/evidence/comments/export: nội dung mới không được lộ; bản chính không đổi khi contributor gọi đường ghi cũ.

**Verification:** `npm test`, `npm run test:privacy`, `npm run test:integration` với DB isolated. Expected: không có lỗi mới; kết quả baseline riêng phải được giữ khi có lỗi có sẵn. Commit Task 1–2 cùng nhau, stage đúng các file của hai task và không stage diff có sẵn của người dùng.

## Task 3: Tạo nhiều vault, thành viên và liên kết Project

**Files:** Create `src/modules/vault/service.ts`, `src/modules/application/vaults.ts`; modify `src/modules/application/dto.ts`, `src/modules/application/index.ts`.

**Interfaces:**

- `createVault(actor, input: { name: string; description?: string }): Promise<AppVaultDto>`.
- `listVaults(actor): Promise<AppVaultDto[]>`; `getVault(actor, vaultId): Promise<AppVaultDto>`.
- `updateVault(actor, vaultId, input: { name?: string; description?: string | null; expectedVersion: number }): Promise<AppVaultDto>`.
- `setVaultMember(actor, input: { vaultId: string; userId: string; role: "viewer" | "contributor" }): Promise<void>`; `removeVaultMember(actor, vaultId, userId): Promise<void>`; `listVaultMembers(actor, vaultId)` returns `{ userId, displayName, role }[]` to owner only.
- `linkProjectVault(actor, projectId, vaultId): Promise<void>`; `unlinkProjectVault(actor, projectId, vaultId): Promise<void>`; `listProjectVaults(actor, projectId): Promise<AppVaultDto[]>`.
- `AppVaultDto = { id: string; name: string; description: string | null; version: number; role: "owner" | "contributor" | "viewer"; capabilities: { canManage: boolean; canWrite: boolean; canDraft: boolean } }`.
- application/vaults.ts exports corresponding create/list/get/update/set/remove/link/unlink functions with `App` prefix and the same arguments. No DB access in delivery files.

- [x] Create Space + Vault + owner membership + audit in one transaction; normal active User có thể tạo. Name trims, length 1–200; description length ≤ 2000. Same name được phép, ID vẫn khác; không tự tạo Project.
- [x] Implement metadata optimistic concurrency using Space.version. Empty PATCH hoặc version cũ không tạo update/audit giả.
- [x] Owner alone manages members; target phải active User. Không cho đổi/xóa owner membership. set same role và unlink twice idempotent; không thêm email invitation hoặc đổi cách đăng nhập.
- [x] Link/unlink cần quyền quản lý Project hiện có và quyền đọc Vault. Không tạo membership, không trả metadata Vault không đọc được. Đổi quyền Vault có hiệu lực dù link vẫn còn.
- [x] Kiểm tra hai vault cùng tên của owner và hai vault thuộc hai owner; viewer không tạo liên kết Project thiếu quyền; manager Project không đọc được Vault riêng. So sánh số Project trước/sau createVault: không đổi.

**Verification:** `npm run typecheck`, `npm run lint`, stateful existing integration/privacy gates nếu Task 2 thay đổi. Expected: exit 0 hoặc báo riêng lỗi baseline. Commit logical service change only.

## Task 4: Nội dung thuộc Vault và file download

**Files:** Modify `src/modules/knowledge/drafts.ts`, `src/modules/storage/service.ts`, `src/modules/application/vaults.ts`, `src/modules/application/dto.ts`, `src/modules/knowledge/support.ts`, `src/modules/knowledge/service-queries.ts`, `src/app/api/blob/[token]/route.ts`; reuse `src/lib/sign.ts` and `src/modules/storage/object-store.ts`.

**Interfaces:**

- `createVaultNote(actor, input: { vaultId: string; title: string; contentMd?: string }): Promise<VaultDraftDto>`; `listVaultNotes(actor, vaultId)` returns official note refs and only the actor's drafts.
- `VaultDraftDto = { id: string; noteId: string | null; vaultId: string; title: string; contentMd: string; version: number; authorPrivate: true }`; do not put vaultId into legacy DraftDto.projectId.
- `saveVaultDraft(actor, vaultId, draftId, input: { title: string; contentMd: string; expectedVersion: number }): Promise<VaultDraftDto>`; `commitVaultDraft(actor, vaultId, draftId, expectedVersion: number): Promise<{ noteId: string; currentVersionId: string }>`.
- `uploadVaultResource(actor, input: { vaultId: string; title: string; file: File })` returns `{ id, title, vaultId, currentVersionId }`; `listVaultResources(actor, vaultId)` returns `{ id, title, currentVersionId, mimeType }[]`.
- `getVaultResourceDownloadToken(actor, vaultId, resourceId, versionId): Promise<string>`.
- `getDownloadAccessContext(objectKey: string): Promise<{ vaultId: string } | null>` in storage/service.ts: resolve immutable SourceVersion to owning Space/Vault; no existence/title/file disclosure to clients.

- [x] Extract only the shared transaction steps needed from current Project note creation to create a Vault draft without requiring a Project. Store vault_id, branch.space_id and project_id NULL; titles use existing validation. Untitled-draft and rich editing UX are deferred to part 3, not claimed here.
- [x] Reuse draft save/publish snapshot/support code. Owner commit requires current draft version and valid title; contributor commit denied; contributor save limited to own draft. Set vault_id on official Note when draft commits; no rewrite of historical snapshots.
- [x] Reuse store-first upload, current 100 MB cap and format denylist; owner-only until reviewed resource contributions exist. Read new Resource by Vault even when no Project exists. Preserve original checksum, version IDs and object keys.
- [x] Token issuance checks Vault + actual source + version ownership. Blob delivery resolves grant.objectKey through getDownloadAccessContext; for Vault-owned objects requirePrincipal and requireVaultAccess read before getObject. Existing non-Vault tokens retain existing path. Vault responses use private no-store to avoid a stale private cache serving revoked access; no new public file endpoint here.
- [x] Manually create/commit a Note and upload a PDF/TXT in a Vault without Project; DB confirms Note.project_id NULL and correct vault/branch/source ownership. Revoke a member after issuing a token: same URL returns 404 for that member; owner still downloads same bytes. Verify a wrong Vault/resource/version combination fails.

**Verification:** `npm test`, `npm run test:integration`, `npm run test:privacy` on isolated DB. Expected: immutable provenance and existing download-signing checks remain green; no file duplicates or contributor writes. Commit narrowly.

## Task 5: API nền tảng

**Files:** Create routes under `src/app/api/app/vaults/`: `route.ts`, `[vaultId]/route.ts`, `[vaultId]/members/route.ts`, `[vaultId]/members/[userId]/route.ts`, `[vaultId]/notes/route.ts`, `[vaultId]/drafts/[draftId]/route.ts`, `[vaultId]/drafts/[draftId]/commit/route.ts`, `[vaultId]/resources/route.ts`, `[vaultId]/resources/[resourceId]/versions/[versionId]/download/route.ts`; create `src/app/api/app/projects/[projectId]/vaults/route.ts`.

**Interfaces:** Same `{ vault }`, `{ vaults }`, `{ draft }`, `{ notes, drafts }`, `{ resources }` response conventions as current app API; create returns 201, reads/updates 200, member/link idempotent operations 200. Errors use toApplicationError; malformed payload 400, no session 401, denied read 404, denied write 403, stale expectedVersion 409.

- [x] Implement GET/POST collection, GET/PATCH vault, owner GET/POST members and DELETE member using requirePrincipal + application facade. IDs come from params, not client ownership fields.
- [x] Implement note list/create, draft save and owner commit; save/commit require integer expectedVersion ≥ 1. Resources GET/POST use multipart upload; reject empty file. Download route returns signed URL only after authorized version check.
- [x] Implement ProjectVault GET/POST/DELETE with vaultId string in body and independent checks from Task 3. GET lists only readable linked Vaults; do not return hidden names/counts.
- [x] Manually exercise valid and invalid payloads, 401/403/404/409, repeated member/link operations, and mismatched IDs. Confirm handlers contain no DB/schema imports.

**Verification:** `npm run typecheck`, `npm run lint`, `npm run test:boundaries`. Expected: exit 0, delivery contains no direct DB access. Commit routes only.

## Task 6: Giao diện vault tối thiểu hoạt động thật

**Files:** Create `src/app/app/vaults/page.tsx`, `src/app/app/vaults/[vaultId]/page.tsx`, `src/app/app/vaults/_components/vault-list.tsx`, `src/app/app/vaults/[vaultId]/_components/vault-settings.tsx`; modify `src/app/components/ui-next/shell/navigation.tsx`, `src/app/components/ui-next/localization/locales/vi.ts`, `src/app/components/ui-next/localization/locales/en.ts`, `src/app/app/projects/[projectId]/page.tsx`.

**Interfaces:** Pages use getAppRequestContext and application Vault functions. Client components receive AppVaultDto, locale and authorized member data; they call Task 5 APIs. No database imports or fabricated fallback data.

- [x] Add “Vault” entry and page with “Của tôi / Được chia sẻ”, create dialog asking only name/description, and immediate link to created vault. Keep existing Projects/Activities navigation for unfinished phases.
- [x] Vault page lists real Note/Resource refs, shows role, and owner settings for rename/description, members and existing Project links. In this phase new content manipulation stays at API level; do not add broken links to readers/editors that require Project. Show read-only content titles/metadata until part 3 provides their new routes, without implying inline reading is ready.
- [x] Add readable linked-vault list on Project page; preserve pre-existing dirty layout changes. On denied/failing fetch render real error + Retry, never empty successful data.
- [x] UI follows existing components/styles and labels. Dialog reset only on open/entity change; failed saves keep entered text; owner controls are absent for viewer/contributor. No placeholder contribution/publish/chat controls.
- [x] Browser-check create two vaults, rename stale version error, add/remove viewer, Project link, keyboard and 390px/1440px widths. Record which parts were checked by browser and which only by source.

**Verification:** `npm run typecheck`, `npm run lint`, `npm run test:style-contract`, `npm run test:contrast`, `npm run test:ui-next-contrast`, `npm run test:unit`; existing `npm run test:e2e -- research-intent.spec.ts` only against isolated test server/DB. Expected: existing gates pass; new vault journey proven manually, not inferred from legacy E2E. Commit only implementation hunks, not existing changes in shared UI files.

## Task 7: Validation, migration report và handoff

**Files:** Create `docs/superpowers/results/2026-10-02-vault-foundation-result.md`; update checkboxes in this plan. Do not create new test files.

- [x] Run npm test, integration/usecase/privacy suites, and production build/standalone checks once at the end. Existing browser gates and manual Vault/API matrix must target disposable runtime. Never print session tokens, .env contents or full DSNs in evidence.
- [x] Final manual matrix: owner vs contributor/viewer/outsider/Core; old Principal after revoke; unrelated Project manager; two same-name Vaults; two Projects using one Vault and one Project using two Vaults; wrong content/version IDs; legacy history/evidence/public revision survival; private-file URL after revoke.
- [x] Report migration dry-run and disposable apply counts, remaining Shared Project owner mappings, exact check outcomes, browser availability, commit range and deferred parts 2–6. No production mapping/apply or branch integration is included.
- [x] Review full scoped diff for authorization, ownership, hidden metadata and unintended staging. Remove only artifacts created by this run after recording evidence. Keep user dirt and durable result doc.

**Acceptance:** New Vaults exist without Project rows, membership revocation closes all Vault read/write paths, ProjectVault links do not change access, old data/history/URLs remain valid, and result report honestly separates foundation from the unfinished overhaul. A missing DB/browser gate remains unverified, not passed.

## Execution handoff

Plan review is required before implementation by the invoked Superpowers workflow. Recommend **Native** execution in an isolated worktree, preserving the dirty baseline: tasks share ownership and authorization code, so one implementer avoids concurrent edits. One whole-change review at the end; no new tests unless the user explicitly requests them. Subagent-driven execution is an alternative only if the user chooses it.

No worktree, product code, migration apply, new test or deployment has been performed while writing this plan.

## Execution outcome — 2026-10-02

Các bước triển khai và chạy kiểm chứng đã thực hiện. E2E không được tính clean PASS: lần cuối 7/8 passed; chạy xác nhận với retry có 2 flaky. Chi tiết và giới hạn ở `../results/2026-10-02-vault-foundation-result.md`. Chưa merge hoặc áp dụng mapping trên DB thật.
