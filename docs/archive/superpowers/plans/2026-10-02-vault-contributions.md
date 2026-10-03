# Vault Contributions Implementation Plan

> **Status — 2026-10-03:** Superseded and stopped Vault plan. Earlier priority and execution instructions below are historical, not the current work queue.
> Current requirements, order, and progress: [canonical roadmap](../../../roadmap.md).

> Cập nhật yêu cầu 2026-10-02: người dùng bỏ Vault khỏi luồng sản phẩm, dùng Project làm trọng tâm. Thiết kế Vault dưới đây là lịch sử; phase 2 Vault đã dừng, không tiếp tục triển khai theo plan này. Ưu tiên hiện tại: làm gọn Project, thống nhất trang con và hướng dẫn trong popup [?].

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans, native execution task-by-task. User instructions override defaults: minimal changes, no new tests/assertions, no dependencies, atomic commits. One independent whole-change review at the end.

**Goal:** Cộng tác viên gửi ghi chú hoặc file vào Vault; chủ kho xem nội dung được gửi, trao đổi và duyệt an toàn bằng giao diện dễ hiểu.

**Architecture:** Dùng quyền Vault và phiên bản nội dung hiện có. Thêm đề xuất riêng cho Vault vì proposal cũ bắt buộc đã có node và không hỗ trợ file/bản nháp mới. Mỗi đề xuất chứa một ghi chú hoặc một file; mỗi lần gửi là một snapshot bất biến. Không thêm framework review hay bảng Content tổng quát.

**Tech Stack:** Next.js App Router, Drizzle, PostgreSQL, object store và UI primitives hiện có.

**Spec:** `docs/superpowers/specs/2026-10-02-vault-first-design.md`, mục 5 và phần 2 của mục 9.

## Global Constraints

- “Simple but work” áp dụng mọi action/function/file; giữ style và dữ liệu cũ, không refactor ngoài phạm vi.
- Không AI, không dependency/lockfile mới, không test/assertion mới; dùng checks hiện có và script dùng thử ngoài code sản phẩm.
- Chỉ chủ Vault duyệt đóng góp của người khác. Contributor không ghi thẳng bản chính; viewer không gửi/thảo luận đề xuất.
- Mỗi lần gửi đóng băng nội dung, nguồn hỗ trợ và phiên bản gốc. Gửi lại tạo lần gửi mới; không sửa nội dung đang chờ duyệt.
- Chấp nhận lưu nội dung, phiên bản, tác giả, bằng chứng và quyết định cùng transaction; bấm lại không tạo bản sao.
- Khi bản chính thay đổi, không ghi đè. Quyền bị thu hồi phải chặn cả đề xuất, bình luận và file đang chờ duyệt.
- Không chuyển đổi DB thật hoặc triển khai dịch vụ. Không mở rộng phase 3–6 vào thay đổi này.

## Review Focus

1. Thu hồi membership khi đang mở trang hoặc giữ URL file: request sau bị từ chối từ quyền hiện tại trong DB.
2. Hai quyết định đồng thời/bấm lại: chỉ một phiên bản được tạo; quyết định trái ngược hoặc version cũ trả 409.
3. Bản chính đổi sau khi gửi: giữ snapshot cũ, báo xung đột, tác giả cập nhật rồi gửi lần mới.
4. File/bản nháp chờ duyệt không xuất hiện qua danh mục, search, graph, export hoặc signed blob cũ.
5. Đóng góp từ Vault khác không sửa bản gốc, không chia sẻ toàn Vault nguồn và không dùng chung object key có quyền sở hữu mơ hồ.

## Luồng UI và phạm vi

