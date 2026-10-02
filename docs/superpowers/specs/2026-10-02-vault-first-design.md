# WisdomTree — thiết kế lấy vault làm trung tâm

Ngày: 2026-10-02. Trạng thái: chờ người dùng duyệt bản thiết kế.

## 1. Mục tiêu đã thống nhất

WisdomTree là kho ghi chú và tài liệu cho người không chuyên kỹ thuật và người làm nghiên cứu. Mô hình sở hữu và đóng góp tương tự GitHub; trải nghiệm hằng ngày tập trung vào đọc, viết và tìm lại kiến thức. Không có AI trong phạm vi này.

- Mỗi người có thể sở hữu nhiều vault.
- Vault chứa ghi chú, tài liệu như PDF/TXT và thư mục tùy chọn.
- Chủ vault có thể mời cộng tác viên. Đóng góp chỉ vào nội dung chính khi chủ vault chấp nhận.
- Có thể xuất bản toàn bộ vault/dự án hoặc từng ghi chú. Người ngoài không cần tài khoản để đọc nội dung đã xuất bản, giống blog.
- Thảo luận công việc ở cạnh nội dung; chat hằng ngày ở khu vực riêng trong app.
- Ưu tiên chữ dễ đọc, ít thao tác, điều hướng dễ học và không mất nội dung đang viết.

## 2. Cấu trúc và ranh giới

```text
Không gian cá nhân
├── Vault của tôi
│   ├── Vault A
│   │   ├── Thư mục (tùy chọn)
│   │   ├── Ghi chú
│   │   └── Tài liệu
│   └── Vault B
├── Vault được chia sẻ
└── Trò chuyện
```

Không gian cá nhân là màn hình tập hợp, không phải một tầng chứa nội dung hoặc một quyền chia sẻ chung. Vault là ranh giới sở hữu, quyền cộng tác và xuất bản. Một vault có thể phục vụ một dự án hoặc một chủ đề; không thêm tầng “project” bên trong vault.

UI dùng từ Vault thống nhất. Có thể giữ tên Project trong code và đường dẫn hiện có để tận dụng dữ liệu và liên kết. Không chỉ đổi nhãn: quyền sở hữu, nhiều vault và duyệt đóng góp phải hoạt động theo mô hình mới.

## 3. Điều hướng và bố cục

Điều hướng chính gồm “Vault của tôi”, “Được chia sẻ” và “Trò chuyện”. Tìm kiếm luôn dễ thấy, chỉ trả nội dung người dùng có quyền đọc. Màn hình đầu giúp tiếp tục ghi chú/tài liệu gần đây; người dùng có thể vào nội dung ngay từ đây, không phải đi qua trang tổng quan dự án.

Trong vault, cây thư mục, ghi chú và tài liệu ở bên trái; nội dung đang đọc/viết ở giữa. “Tạo ghi chú” và “Thêm tài liệu” luôn hiện. “Đóng góp” có số đang chờ; quản lý cộng tác viên và xuất bản nằm trong khu vực quản lý vault. Các công cụ task, lịch, hoạt động và graph hiện có tiếp tục truy cập được qua mục “Công cụ”, không chiếm điều hướng chính của luồng đọc–viết.

Trên màn hình rộng, có thể mở ghi chú cạnh tài liệu. Trên điện thoại, dùng một vùng nội dung với chuyển đổi “Tài liệu / Ghi chú”, giữ vị trí đọc và bản nháp. Khung thảo luận chỉ mở khi cần; chế độ tập trung ưu tiên nội dung.

## 4. Đọc, lưu tài liệu và tạo ghi chú

### Thêm và đọc tài liệu

“Thêm tài liệu” mở bộ chọn file; kéo thả là thao tác bổ sung. Hiển thị tiến độ và lỗi riêng cho từng file, cho phép thử lại file lỗi. File đã lưu phải đọc hoặc tải xuống được, không chờ trích xuất văn bản hoàn tất. PDF có vùng xem; TXT hiển thị văn bản dễ đọc. Định dạng chưa có trình xem vẫn được tải xuống với thông báo rõ ràng.

