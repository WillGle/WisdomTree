# Vault foundation — kết quả và giới hạn kiểm chứng

Ngày: 2026-10-02. Triển khai phase 1 theo plan đã duyệt; không có AI. Mã nguồn đã commit, nhưng gate E2E chưa ổn định nên chưa tuyên bố toàn bộ validation đạt.

Branch: `feat/vault-foundation-20261002`.
Worktree: `/tmp/wisdomtree-vault-phase1-hnk044jr/worktree`.
Baseline: `598caeb`. Phạm vi mã sản phẩm: `598caeb..3344a9f`.

## Đã triển khai

- Vault độc lập, nhiều Vault mỗi người, chủ kho và thành viên; liên kết nhiều Project/Vault không cấp quyền truy cập.
- API tạo/lưu ghi chú, bản nháp riêng theo tác giả, chốt bản chính bởi chủ kho; optimistic version chống ghi đè thay đổi mới.
- API lưu tư liệu theo cơ chế file hiện có. Tải file riêng kiểm tra quyền tại thời điểm nhận dữ liệu; URL đã cấp bị từ chối sau khi thu hồi quyền.
- Chặn quyền Vault trên các đường cũ: ghi chú, lịch sử, bằng chứng, dịch, search/graph, danh mục wiki, liên kết deadline, publication targets, tài nguyên và export. Core/admin không tự vượt quyền Vault.
- Giao diện danh sách Của tôi/Được chia sẻ, tạo và mở Vault, danh mục nội dung thật, quản lý tên/mô tả/thành viên/liên kết Project. Nút quản lý chỉ hiện cho chủ kho; lỗi giữ dữ liệu đã nhập.
- CSS Module nhỏ cho khoảng cách và xuống dòng trên màn hình nhỏ; nhãn tư liệu PDF/Văn bản thay MIME kỹ thuật. Dùng lại các thành phần và token hiện có.

Giao diện phase này chỉ liệt kê ghi chú/tư liệu; đọc, chỉnh sửa và tải lên trực tiếp trong Vault sẽ đến ở phase 3. Không có nút dẫn đến chức năng chưa triển khai.

## Kiểm chứng

| Gate | Kết quả |
| --- | --- |
| `npm test` | PASS: lint, typecheck, 20 file unit, boundaries, signing, time, contrast và style contract |
| `test:integration` | PASS: 29 file, DB dùng thử được reseed trước suite |
| `test:usecase` | PASS: 3 file |
| `test:privacy` | PASS: 2 file |
| Production build | PASS |
| `test:standalone` | PASS: CSS và font phục vụ được |
| `test:e2e -- research-intent.spec.ts` | 7 passed / 1 failed; đo bounding box khi trang đang tải |
| Chạy xác nhận cùng suite với `--retries=1` | Exit 0: 6 passed / 2 flaky; hai kiểm tra bố cục 390px và 1440px đạt khi retry. Không tính là clean PASS |
| Vault browser thủ công trên production | PASS ở 390px/1440px: không tràn ngang, không page error; owner settings vắng với contributor; PDF upload 201 và download đúng bytes, `private, no-store` |

Các kiểm tra bố cục hiện có gọi `boundingBox()` rồi dùng kết quả mà chưa đợi phần tử hiển thị; ảnh lỗi có trạng thái Đang tải. Đây là giới hạn kiểm chứng cần xử lý riêng; chưa chứng minh lỗi flaky đã tồn tại ở baseline. Không sửa hoặc thêm test theo yêu cầu người dùng.

Kiểm tra thủ công trước đó: tạo/mở hai Vault; đổi tên; giữ input khi stale-save; thêm/gỡ viewer; Escape và điều khiển bàn phím; liên kết Project. API kiểm tra 400/401/403/404/409, idempotency, sai Vault/resource/version, contributor/viewer/outsider/Core, Principal cũ sau revoke, Project manager không có Vault, hai Vault trùng tên, nhiều liên kết không tăng quyền. Vault mới không tạo Project giả; ghi chú mới có `project_id NULL` và đúng chủ sở hữu.

Review độc lập hoàn tất phạm vi 47 file trước các sửa cuối. Bảy phát hiện được xử lý; các script dùng thử ghi lại trước/sau: search/translation/publication/deadline không còn lộ nội dung; EN draft bị từ chối trước mutation thay vì trả sai VI version; capability DTO không quảng cáo quyền upload/publish/steward bị từ chối. Quyền Activity/Task/People giữ nguyên.

## Migration

- Migration `0056_vault_foundation.sql`: PASS cả nâng cấp schema trước đó và chuỗi migration trên DB mới.
- Mapping rõ một Project trong DB dùng thử: 4 notes, 0 drafts, 3 resources; owner chưa có membership được thêm manager; 2 thành viên cũ thành 3. Dry-run, apply, apply lại đều kiểm chứng; không tạo bản sao.
- Giữ tổng fixture: 4 notes, 30 sources (10 digital), 10 source versions, 4 note versions; ID và object key không thay đổi.
- Mapping không hợp lệ rollback cả danh sách, không để lại mapping từng phần.
- Fixture riêng có public revision: anonymous snapshot, nội dung phiên bản lịch sử và bằng chứng còn nguyên sau mapping.
- Chưa đọc/audit DB sản xuất. Số Shared Project cần xác nhận chủ chưa biết; phải cung cấp mapping chủ rõ ràng trước chuyển đổi. Không migrate/apply DB thật.

## Quyết định giữ đơn giản

- Dùng Space/member/storage/draft hiện có; Vault chỉ bổ sung quyền sở hữu và liên kết, không nhân đôi metadata hay cây ghi chú.
- Một helper nhỏ cho parsing/error của API, một CSS Module; không thêm framework, dependency hoặc lockfile.
- Các file query/access phụ được sửa vì có đường truy cập nội dung Vault, kể cả service chưa có delivery caller. Export toàn cục loại nội dung Vault để tránh xuất nội dung riêng sang repository chung.
- API draft Vault mới hỗ trợ tiếng Việt; EN draft đã ánh xạ giữ trong luồng dịch cũ, không bị commit thành bản VI.
- Baseline UI được atomic commit trước triển khai theo yêu cầu; không trộn vào feature. Không thêm test/assertion mới: thiếu regression bền vững cho hành vi mới là hạn chế đã biết.

## Bàn giao

Các commit sản phẩm: `aef3a0c`, `34c52ad`, `6ac9f8d`, `112464e`, `3344a9f`. Giữ branch/worktree để review; không merge/push/deploy trong phase này. Checkout gốc giữ tại `598caeb`.

Bằng chứng cục bộ: `/tmp/wisdomtree-vault-phase1-hnk044jr/`, gồm `final-*.log`, log mapping và kiểm tra trước/sau quyền; ảnh ở `browser/final-vault-390.png`, `browser/final-vault-1440.png`, `browser/settings-390.png`. Không đưa token, DSN hoặc `.env` vào báo cáo/repository. Artifact dùng thử nằm trong `/tmp`, không phải bộ regression được version hóa.

Các phase còn lại: mô hình Project/Activity và portfolio; trải nghiệm đọc/ghi chú/tư liệu; đóng góp và duyệt; public Vault/note; chat công việc/tán gẫu. Tổng thể overhaul chưa hoàn thành. Gate E2E ổn định còn chưa đạt; các gate khác và Vault browser thủ công có bằng chứng riêng ở trên.