- Vault có mục “Đóng góp”. Chủ kho thấy danh sách chờ duyệt; contributor thấy đề xuất của mình và “Gửi đóng góp”. Viewer không có thao tác này.
- Form một trang: chọn Ghi chú/Tư liệu, thêm mới hoặc sửa mục hiện có. Ghi chú dùng title/TextArea hiện có; tư liệu có title/file. Cho phép chọn ghi chú/file thuộc Vault của mình để đóng góp, hoặc gửi bản nháp riêng trong Vault đích.
- Trang chi tiết cho thấy tác giả, trạng thái, thời điểm gửi và bản chính/bản đề xuất với nhãn rõ. Ghi chú so sánh văn bản cạnh nhau trên desktop, xếp dọc trên mobile; nội dung dài được xuống dòng. Không thêm thuật toán diff hoặc trình soạn thảo mới.
- File cho thấy tên, loại, kích thước và phiên bản thay thế; tải/xem bằng route riêng có kiểm tra quyền. Không hứa diff nội dung PDF.
- Chủ kho có Chấp nhận/Yêu cầu chỉnh sửa/Từ chối; tác giả có Rút đề xuất khi đang chờ. Yêu cầu chỉnh sửa/từ chối cần lý do để tác giả biết bước tiếp theo.
- Sau yêu cầu sửa hoặc xung đột: mở bản sao riêng để chỉnh, hiển thị bản chính mới, xác nhận cập nhật phiên bản gốc rồi gửi lại. Giữ lần gửi cũ trong lịch sử.
- Một vùng trao đổi tại đề xuất, không realtime/chat mới. Nội dung form còn nguyên khi lỗi; trạng thái gửi/lưu chỉ đổi sau xác nhận server. Không thêm điều hướng nhiều tầng.

## Task 1: Dữ liệu đề xuất và quyền riêng

**Files:** Create `drizzle/0057_vault_contributions.sql`; modify `src/modules/vault/schema.ts`, `src/db/schema.ts` only if new exports require it; create `src/modules/vault/contributions.ts`.

**Interfaces:** Define `ContributionRow = typeof vaultContributions.$inferSelect`; `ContributionKind = 'note' | 'resource'`; `ContributionState = 'draft' | 'pending' | 'approved' | 'changes_requested' | 'rejected' | 'withdrawn'`. `requireContributionAccess(actor: Principal, vaultId: string, contributionId: string, action: 'read' | 'edit' | 'review' | 'comment', runner?: Tx | typeof db)` returns row plus current Vault access.

- [ ] Confirm next migration number at execution; create `vault_contributions` and `vault_contribution_comments`, with Vault/User/target-content/version FKs and indexes on Vault/state/author and comments/contribution/time.
- [ ] Contribution fields: UUID, vaultId, authorId, kind/state, optimistic `version`, nullable targetNoteId/targetResourceId, nullable baseNoteVersion integer/baseResourceVersionId, nullable originNoteVersionId/originResourceVersionId, note/file snapshot, supersedesId, decidedBy/decisionNote, resulting content/version IDs and timestamps. CHECKs match kind, target/base pairs and snapshot shape. Do not change legacy `node_proposals` or immutable history.
- [ ] Note snapshot preserves title/contentMd/summary/tags/links and supporting note/source version IDs. File snapshot preserves server-owned objectKey, filename, MIME, size and checksum. Clients never supply object keys, author, decidedBy or approval result.
- [ ] All requests first require durable Vault access. Draft only author; submitted/history only author or owner. Edit/withdraw only author; review only owner of someone else's pending proposal; comments only author/owner after submission. After revoke no proposal metadata or file is returned.
- [ ] Manually verify migration fresh/upgrade and owner/contributor/viewer/outsider/Core/stale-Principal matrix on disposable DB.

**Verification:** Existing lint/typecheck/boundaries; narrow atomic commit after Task 2 supplies a usable service flow.

## Task 2: Prepare, send, review and immutable content

**Files:** Modify `src/modules/vault/contributions.ts`, `src/modules/knowledge/drafts.ts`, `src/modules/knowledge/support.ts`, `src/modules/storage/service.ts`, `src/modules/storage/object-store.ts` only if a cleanup helper is needed.