Từ tài liệu, “Ghi chú về tài liệu này” mở bản nháp ở cùng ngữ cảnh. App giữ liên kết tới đúng phiên bản tài liệu; liên kết ghi chú cũ không bị đổi khi tài liệu được thay thế. Không bắt nhập tên dự án, mục đích nghiên cứu hay thông tin nguồn đã biết từ ngữ cảnh.

### Viết và kết nối kiến thức

“Tạo ghi chú” mở thẳng trình viết, không có bước chọn loại ghi chú bắt buộc. Có ô tiêu đề, vùng viết và các nút định dạng thông dụng với nhãn dễ hiểu. Người dùng không cần biết cú pháp Markdown; dữ liệu Markdown hiện có vẫn được giữ và đọc đúng. Lựa chọn công cụ soạn thảo được chốt ở kế hoạch triển khai, chỉ phục vụ các định dạng renderer hiện có hỗ trợ.

Tự lưu bản nháp; hiển thị “Đang lưu / Đã lưu / Chưa lưu được”. Có thể viết trước khi đặt tiêu đề; bản nháp chưa có tên phải có nơi tìm lại. Mất mạng hoặc lưu lỗi không được xóa phần đang viết. Rời trang khi nội dung chưa lưu phải có cảnh báo và lựa chọn ở lại. Không báo “Đã lưu” trước khi server xác nhận.

Với chủ vault, “Lưu vào vault” đưa bản nháp thành phiên bản chính; đây không phải xuất bản lên Internet. Với cộng tác viên, thao tác tương ứng là “Gửi đóng góp”. Hiển thị rõ “Bản nháp — chỉ bạn thấy” và trạng thái bản chính để “Đã lưu” không bị hiểu là đã chia sẻ. Bản nháp chưa có tiêu đề lưu được; trước khi đưa vào bản chính hoặc gửi đóng góp cần đặt tiêu đề.

“Liên kết ghi chú” và “Thêm nguồn” cho phép tìm nội dung rồi chọn, không cần nhập ID hoặc cú pháp. Người dùng tự viết nhận định và chọn nguồn hỗ trợ. Danh sách nguồn và ghi chú liên quan mở theo yêu cầu; graph là công cụ phụ.

### Độ dễ đọc

Vùng đọc giới hạn khoảng 65–80 ký tự một dòng, cỡ chữ mặc định tối thiểu 16px và giãn dòng khoảng 1,6. Dùng bộ font, theme và biến giao diện hiện có; tránh thêm font hoặc hệ thống styling mới. Nút có nhãn chữ cho thao tác chính, trạng thái không chỉ dựa vào màu. Hỗ trợ bàn phím, focus rõ ràng và phóng to 200% mà không che nút chính. Thanh công cụ co gọn trên màn hình nhỏ.

## 5. Sở hữu và đóng góp

| Người dùng | Quyền trong vault |
| --- | --- |
| Chủ vault | Quản lý vault, mời/gỡ cộng tác viên, sửa bản chính, duyệt đóng góp, xuất bản và gỡ xuất bản |
| Cộng tác viên | Đọc nội dung được chia sẻ, tạo bản nháp, gửi đề xuất thêm/sửa nội dung, thảo luận |
| Người được mời chỉ đọc | Đọc nội dung được chia sẻ; không sửa hoặc duyệt |
| Khách chưa đăng nhập | Chỉ đọc nội dung đã xuất bản |

Đề xuất có đích đến là một vault cụ thể. Có thể viết trực tiếp bản nháp trong vault đích hoặc chọn ghi chú/tài liệu từ vault của mình để đóng góp. Đóng góp từ vault khác tạo bản nội dung thuộc vault đích sau khi duyệt, ghi nhận tác giả và phiên bản nguồn; không di chuyển hay thay đổi bản gốc.

Vòng đời: “Bản nháp → Chờ duyệt → Đã chấp nhận / Cần chỉnh sửa / Đã từ chối”; người gửi có thể rút đề xuất đang chờ. Mỗi lần gửi đóng băng nội dung và phiên bản gốc của đề xuất. Chỉnh sửa theo yêu cầu rồi gửi lại phải tạo lần gửi mới, không thay đổi âm thầm nội dung đang được duyệt.

Chủ vault xem nội dung hiện tại và phần thay đổi, trao đổi ngay tại đề xuất, rồi chấp nhận, yêu cầu sửa hoặc từ chối. Với file, hiển thị tên, loại, kích thước và phiên bản thay thế; không hứa so sánh nội dung PDF như văn bản. Khi bản chính đã thay đổi kể từ lần gửi, chặn chấp nhận và yêu cầu cập nhật đề xuất, không ghi đè nội dung mới.

Chấp nhận phải lưu phiên bản nội dung, nguồn hỗ trợ, tác giả và quyết định duyệt cùng nhau. Nhấn lại không tạo bản sao. Chỉ chủ vault duyệt đóng góp của người khác; thay đổi trực tiếp của chủ vault vẫn có lịch sử phiên bản. Quyền cộng tác không tự cấp quyền xuất bản. Người bị gỡ quyền không thể tiếp tục đọc nội dung riêng tư, gửi hoặc duyệt đề xuất, hay mở thảo luận của vault.

## 6. Riêng tư và xuất bản

Vault mới mặc định riêng tư. Đọc bản chính trong app tuân theo quyền thành viên; khách chỉ đọc bản xuất bản riêng. Quyền cộng tác và chế độ xuất bản là hai thiết lập độc lập.

Hai chế độ xuất bản:

1. **Chọn ghi chú:** xuất bản từng ghi chú đã có bản chính. Các tài liệu nguồn không tự công khai theo ghi chú.
2. **Toàn bộ vault:** xuất bản toàn bộ ghi chú và tài liệu của bản chính tại thời điểm chủ vault chọn xuất bản, kèm cây nội dung và trang giới thiệu vault.

Trang xem trước liệt kê nội dung sẽ công khai, bao gồm file có thể đọc/tải, trước thao tác “Xuất bản”. Từ riêng tư có thể xuất bản một ghi chú mà không mở phần còn lại của vault. Khi công khai toàn bộ vault, không có ngoại lệ riêng tư bên trong bản chính; muốn giữ lại một số mục thì dùng chế độ chọn ghi chú hoặc một vault riêng.

**Giả định thiết kế để duyệt:** dùng bản xuất bản cố định. Sau khi bản chính thay đổi hoặc có đóng góp mới được chấp nhận, chủ vault dùng “Cập nhật bản công khai”; app không tự công khai nội dung mới. Cách này tiếp nối cơ chế phiên bản xuất bản hiện có.

Khi chuyển chế độ, màn hình xem trước phải nêu nội dung được thêm/gỡ; mỗi nội dung chỉ có một đích công khai chuẩn. “Gỡ xuất bản toàn bộ” gỡ cả trang vault và các mục thuộc bản xuất bản đó; các ghi chú đã được xuất bản độc lập vẫn công khai và phải được liệt kê rõ trước khi xác nhận. Có lựa chọn gỡ tất cả nội dung công khai của vault. Đường dẫn cũ sau khi bị gỡ không tiếp tục phục vụ nội dung từ app.

Trang công khai có tên vault/tác giả, danh sách nội dung, bài đọc, ngày cập nhật bản công khai và liên kết chia sẻ. Không có thao tác sửa hoặc chat cho khách. Bản nháp, đề xuất, danh sách thành viên và chat không thuộc bản xuất bản.

Ghi chú công khai không được làm lộ tiêu đề, nội dung hoặc file nguồn chưa công khai qua liên kết, embed, backlink, tìm kiếm hoặc graph. Nguồn không công khai được thể hiện bằng thông báo chung. File công khai phải có đường phục vụ kiểm tra đúng phiên bản xuất bản; không dùng quyền truy cập file nội bộ cho khách.