**Interfaces:**
- `createContributionDraft(actor, vaultId, input: { kind; targetNoteId?; targetResourceId?; draftId?; originNoteVersionId?; originResourceVersionId?; title?; contentMd?; file?: File }): Promise<ContributionRow>`.
- `saveContributionDraft(actor, vaultId, id, input: { expectedVersion: number; title: string; contentMd?: string; file?: File; refreshBase?: boolean }): Promise<ContributionRow>`.
- `submitContribution(actor, vaultId, id, expectedVersion: number): Promise<ContributionRow>`.
- `withdrawContribution(actor, vaultId, id, expectedVersion: number): Promise<ContributionRow>`.
- `reviseContribution(actor, vaultId, id, expectedVersion: number): Promise<ContributionRow>` creates a new private draft with supersedesId, never mutates submitted snapshot.
- `reviewContribution(actor, vaultId, id, input: { expectedVersion: number; decision: 'approved' | 'changes_requested' | 'rejected'; note?: string }): Promise<ContributionRow>`.

- [ ] Prepare only for contributor in target Vault. Reuse current note title rules, 100 MB cap and format denylist. Reject mismatched target Vault and inaccessible origin. Origin content must belong to a Vault the sender owns; select immutable versions, record provenance and copy snapshot rather than move content.
- [ ] Freeze actual supporting version IDs at send time from selected draft/source version. Do not read mutable draft support during acceptance. Source metadata/links in comparison obey their own read permissions; accepting does not grant access to private evidence sources.
- [ ] File drafts store bytes under server-generated `contributions/` object keys, outside canonical `sources`. Share existing file validation/store-first helper only as needed. Replacing a private file creates a new object; never overwrite a submitted object's bytes.
- [ ] Save/submit/withdraw/revise validate expectedVersion and row-lock the proposal. Submit verifies current target/base and draft version when using a Vault draft. Lock that linked draft in_review; withdraw or request-changes reopens it without deleting the author's text. Save cannot silently mutate pending content. Revise accepts changes_requested/rejected/withdrawn; a conflicted pending proposal must be withdrawn in the same transaction before creating its revision. Rejection also preserves the private author draft.
- [ ] Accept row-locks proposal and existing target, rechecks durable Vault rights inside transaction, checks base version, then writes canonical content/version/support/audit and decision together. Extract minimal transaction helpers from current draft/version code; no copying all publish logic or loosening its owner checks.
- [ ] For notes record original submitter and owner decision separately; retain complete immutable note/support snapshot. For resources create Source/SourceVersion or append a version; retain uploader/provenance. Copy pending bytes to a distinct canonical object key before transaction, with deterministic IDs/key per proposal so retried accept cannot create duplicate versions. DB failure leaves no discoverable canonical content; reuse or clean only objects created by this request.
- [ ] Repeat accept on approved proposal returns original result; conflicting decision or stale update returns 409. Never publish publicly as a side effect. New note has Vault ownership and project_id NULL.
- [ ] Manually verify new/edit/cross-Vault note and resource, unchanged original, frozen evidence, resubmission history, concurrent accept, approval failure rollback and conflict after canonical edit.

**Verification:** `npm test`, existing integration/privacy suites on fresh disposable fixture; no added tests. Commit Tasks 1–2 as one working proposal foundation.

## Task 3: Read, discussion and private file delivery

**Files:** Modify `src/modules/vault/contributions.ts`, `src/modules/application/dto.ts`, `src/modules/application/index.ts`; create `src/modules/application/contributions.ts`; modify `src/app/api/blob/[token]/route.ts` only to reject pending-object namespace.

**Interfaces:** `listContributions(actor, vaultId)` returns authorized DTOs; `getContribution(actor, vaultId, id)` returns proposed snapshot, permission-filtered current content, history and capabilities; `addContributionComment(actor, vaultId, id, body: string)` and `listContributionComments(actor, vaultId, id)`; `getContributionFile(actor, vaultId, id): Promise<{ body: Buffer; contentType: string; filename: string }>`.

- [ ] DTOs omit object keys and private evidence metadata; UI capabilities derived from same durable authorization. Draft list only author; owner list only submitted proposals. File comparison current/proposed uses metadata and separately authorized downloads.
- [ ] Store plain-text comments with author/time; validate trimmed body 1–2000 characters. Preserve comments across revisions using supersedes history, without copying rows. No realtime service, edit/delete comment subsystem or new notifications framework.
- [ ] Pending file downloads use authenticated direct response, `private, no-store`, nosniff and safe Content-Disposition. Do not issue generic signed blob URLs for pending files; blob route rejects `contributions/` keys. Canonical accepted file uses existing authorized Vault download with separate key.
- [ ] Manually verify pending file unavailable to viewer/anonymous/revoked member, including captured URL; accepted resource readable through canonical route; comments never leak outside proposal permissions.