## 7. Thảo luận công việc và chat hằng ngày

**Công việc:** luồng thảo luận gắn với ghi chú, tài liệu và đề xuất; mở từ chính nội dung đó. Người có quyền đọc ngữ cảnh mới đọc được thảo luận. Hộp trò chuyện có nhóm “Công việc” để tìm lại các cuộc trao đổi được tham gia, mỗi cuộc có tên vault và liên kết về nội dung.

**Hằng ngày:** khu vực “Hằng ngày” riêng, hỗ trợ nhắn trực tiếp giữa tài khoản trong app và nhóm nhỏ do người tạo chọn thành viên. Chỉ người tham gia đọc được tin nhắn. Không tự thêm cộng tác viên của vault vào nhóm chat hoặc sao chép thảo luận công việc sang đây.

Hai nhóm có số chưa đọc và lựa chọn tắt thông báo riêng. Không tự bật khung chat hoặc lấy focus khi đang viết. Lưu bền vững trước khi báo đã gửi; gửi lỗi có thao tác thử lại và không nhân đôi tin nhắn. Khi tab đang mở, tin nhắn mới và số chưa đọc cập nhật trong tối đa 5 giây ở điều kiện kết nối bình thường. Cơ chế truyền tin được chọn trong kế hoạch triển khai, tận dụng hạ tầng hiện có.

Giới hạn chat lần đầu: văn bản, liên kết, chưa đọc và tắt thông báo. Không thêm gọi thoại/video, bot, feed xã hội hoặc hệ thống kênh phức tạp. Liên kết tới vault riêng trong chat không cấp quyền đọc; người nhận không có quyền không thấy bản xem trước nội dung.

## 8. Tận dụng code hiện có và chuyển đổi

Đã kiểm tra ở checkout ngày 2026-10-02:

- `src/modules/project/schema.ts`: Project gắn với Space; chỉ mục `projects_personal_owner_id_unique` giới hạn một project cá nhân cho mỗi người.
- `src/modules/project/service.ts`: project cá nhân hiện không hỗ trợ quản lý thành viên. Mô hình quyền phải thay đổi để hỗ trợ vault thuộc chủ sở hữu nhưng có cộng tác viên.
- `src/modules/storage/schema.ts`: đã có space, thành viên, thư mục, tài liệu và phiên bản tài liệu.
- `src/modules/knowledge/schema.ts`, `drafts.ts` và `service-mutations.ts`: đã có cây ghi chú, phiên bản, bản nháp và đề xuất; quyền duyệt hiện có chưa đồng nghĩa với chủ vault.
- `src/modules/publication`: đã có bản xuất bản ghi chú bất biến và đọc ẩn danh; `/p` và `/p/[slug]` có thể được tiếp nối. Cần bổ sung bản xuất bản toàn vault và file công khai.
- `src/modules/notify/schema.ts`: đã có comments và thông báo; chưa có mô hình hội thoại/tin nhắn riêng trong schema này.
- UI đọc/viết hiện có focus mode, autosave và kiểm soát xung đột; giữ các bảo vệ này khi thay đổi bố cục.

Giữ kiến trúc Next.js + PostgreSQL hiện có. Không tạo một hệ lưu trữ vault song song với Project/Space. Không bỏ ranh giới quyền bằng cách chỉ gỡ chỉ mục “một project cá nhân”; kiểm tra cả quyền, tạo mặc định, branch và truy vấn danh sách. Mỗi vault mới phải có đúng một chủ sở hữu, và quyền phải được thực thi ở server.

Vault cá nhân hiện có giữ dữ liệu, chủ sở hữu và trạng thái riêng tư. Với project dùng chung hiện có, cần lập danh sách và chọn rõ chủ vault trước khi bật cơ chế chủ sở hữu duyệt; không tự đoán chủ từ người tạo hoặc global admin. Project chưa được chuyển đổi giữ quyền hiện tại, không tự công khai. Lịch sử, liên kết, nguồn hỗ trợ và bản xuất bản cũ phải được giữ. Không dọn code, sửa tài liệu cũ hoặc đụng các thay đổi chưa commit ngoài phạm vi triển khai được duyệt.

## 9. Chia phần triển khai

Đây là thiết kế tổng thể. Chia thành các phần có thể kiểm tra riêng; không làm đồng thời cả overhaul trong một thay đổi lớn:

1. **Vault và đọc–viết:** nhiều vault, quyền chủ sở hữu/thành viên, điều hướng, thêm tài liệu, trình đọc và tạo ghi chú trong ngữ cảnh.
2. **Đóng góp:** gửi vào vault đích, duyệt của chủ vault, so sánh, xử lý xung đột và thảo luận đề xuất.
3. **Xuất bản:** từng ghi chú hoặc toàn vault, trang blog, file công khai, cập nhật/gỡ bản xuất bản.
4. **Chat:** tìm lại thảo luận công việc, nhắn trực tiếp/nhóm hằng ngày, chưa đọc và tắt thông báo.

Phần 1 là phần lập kế hoạch đầu tiên sau khi bản thiết kế được duyệt. Chỉ hiện thao tác sản phẩm khi backend tương ứng hoạt động; không dùng nút giả hoặc màn hình hứa chức năng chưa có. Mỗi phần sau cần kế hoạch riêng bám vào các hợp đồng trong tài liệu này.

## 10. Tiêu chí nghiệm thu

- Một người tạo được ít nhất hai vault độc lập; thành viên của vault A không đọc được nội dung riêng tư của B.
- Từ trong vault, một thao tác mở trình tạo ghi chú hoặc bộ chọn file. Từ tài liệu đang đọc, một thao tác mở ghi chú về tài liệu đó. Số thao tác tính tới vùng nhập liệu, không tính việc gõ, chọn file và xác nhận hệ điều hành.
- Tìm hoặc mở nội dung gần đây đưa thẳng tới nội dung, không qua trang tổng quan. Trình viết dùng được bằng nút định dạng mà không cần cú pháp Markdown.
- Lưu lỗi và xung đột không làm mất nội dung đang viết; trạng thái lưu phản ánh xác nhận thực tế.
- Cộng tác viên không sửa bản chính trực tiếp. Chủ vault duyệt tạo đúng một phiên bản; đề xuất dựa trên bản cũ không ghi đè bản mới.
- Khách không đăng nhập đọc được ghi chú hoặc vault đã xuất bản, nhưng không đọc được bản nháp, chat hay file chưa xuất bản bằng URL trực tiếp hoặc API.
- Xuất bản một ghi chú không tự công khai nguồn của nó; xuất bản toàn vault bao gồm file của bản chính và có xem trước phạm vi rõ ràng.
- Thay đổi bản chính không đổi bản công khai trước thao tác cập nhật. Gỡ xuất bản có hiệu lực cả trên trang đọc và đường phục vụ file.
- Chat công việc và chat hằng ngày có danh sách và quyền đọc riêng; gửi lỗi có thể thử lại mà không tạo tin trùng.
- Kiểm tra luồng bằng trình duyệt trên desktop và điện thoại, bàn phím và phóng to 200%. Chạy các kiểm tra sẵn có phù hợp, gồm typecheck, lint, style-contract, contrast và các test liên quan. Không viết test mới nếu chưa được yêu cầu.
- Phân biệt kết quả kiểm tra tĩnh với bằng chứng tương tác thực tế; không tuyên bố UX đã đạt chỉ từ build hoặc đọc source.

## 11. Nội dung cần xác nhận khi duyệt

Hướng sản phẩm đã được đồng ý trong hội thoại. Bản tài liệu này bổ sung các quyết định cụ thể để xem xét: bản công khai cập nhật thủ công, đóng góp từ vault khác giữ nguyên nguồn gốc, trình viết không yêu cầu Markdown, và chat hằng ngày gồm tin nhắn trực tiếp/nhóm nhỏ. Người dùng duyệt hoặc điều chỉnh tài liệu trước khi lập kế hoạch triển khai phần 1.