**Verification:** Existing typecheck/lint/boundaries/signing checks; atomic service/facade commit.

## Task 4: API và giao diện đóng góp

**Files:** Create routes under `src/app/api/app/vaults/[vaultId]/contributions/`: `route.ts`, `[contributionId]/route.ts`, `[contributionId]/submit/route.ts`, `[contributionId]/withdraw/route.ts`, `[contributionId]/revise/route.ts`, `[contributionId]/review/route.ts`, `[contributionId]/comments/route.ts`, `[contributionId]/file/route.ts`. Create `src/app/app/vaults/[vaultId]/contributions/page.tsx`, `[contributionId]/page.tsx`, `_components/contribution-form.tsx`, `_components/contribution-actions.tsx`. Modify Vault detail page, shared Vault CSS Module and vi/en locale files.

**Interfaces:** GET/POST collection, GET/PATCH detail, POST submit/withdraw/revise/review, GET/POST comments, GET file. JSON wrappers `{ contribution }`, `{ contributions }`, `{ comments }`; multipart for draft file input. Create/revise/comment return 201, updates/decisions 200; errors use existing 400/401/403/404/409 contracts. No direct DB/schema imports in delivery.

- [ ] Reuse Vault request parsing and application facade. Validate UUIDs, integer expectedVersion, kind/decision values, mutually exclusive origins and required payloads. Do not trust ownership/base version supplied by client; capture current base on draft creation or explicit refresh.
- [ ] Implement the one-page form, owner queue, comparison/history and discussion described above using existing components/MarkdownView. Add only scoped CSS needed for desktop/mobile comparison.
- [ ] Preserve text/file selection and decision reasons on failure. Disable repeated submission while busy. Warn before leaving an unsaved form; report saved state only after server confirmation. Keyboard navigation, focus/close behavior and readable labels follow existing dialogs/pages.
- [ ] Viewer has no proposal controls; contributor has no approve controls; owner edits canonical content through existing owner flow, not self-approval. Hide inaccessible source names and options rather than fabricate empty successful results.
- [ ] Browser-check full submit→request-changes→revise→accept journey, reject/withdraw, file preview/download, stale conflict, missing permissions, keyboard, 390px/1440px and unsaved/error preservation.

**Verification:** Existing lint/typecheck/unit/style/contrast, production build/standalone, manual browser/API matrix. Existing research-intent E2E remains a separate gate; record timing flakiness honestly and do not change tests without user instruction. Atomic API/UI commit after working browser evidence.

## Task 5: Review và bàn giao

**Files:** Create `docs/superpowers/results/2026-10-02-vault-contributions-result.md`; update this plan's checkboxes.

- [ ] Run existing final checks on disposable DB and production runtime. Record exact outcomes, including known phase 1 E2E flakiness; no clean PASS inferred from retries.
- [ ] One fresh independent reviewer checks scoped diff for ownership, pending-file leakage, frozen support, concurrency/idempotency, current permissions and usable UI flow. Fix adopted findings and re-run affected checks.
- [ ] Report commits, manual/browser evidence and limits. Stop only task-created runtime; preserve user data, checkout and dependency state. No automatic merge/deploy of phase 2 unless separately authorized.

## Self-review and execution handoff

Phase 2 requirements mapped: prepare new/edit/cross-Vault content (Task 2), frozen submission/revision/withdrawal (Task 2), owner decisions/conflict/atomicity/idempotency (Task 2), comparison and discussion (Tasks 3–4), current access and revocation (Tasks 1–4). Phase 3 reader/editor/activity, phase 4 views/portfolio, phase 5 public publishing and phase 6 daily chat stay deferred.

Native execution is preserved from phase 1; no need to choose an execution method again. Read this plan before implementation; approval of the overall spec is already recorded. Phase 2 product code starts after review of this concrete plan, per the explicitly invoked Superpowers workflow.
