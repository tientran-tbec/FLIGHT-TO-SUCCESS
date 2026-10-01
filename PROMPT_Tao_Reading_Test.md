# PROMPT TẠO IELTS READING TEST — GITHUB PAGES

## CÁCH DÙNG
Chỉ thay **số test** ở dòng đầu tiên, toàn bộ còn lại giữ nguyên, không sửa gì thêm.

---

## PROMPT MẪU

```
Tạo file HTML cho bài IELTS Reading Test [SỐ TEST, ví dụ: 2].

Từ số test trên, tự suy ra toàn bộ thông tin sau (không hỏi lại):
- Số test 3 chữ số: 001=Test 1, 002=Test 2, 003=Test 3... → dùng cho tên câu hỏi
- Folder nguồn: 01. TEST 1-10 > Reading > Test [số test]
- File đề thi: Test [số test].docx
- File đáp án: Key Test [số test].docx
- Tên file HTML output: Test[số test]_Reading.html
- Lưu file HTML vào: 01. TEST 1-10 > Reading > Test [số test]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 1 — ĐỌC FILE ĐỀ THI VÀ ĐÁP ÁN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dùng python-docx đọc toàn bộ XML (paragraphs + tables + toàn bộ w:t elements)
của cả 2 file đề thi và đáp án. Không bỏ sót bất kỳ nội dung nào.

NGUYÊN TẮC BẮT BUỘC — NỘI DUNG GỐC:
- Chép NGUYÊN VĂN 100% nội dung từ file docx vào HTML — không paraphrase, không viết lại,
  không thêm/bớt từ, không đổi từ đồng nghĩa
- Toàn bộ passage, câu hỏi, hướng dẫn, lựa chọn A/B/C/D, tiêu đề, heading
  đều phải khớp từng chữ với file docx gốc
- Nếu đề gốc viết "Write NO MORE THAN TWO WORDS" thì HTML phải ghi đúng
  "Write NO MORE THAN TWO WORDS", không được đổi cách diễn đạt
- Thứ tự passage và câu hỏi giữ nguyên như file docx — không đảo, không gom lại
- Số câu: đếm chính xác từ file docx, lưu vào TOTAL_QUESTIONS, không hardcode 40

Xác định rõ từng Passage (Passage 1, 2, 3):
- Văn bản của từng passage (tiêu đề + toàn bộ nội dung)
- Giữ nguyên định dạng inline trong passage: in đậm (bold), in nghiêng (italic),
  chỉ số trên (superscript như ¹²³), chỉ số dưới (subscript) — render bằng <strong>, <em>, <sup>, <sub>
- Phát hiện và giữ nguyên subheading trong passage (các mục A, B, C... hoặc tiêu đề phụ):
  render bằng <h4> hoặc <strong class="subheading"> để phân biệt với text thường
  Lý do: subheading ảnh hưởng trực tiếp đến dạng Matching Headings
- Câu hỏi thuộc từng passage (câu nào → passage nào)
- Dạng câu hỏi của từng nhóm trong mỗi passage
- Tự đếm tổng số câu hỏi từ file docx (không hardcode 40) — lưu vào biến TOTAL_QUESTIONS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 2 — PHÂN TÍCH DẠNG CÂU HỎI (tự xử lý, không hỏi lại)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tự xác định dạng câu hỏi và áp dụng giao diện tương ứng.
Danh sách dưới đây bao gồm toàn bộ dạng câu hỏi có thể xuất hiện trong IELTS Academic Reading:

DẠNG 1 — Multiple Choice (1 đáp án, A/B/C hoặc A/B/C/D):
→ Radio button, mỗi câu 1 nhóm radio riêng (name="qX")
→ Sau nộp: label đúng tô xanh, label sai tô đỏ

DẠNG 2 — Multiple Choice (nhiều đáp án — chọn 2+ trong danh sách):
→ Checkbox (input type="checkbox")
→ Ghi rõ "Choose TWO/THREE answers" trong hướng dẫn
→ Sau nộp: tô xanh đúng, đỏ sai đã chọn, vàng nét đứt = đáp án đúng bị bỏ sót
→ Tên câu hỏi: Q.XX-YY.TEST[XXX] nếu nhóm dùng chung
→ GIỚI HẠN SỐ Ô ĐƯỢC CHỌN (bắt buộc): wire sự kiện change để tự bỏ tick + hiện cảnh báo đỏ 2.5 giây khi chọn quá max.

  Script Reading nằm cuối <body> nên DOM đã sẵn — wire trực tiếp bằng querySelectorAll, KHÔNG cần DOMContentLoaded:
  ```javascript
  // Đặt cuối script, sau hàm submitTest — wire trực tiếp (DOM đã sẵn sàng)
  function showCheckLimit(name, max) {
    var id = 'chk-limit-' + name;
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.style.cssText = 'color:#e74c3c;font-size:12px;font-weight:bold;margin-top:4px;';
      var grp = document.querySelector('input[name="' + name + '"]');
      if (grp && grp.parentNode) grp.parentNode.appendChild(el);
    }
    el.textContent = '⚠ Chỉ được chọn tối đa ' + max + ' đáp án!';
    clearTimeout(el._t);
    el._t = setTimeout(function(){ el.textContent = ''; }, 2500);
  }
  // Wire từng nhóm checkbox — ví dụ:
  document.querySelectorAll('input[name="q3738"]').forEach(function(inp) {
    inp.addEventListener('change', function() {
      if (inp.checked) {
        var n = document.querySelectorAll('input[name="q3738"]:checked').length;
        if (n > 2) { inp.checked = false; showCheckLimit('q3738', 2); }
      }
    });
  });
  document.querySelectorAll('input[name="q3940"]').forEach(function(inp) {
    inp.addEventListener('change', function() {
      if (inp.checked) {
        var n = document.querySelectorAll('input[name="q3940"]:checked').length;
        if (n > 2) { inp.checked = false; showCheckLimit('q3940', 2); }
      }
    });
  });
  // choose THREE — tương tự với if (n > 3)
  ```

  ⚠ LỖI HAY GẶP: nếu đặt querySelectorAll trước khi DOM render xong → trả về rỗng → không wire được.
  Script Reading luôn nằm cuối body nên DOM đã sẵn — KHÔNG bọc trong DOMContentLoaded.

DẠNG 3 — True / False / Not Given:
→ Radio button 3 lựa chọn: TRUE / FALSE / NOT GIVEN
→ Hiển thị đúng nhãn theo đề gốc (không viết tắt)
→ Sau nộp: tô xanh đúng, đỏ sai

DẠNG 4 — Yes / No / Not Given:
→ Radio button 3 lựa chọn: YES / NO / NOT GIVEN
→ Hiển thị đúng nhãn theo đề gốc
→ Sau nộp: tô xanh đúng, đỏ sai

DẠNG 5 — Matching Headings:
→ Cho sẵn danh sách heading phía trên nhóm câu
→ Giữ nguyên ký hiệu đúng như trong đề gốc (i/ii/iii hoặc A/B/C tùy đề)
→ Dropdown select cho mỗi đoạn/paragraph cần ghép
→ Số lượng heading thường nhiều hơn số đoạn — hiển thị toàn bộ danh sách
→ Sau nộp: tô xanh đúng, đỏ sai

DẠNG 6 — Matching Information:
→ Cho sẵn danh sách (A=Paragraph A, B=Paragraph B...) phía trên nhóm câu
→ Dropdown select cho mỗi câu cần ghép
→ Đáp án có thể lặp lại (nhiều câu cùng chọn 1 paragraph)
→ Sau nộp: tô xanh đúng, đỏ sai

DẠNG 7 — Matching Features:
→ Hiển thị bảng key (A=..., B=..., C=...) phía trên nhóm câu
→ Dropdown select cho mỗi câu cần ghép
→ Sau nộp: tô xanh đúng, đỏ sai

DẠNG 8 — Matching Sentence Endings:
→ Hiển thị danh sách đuôi câu (A, B, C, D...) phía trên nhóm câu
→ Mỗi câu hiển thị phần đầu câu + dropdown select để chọn đuôi câu phù hợp
→ Sau nộp: tô xanh đúng, đỏ sai

DẠNG 9 — Sentence Completion:
→ Hiển thị câu có chỗ trống, input text điền thẳng vào chỗ trống
→ Ghi rõ giới hạn từ (NO MORE THAN TWO WORDS AND/OR A NUMBER)

DẠNG 10 — Summary Completion:
→ Hiển thị đoạn tóm tắt có chỗ trống, input text điền thẳng vào chỗ trống
→ Giữ nguyên layout đoạn văn như đề gốc
→ Ghi rõ giới hạn từ trong hướng dẫn

DẠNG 11 — Summary Completion (chọn từ danh sách — dạng Word Bank):
→ Hiển thị bảng Word Bank (A=..., B=..., C=...) phía trên đoạn tóm tắt
→ Dropdown select cho mỗi chỗ trống (chọn từ Word Bank)
→ Đáp án so sánh theo ký tự key (A/B/C...) đúng như trong Key Test
→ Sau nộp: tô xanh đúng, đỏ sai

DẠNG 12 — Note / Form Completion:
→ Render dạng ghi chú hoặc form, input text điền vào chỗ trống
→ Giữ nguyên cấu trúc layout như đề gốc
→ Ghi rõ giới hạn từ trong hướng dẫn nếu đề có quy định (NO MORE THAN ...)

DẠNG 13 — Table Completion:
→ Render bảng HTML đúng cấu trúc, input text điền vào ô trống trong bảng
→ Ghi rõ giới hạn từ trong hướng dẫn nếu đề có quy định (NO MORE THAN ...)

DẠNG 14 — Flow-chart Completion:
→ Render dạng flow-chart HTML, input text điền vào ô trống
→ Giữ nguyên hướng luồng (top-down hoặc left-right) như đề gốc

DẠNG 15 — Diagram Label Completion:
→ Trích xuất hình ảnh từ word/media/ bằng python-docx, nhúng base64
→ Hiển thị hình căn giữa, max-width: 100%, có border nhẹ để dễ nhìn
→ Bên dưới hình: bảng input text theo số thứ tự label (Label 27: ___, Label 28: ___ ...)
→ Ghi chú rõ phía trên hình: "Refer to the diagram above and complete the labels"
→ Fallback nếu không trích xuất được hình: hiển thị thông báo
   [⚠ Hình ảnh không trích xuất được — vui lòng tham khảo file đề thi gốc]
   (vẫn render đủ ô input bên dưới, không bỏ câu hỏi)

DẠNG 16 — Short Answer Questions:
→ Hiển thị câu hỏi, bên dưới là input text
→ Ghi rõ giới hạn từ (NO MORE THAN THREE WORDS AND/OR A NUMBER)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
XỬ LÝ HÌNH ẢNH TOÀN BỘ (áp dụng cho mọi vị trí trong file docx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Khi đọc file docx bằng python-docx, xử lý hình ảnh theo từng tình huống:

TÌNH HUỐNG 1 — Hình minh họa trong passage (figure, map, chart, graph...):
→ Phát hiện: paragraph chứa w:drawing hoặc w:pict trong phần passage
→ Trích xuất từ word/media/, nhúng base64 ngay tại vị trí tương ứng trong HTML
→ Hiển thị: căn giữa, max-width: 100%, margin: 16px auto
→ Thêm caption nếu có (ví dụ: "Figure 1: ...")
→ Fallback: [⚠ Hình ảnh — vui lòng xem file đề thi gốc]

TÌNH HUỐNG 2 — Hình trong câu hỏi (ví dụ MCQ có ảnh A/B/C/D):
→ Phát hiện: w:drawing trong vùng câu hỏi hoặc lựa chọn
→ Trích xuất và nhúng base64 ngay trong label của radio button / checkbox tương ứng
→ Hiển thị ảnh bên dưới chữ label, max-width: 200px
→ Fallback: [⚠ Hình — xem đề gốc]

TÌNH HUỐNG 3 — Hình trong ô bảng (table cell chứa ảnh):
→ Phát hiện: w:drawing bên trong w:tc (table cell)
→ Trích xuất và nhúng base64 vào đúng ô <td> tương ứng
→ Fallback: [⚠ Hình — xem đề gốc]

QUY TẮC CHUNG cho mọi hình ảnh:
→ Luôn dùng python-docx để lấy file ảnh từ part.blob trong document.part.related_parts
→ Chuyển sang base64: base64.b64encode(blob).decode()
→ Xác định đúng MIME type: image/png, image/jpeg, image/gif, image/wmf → fallback image/png
→ Không bao giờ bỏ qua hoặc xóa hình ảnh trong đề — nếu không lấy được thì hiện thông báo fallback
→ Nếu file docx chứa hình dạng WMF/EMF (vector cũ): chuyển sang PNG bằng Pillow nếu có,
   nếu không thì hiện fallback thông báo
→ Tối ưu kích thước: nếu ảnh base64 > 500KB, dùng Pillow resize về max 1200px chiều rộng
   trước khi nhúng, để tránh file HTML quá nặng làm chậm tải trang

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
XỬ LÝ DẠNG CHƯA BIẾT (FALLBACK)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nếu gặp dạng câu hỏi chưa có trong danh sách trên:
→ Tự phân tích cấu trúc câu hỏi từ file docx
→ Chọn loại input phù hợp nhất:
   - Điền vào chỗ trống → input text
   - Chọn 1 trong nhiều phương án → radio button
   - Ghép / chọn từ danh sách → dropdown select
   - Chọn nhiều đáp án → checkbox
→ Render layout gần giống đề gốc nhất có thể
→ KHÔNG hỏi lại, KHÔNG bỏ qua câu hỏi nào

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 3 — TẠO FILE HTML
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File HTML phải self-contained (không tách CSS/JS ra file riêng).

A. POPUP NHẬP TÊN — hiện khi vào trang, chặn làm bài cho đến khi điền đủ:
   - Ô nhập: Họ và tên + Lớp (bắt buộc cả 2)
   - Nếu bỏ trống → hiện thông báo lỗi, không cho vào bài
   - Sau khi bấm "Bắt đầu làm bài":
     + Lưu vào window._studentName và window._studentClass
     + Ghi nhận window._testStartTime = Date.now()
     + Đóng popup → gọi enterFullscreen()
   - Popup phải cho phép gõ chữ (user-select: text trên các input trong popup)
   - Fullscreen KHÔNG tự kích hoạt lúc load — chỉ kích hoạt từ startExam()

B. TÊN CÂU HỎI — đúng cú pháp:
   Q.01.TEST[XXX] → Q.40.TEST[XXX]
   Ví dụ Test 2: Q.01.TEST002 → Q.40.TEST002
   Ví dụ Test 5: Q.01.TEST005 → Q.40.TEST005

C. LAYOUT CHIA ĐÔI MÀN HÌNH (resizable split panel):
   - Chia màn hình thành 2 cột: TRÁI = Passage, PHẢI = Câu hỏi
   - Mặc định: 50% / 50%
   - Giữa 2 cột có thanh kéo (divider) để học viên tùy chỉnh tỉ lệ bằng chuột
   - Thanh kéo hỗ trợ cả chuột (mousedown/mousemove/mouseup) lẫn cảm ứng (touchstart/touchmove/touchend)
   - Mỗi cột cuộn độc lập (overflow-y: auto)
   - Chiều cao = 100vh trừ header (timer + tab navigation)
   - Responsive: @media (max-width: 768px) → chuyển sang layout dọc (passage trên, câu hỏi dưới),
     ẩn thanh kéo, tab navigation thu gọn hiển thị tên ngắn "P1 / P2 / P3"

D. NAVIGATION 3 PASSAGES — tab chuyển qua lại:
   - 3 nút tab ở đầu trang: "Passage 1" | "Passage 2" | "Passage 3"
   - Bấm tab → hiển thị passage tương ứng bên trái + câu hỏi tương ứng bên phải
   - Tab đang active làm nổi bật (màu khác)
   - Khi chuyển tab: giữ nguyên câu trả lời đã điền, KHÔNG reset
   - Khi chuyển tab: giữ nguyên toàn bộ highlight đã tô trong mỗi passage
   - QUAN TRỌNG — Ẩn/hiện tab bằng CSS display:none / display:block, KHÔNG xóa hoặc
     tái tạo DOM khi chuyển tab. Lý do: nếu xóa DOM thì mất toàn bộ dữ liệu đã điền
     và querySelectorAll khi nộp bài sẽ không đọc được câu hỏi của tab đang ẩn

E. HIGHLIGHT VĂN BẢN — áp dụng cho CẢ 2 PANEL (trái và phải):

   E1. THANH CÔNG CỤ HIGHLIGHT:
   - Một thanh công cụ highlight duy nhất, đặt cố định phía trên header (hoặc ngay dưới tab navigation),
     hiển thị xuyên suốt khi làm bài, gồm:
     + 3 nút màu: Vàng 🟡 / Xanh lá 🟢 / Hồng 🩷 (chọn màu highlight)
     + 1 nút Tẩy 🧹 (eraser mode — click vào vùng đã highlight để xóa)
   - Trạng thái màu đang chọn hiển thị rõ (viền đậm hoặc scale lớn hơn nút còn lại)

   E2. HIGHLIGHT TRONG PASSAGE (panel trái):
   - Bôi chọn text bất kỳ trong passage → tự động tô màu đang chọn
   - Bấm vào vùng đã highlight khi đang eraser mode → xóa highlight đó
   - Highlight lưu trong bộ nhớ session theo passageIndex, không mất khi chuyển tab
   - user-select: text phải được BẬT trong vùng passage

   E3. HIGHLIGHT TRONG VÙNG CÂU HỎI (panel phải):
   - Bôi chọn text trong phần câu hỏi (đề câu, hướng dẫn, văn bản lựa chọn của radio/checkbox)
     → tự động tô màu đang chọn (giống cơ chế passage)
   - Bấm vào vùng đã highlight khi eraser mode → xóa
   - Highlight vùng câu hỏi lưu trong bộ nhớ session theo passageIndex riêng biệt (tránh nhầm với passage)
   - user-select: text phải được BẬT trong vùng câu hỏi (trừ các ô input/select — vẫn hoạt động bình thường)
   - NGOẠI LỆ: KHÔNG cho highlight trong chính các thẻ <input>, <select>, <textarea>
     (người dùng cần gõ vào đó — không dùng highlight)

   E4. HIGHLIGHT TỰ ĐỘNG KHI CHỌN ĐÁP ÁN:
   - Khi học viên chọn radio button (MCQ 1 đáp án, T/F/NG, Y/N/NG):
     + Label của lựa chọn đang được chọn → tô nền cam nhạt (#FFD580)
     + Khi đổi lựa chọn → tô nền cam nhạt chuyển sang lựa chọn mới, lựa chọn cũ trở về bình thường
   - Khi học viên tick checkbox (MCQ nhiều đáp án):
     + Label của checkbox đang được tick → tô nền cam nhạt (#FFD580)
     + Bỏ tick → trở về bình thường
   - Màu cam nhạt này KHÁC với highlight tay (vàng/xanh/hồng) — dùng để phân biệt
   - Implement bằng CSS + JS: khi input change → cập nhật class "selected-answer" trên label cha
     .selected-answer { background: #FFD580; border-radius: 4px; }
   - Sau khi nộp bài: màu cam nhạt bị thay bởi màu xanh (đúng) / đỏ (sai) — KHÔNG giữ lại

   E5. QUY TẮC CHUNG:
   - Tất cả highlight (tay + tự động) KHÔNG ảnh hưởng đến chặn copy — copy event vẫn bị chặn bởi JS
   - Implement highlight tay bằng JavaScript Range + span wrapper:
     class "hl-yellow" / "hl-green" / "hl-pink" cho cả 2 panel
   - CSS highlight tay: .hl-yellow { background: #FFE066; } .hl-green { background: #90EE90; } .hl-pink { background: #FFB6C1; }
   - XỬ LÝ HIGHLIGHT AN TOÀN khi text bôi chọn qua nhiều thẻ HTML (bold, italic, span...):
     Dùng range.extractContents() + DocumentFragment thay vì surroundContents()
     để tránh tạo span lồng nhau không hợp lệ gây vỡ layout

F. BỘ ĐẾM GIỜ — cố định góc trên bên phải, dùng Date.now() (không dùng setInterval đơn thuần):
   - 60 phút đếm ngược, cập nhật mỗi 500ms
   - Timer KHÔNG tự khởi động khi load trang — chỉ bắt đầu đếm khi window._testStartTime đã được ghi nhận
   - Cách implement: var startTime = null; trong IIFE, bên trong tick() kiểm tra:
     if (!startTime) { if (!window._testStartTime) return; startTime = window._testStartTime; }
   - Còn 10 phút → chuyển màu cam/vàng + nhấp nháy
   - Còn 2 phút → chuyển màu đỏ + nhấp nháy nhanh hơn
   - Hết 60 phút → popup cảnh báo + đếm thêm 5 phút → tự động nộp bài
   - Popup có nút "Nộp bài ngay"
   - Sau khi nộp: timer dừng hẳn (window.stopTimer()), ẩn timerBox

G. NỘP BÀI — nút nổi cố định góc dưới bên phải, luôn hiển thị dù đang ở tab nào:
   - Khi bấm "Nộp bài": hiện popup xác nhận trước
     "Bạn có chắc muốn nộp bài? Sau khi nộp sẽ không thể sửa lại."
     Popup có 2 nút: "Xác nhận nộp" và "Quay lại làm bài"
   - Chỉ chạy submitTest() sau khi học viên bấm "Xác nhận nộp"
   - Tô xanh câu đúng, đỏ câu sai
   - Hiện đáp án đúng bên cạnh câu sai
   - Bảng điểm tổng kết gồm:
     + Điểm từng passage riêng: Passage 1: X/[tổng P1], Passage 2: Y/[tổng P2], Passage 3: Z/[tổng P3]
       (Số câu mỗi passage tự đếm từ file docx, không hardcode)
     + Tổng điểm: X+Y+Z / TOTAL_QUESTIONS
     + Ước lượng Band IELTS theo thang chuẩn (xem bảng quy đổi bên dưới)
   - Sau khi nộp: khóa toàn bộ input/select/radio/checkbox, không cho sửa lại
   - Sau khi nộp: dừng timer
   - Hiện báo cáo vi phạm (chuyển tab, mất focus, thoát fullscreen)

   BẢNG QUY ĐỔI BAND IELTS READING (thang chuẩn Academic):
   39-40 = Band 9 | 37-38 = Band 8.5 | 35-36 = Band 8 | 33-34 = Band 7.5
   30-32 = Band 7 | 27-29 = Band 6.5 | 23-26 = Band 6 | 19-22 = Band 5.5
   15-18 = Band 5 | 13-14 = Band 4.5 | 10-12 = Band 4 | 0-9 = Dưới Band 4

   ĐÁNH DẤU ĐÚNG/SAI cho các dạng điền chữ (Dạng 9, 10, 12, 13, 14, 16):
   - Đáp án lưu dưới dạng MẢNG để chấp nhận nhiều cách viết hợp lệ
   - So sánh: chuẩn hóa về chữ thường, trim khoảng trắng trước khi so sánh
   - Nếu học viên điền bất kỳ variant nào trong mảng → tính đúng

   CÁC TRƯỜNG HỢP LINH HOẠT BẮT BUỘC phải đưa vào mảng đáp án:

   1. SỐ VIẾT BẰNG CHỮ VÀ BẰNG SỐ — chấp nhận cả hai:
      Ví dụ: "two" → answers = ["two", "2"]
      Ví dụ: "15" → answers = ["15", "fifteen"]
      Áp dụng cho số từ 1–20 và các số tròn phổ biến (30, 50, 100...)

   2. VIẾT TẮT VÀ VIẾT ĐẦY ĐỦ — chấp nhận cả hai:
      Ví dụ: "St" → answers = ["st", "street"]
      Ví dụ: "Ave" → answers = ["ave", "avenue"]
      Ví dụ: "Jan" → answers = ["jan", "january"]

   3. CÓ/KHÔNG CÓ MẠO TỪ — chấp nhận cả hai nếu không ảnh hưởng nghĩa:
      Ví dụ: "a river" → answers = ["a river", "river"]
      Ví dụ: "the lake" → answers = ["the lake", "lake"]

   4. CÓ/KHÔNG CÓ GẠCH NỐI:
      Ví dụ: "well-known" → answers = ["well-known", "well known"]
      Ví dụ: "large-scale" → answers = ["large-scale", "large scale"]

   5. ĐƠN VỊ ĐO — chấp nhận viết tắt và đầy đủ:
      Ví dụ: "km" → answers = ["km", "kilometers", "kilometres"]
      Ví dụ: "kg" → answers = ["kg", "kilograms"]

   6. RANGE SỐ — chấp nhận cả 2 dạng viết:
      Ví dụ: "150-200" → answers = ["150-200", "150 to 200", "between 150 and 200"]
      Ví dụ: "1990-2000" → answers = ["1990-2000", "1990 to 2000"]

   7. SỐ THẬP PHÂN — chấp nhận dấu chấm và dấu phẩy:
      Ví dụ: "1.5" → answers = ["1.5", "1,5"]

   NGUYÊN TẮC TỔNG QUÁT: Khi đọc đáp án từ Key file, tự suy ra tất cả
   các cách viết hợp lệ mà người học có thể điền đúng nghĩa nhưng khác hình thức.
   Lưu TẤT CẢ variant đó vào mảng. Thà thừa hơn thiếu — không để học sinh bị sai
   oan do lỗi format nhỏ không ảnh hưởng đến nghĩa.

H. CHỐNG GIAN LẬN — đầy đủ các biện pháp sau:

   CSS:
   - user-select: none toàn bộ body
   - NGOẠI LỆ: user-select: text cho input[type="text"], select, textarea
   - NGOẠI LỆ: user-select: text cho vùng passage và vùng câu hỏi (để highlight hoạt động)
   - @media print { body { display: none !important; } }

   JavaScript (viết trong IIFE, export ra window để submitTest gọi được):

   1. Fullscreen bắt buộc:
      - KHÔNG tự kích hoạt lúc load — chỉ gọi enterFullscreen() từ startExam() sau khi đóng popup
      - Thoát fullscreen → hiện overlay cảnh báo + ghi log + đếm fsViolations
      - Overlay có nút "Vào toàn màn hình" gọi enterFullscreen()
      - Lắng nghe cả fullscreenchange lẫn webkitfullscreenchange
      - enterFullscreen() PHẢI bọc requestFullscreen trong try-catch để tránh crash khi browser block:
        ```javascript
        window.enterFullscreen = function() {
          var el = document.documentElement;
          try {
            if (el.requestFullscreen) el.requestFullscreen().catch(function(){});
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
          } catch(e) {}
          fsOverlay.style.display = 'none';
        };
        ```
      ⚠ Nếu KHÔNG bọc try-catch: requestFullscreen() trả về Promise bị reject → uncaught error
        → crash toàn bộ script → startExam() không được định nghĩa → học sinh không vào được bài.

   2. Phát hiện chuyển tab:
      - document.addEventListener('visibilitychange') — khi document.hidden = true
      - Hiện banner cảnh báo đỏ cố định đầu trang, tự ẩn sau 4 giây
      - Đếm tabViolations, ghi log

   3. Phát hiện mất focus cửa sổ:
      - window.addEventListener('blur')
      - Hiện banner cảnh báo, đếm focusViolations, ghi log

   4. Chặn chuột phải: document contextmenu → preventDefault

   5. Chặn phím tắt:
      - F12
      - Ctrl+C, Ctrl+A, Ctrl+S, Ctrl+U, Ctrl+P, Ctrl+V
      - Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+Shift+K
      - Escape (tránh thoát fullscreen bằng phím)

   6. Chặn copy, paste, cut events (kể cả trong vùng passage và câu hỏi):
      - copy → preventDefault (highlight được nhưng không copy ra ngoài)

   7. Chặn drag & drop: dragstart + drop → preventDefault

   8. ~~Phát hiện DevTools~~ — **KHÔNG DÙNG**: so sánh outerWidth/innerWidth kích hoạt sai
      khi học sinh zoom màn hình (Ctrl+- / Ctrl++) → bài thi bị khóa oan.
      Đã xóa khỏi tất cả Tests 1–44. KHÔNG thêm lại vào bất kỳ test nào.

   9. Export:
      - window.stopTimer = function() { timerStopped = true; }
      - window.enterFullscreen = function() { ... }
      - window.getViolationLog = function() { submitted=true; return {...}; }

   10. Thời gian bắt đầu:
      - window._testStartTime được ghi nhận trong startExam() khi học viên bấm bắt đầu
      - KHÔNG ghi Date.now() ở đầu script

I. GỬI KẾT QUẢ LÊN GOOGLE SHEETS sau khi nộp bài:
   URL: https://script.google.com/macros/s/AKfycbyfZgrcZfOw-g5nCLlQ5QyLCCADuct8QRxW31SG8F3IZfkgL0x_3LOoPWBHRFRNiXA1/exec

   ĐÂY LÀ URL PRODUCTION — không thay đổi khi tạo test mới.

   Dùng fetch với mode: 'no-cors' (fire-and-forget, không cần đọc response):
   ```javascript
   fetch(APPS_SCRIPT_URL, {
     method: 'POST',
     mode: 'no-cors',
     headers: { 'Content-Type': 'text/plain;charset=utf-8' },
     body: JSON.stringify(payload)
   }).catch(function(){});
   ```

   Payload JSON gồm:
   - action: "save_result"
   - timestamp: new Date().toISOString()
   - student: window._studentName + " — " + window._studentClass
   - test: "Reading Test [số test]"
   - score: tổng số câu đúng
   - total: TOTAL_QUESTIONS
   - band: chuỗi band IELTS
   - timeTaken: "XX phút YY giây" (tính từ window._testStartTime)
   - p1score: số câu đúng / tổng câu Passage 1 (ví dụ "11/13")
   - p2score: số câu đúng / tổng câu Passage 2
   - p3score: số câu đúng / tổng câu Passage 3
   - tabViol, focusViol, fsViol: số lần vi phạm
   - details: chuỗi Q01:✔(answer) | Q02:✘(answer) | ... cho tất cả câu

   QUAN TRỌNG — Build chuỗi details TRỰC TIẾP từ ANS object và hàm check (KHÔNG dùng DOM query):
   Lý do: DOM query dùng classList.contains('correct') không đáng tin vì class đó có thể chưa được gán
   đúng tại thời điểm build, dẫn đến thiếu câu và hiển thị sai kết quả.

   Cách đúng — sau khi chấm điểm xong, duyệt tuần tự từng câu theo đúng thứ tự Q1→Q40:
   ```javascript
   var detailsParts = [];
   // Với mỗi câu, dùng hàm check đã có (chkSel / chkText / chkRad / getChecked):
   // - Select/Matching: var v = getVal('qN'); var ok = v === ANS['qN'] ? '✔' : '✘';
   // - Text/Fill-in:    var v = getVal('qN'); var ok = v.toLowerCase() === ANS['qN'].toLowerCase() ? '✔' : '✘';
   //   (nếu ANS là mảng: ok = ANS['qN'].some(a => v.toLowerCase() === a.toLowerCase()) ? '✔' : '✘')
   // - Radio (TF/NG, MCQ): var v = getRadio('qN'); var ok = v === ANS['qN'] ? '✔' : '✘';
   // - Checkbox (choose 2/3): KHÔNG gom thành 1 dòng — phải hiển thị từng option riêng:
   //   (function(){
   //     var chosen = getChecked('qXY');          // mảng các value đã chọn
   //     var correct = ANS['qXY'];                // mảng đáp án đúng
   //     var parts = chosen.map(function(v){ return v + (correct.indexOf(v)>=0 ? '✔' : '✘'); });
   //     var missed = correct.filter(function(v){ return chosen.indexOf(v)<0; })
   //                         .map(function(v){ return v + '(đáp án)'; });
   //     detailsParts.push('QX-Y:[' + parts.concat(missed).join(' ') + ']');
   //   })();
   //   → Kết quả ví dụ: Q37-38:[A✔ B✘ D(đáp án)]  (chọn A,B — đúng A,D → B sai, D bỏ sót)
   //   Lý do: gửi "(A,E)" không biết A đúng hay E đúng; cần thấy rõ từng option
   // Mỗi câu đơn: detailsParts.push('Q' + n + ':' + ok + '(' + v + ')');
   var details = detailsParts.join(' | ');
   ```
   Duyệt theo thứ tự nhóm giống như vòng lặp chấm điểm — không dùng querySelectorAll.
```

---

## THÔNG TIN APPS SCRIPT

| Mục | Giá trị |
|-----|---------|
| URL Production | https://script.google.com/macros/s/AKfycbyfZgrcZfOw-g5nCLlQ5QyLCCADuct8QRxW31SG8F3IZfkgL0x_3LOoPWBHRFRNiXA1/exec |
| Sheet ID | 1Xl515oEdU1j-NrptU-3aUKK0fsOa9VylSIrMD7jqikQ |
| Action Reading | save_result → lưu vào sheet "Reading" |

**LƯU Ý**: URL Apps Script thay đổi mỗi lần re-deploy với "New deployment". Nếu re-deploy, phải cập nhật URL trong:
- Tất cả file HTML Listening, Reading, Writing
- Tất cả 3 file PROMPT

Nếu chỉ "Deploy" lại deployment cũ (không tạo mới) thì URL giữ nguyên.

---

## LƯU Ý QUAN TRỌNG

| Mục | Chi tiết |
|-----|----------|
| Chỉ điền 1 lần | Chỉ thay số test ở dòng đầu, toàn bộ còn lại tự suy ra |
| Cú pháp tên câu hỏi | Q.[01-40].TEST[XXX] — Test 2=TEST002, Test 10=TEST010 |
| Dạng câu hỏi | 16 dạng chuẩn + fallback tự động cho dạng mới — không hỏi lại |
| Timer | 60 phút, dùng Date.now(), cập nhật 500ms — không bị throttle |
| Không có audio | Reading không có file mp3 |
| Layout | Chia đôi màn hình resizable — trái: passage, phải: câu hỏi |
| Navigation | 3 tab Passage 1/2/3 — chuyển giữ nguyên câu trả lời và highlight |
| Highlight | Tô màu tay (3 màu) ở CẢ passage lẫn câu hỏi; tự động cam nhạt khi chọn radio/checkbox |
| Highlight kỹ thuật | range.extractContents() + DocumentFragment — KHÔNG dùng surroundContents() |
| Điểm passage | Gửi riêng p1score, p2score, p3score về Google Sheets |
| Đáp án điền | Lưu dạng mảng, so sánh lowercase + trim — chấp nhận nhiều variant |
| Fetch Sheets | mode:'no-cors' — Reading không cần đọc response |
| Không dùng SCORM | File HTML upload thẳng lên GitHub Pages, không cần ZIP |

---

## QUY TRÌNH UPLOAD LÊN GITHUB PAGES

1. Tạo file HTML xong → upload **1 file** lên repo GNOMIO:
   - `Test[N]_Reading.html`
   - (Reading không có file audio đi kèm)
2. Link bài thi:
   `https://tientran-tbec.github.io/GNOMIO/Test[N]_Reading.html`
3. Dán link này vào Gnomio dưới dạng **URL** → **Open in new tab**

---

## CÁC TEST ĐÃ HOÀN THÀNH

| Test | File HTML | Link GitHub Pages | Cú pháp câu hỏi |
|------|-----------|-------------------|-----------------|
| _(chưa có)_ | — | — | — |

---

## CẤU TRÚC REPO GNOMIO TRÊN GITHUB

```
GNOMIO/
├── README.md
├── Test1_Listening.html
├── Audio test 1.mp3
├── Test1_Reading.html      ← thêm dần
├── Test2_Listening.html
├── Audio test 2.mp3
├── Test2_Reading.html      ← thêm dần
└── ...
```

---

## CẬP NHẬT BỔ SUNG (áp dụng từ Test 1 trở đi, 18/09/2026)

Các yêu cầu dưới đây BẮT BUỘC áp dụng cho mọi test Reading tạo mới hoặc tạo lại,
bổ sung/ghi đè lên các mục tương ứng ở trên:

### 1. SỐ THỨ TỰ CÂU HỎI CHO DẠNG COMPLETION
Mọi ô điền dạng Note completion / Table completion / Summary completion / Sentence completion
(kể cả khi nằm lồng trong đoạn văn tóm tắt, bảng, hoặc danh sách gạch đầu dòng) PHẢI hiển thị
rõ SỐ THỨ TỰ câu hỏi ngay trước ô input/select đó (ví dụ: badge số màu xanh dương nhỏ đứng
trước mỗi input). Không được để ô trống không có số — học sinh phải biết ô đó ứng với câu
hỏi số mấy để đối chiếu với answer sheet giấy khi cần.

### 2. CÔNG CỤ "BÚT" VẼ/VIẾT TRỰC TIẾP (real freehand pen tool)
LƯU Ý: đây PHẢI là một cây bút vẽ nét mực thật lên bài (freehand drawing), KHÔNG PHẢI
ghi chú dạng sticky-note/ô vàng contenteditable (phiên bản sticky-note đã bị từ chối
ngày 18/09/2026 vì không đúng yêu cầu — học viên muốn viết/khoanh/gạch chân trực tiếp
lên chữ như dùng bút thật trên giấy).

Bổ sung trên thanh công cụ (cạnh 3 nút highlight và nút Tẩy):
- Nút "🖊️ Bút" để bật/tắt chế độ vẽ.
- 3 nút chọn màu mực (đỏ / xanh dương / đen), chỉ hiện khi chế độ Bút đang bật.
- Nút "🧽 Xóa nét" để xoá nét vẽ (click vào gần nét mực nào thì xoá nét đó).
- Kỹ thuật: mỗi panel Passage/Câu hỏi có một lớp `<svg class="draw-layer">` phủ toàn bộ
  (position:absolute, cao bằng scrollHeight của panel, pointer-events:none khi tắt bút,
  pointer-events:auto khi bật bút) để không cản trở việc bôi đen highlight hay bấm chọn
  đáp án lúc bút đang tắt.
- Khi bật Bút, giữ chuột (mousedown) và di chuyển (mousemove) sẽ vẽ một nét
  `<polyline>` theo đúng đường di chuyển của chuột/ngón tay (hỗ trợ cả touch), nhả chuột
  (mouseup) thì kết thúc nét đó — vẽ được nhiều nét liên tiếp.
- Nét vẽ lưu trong DOM/bộ nhớ session (không cần persist qua reload).
- Khi học viên nộp bài, chế độ Bút tự tắt cùng với các công cụ khác (xem mục 3).

### 3. TRA TỪ VỰNG TRỰC TUYẾN SAU KHI NỘP BÀI (post-submit dictionary lookup)
Ngay khi học viên bấm "Xác nhận nộp":
- TẮT TOÀN BỘ các biện pháp chống gian lận (chặn chuột phải, copy/paste/cut,
  phím tắt, cảnh báo chuyển tab/mất focus/thoát fullscreen) — không preventDefault nữa.
- Ẩn thanh công cụ highlight, hiện thay vào đó dòng thông báo nhỏ:
  "📖 Đã mở tra từ: click đúp vào từ hoặc bôi đen đoạn văn để dịch".
- Double-click vào một từ trong Passage hoặc trong phần câu hỏi → tự động gọi API dịch
  (dùng MyMemory Translation API, free & hỗ trợ CORS:
  `https://api.mymemory.translated.net/get?q=TEXT&langpair=en|vi`), hiển thị kết quả
  trong popup nhỏ ngay cạnh vùng bôi đen/từ được click.
- Bôi đen (select) một đoạn văn bản rồi nhả chuột → cũng tự động dịch đoạn đó tương tự,
  không cần thêm bước bấm nút "Dịch".
- Popup dịch có nút "×" để đóng, tự động định vị trong viewport (không tràn màn hình).
- Nếu không có mạng / API lỗi → hiện thông báo lỗi rõ ràng thay vì treo im lặng.

CẬP NHẬT 18/09/2026 — BẮT BUỘC XỬ LÝ ĐOẠN VĂN DÀI: MyMemory API miễn phí (anonymous, không
key) bị giới hạn/giảm chất lượng khi query dài (khoảng > 450-500 ký tự) — nếu gửi thẳng cả
đoạn dài, kết quả trả về chỉ dịch được 1 câu ngắn rồi bỏ dở, KHÔNG được chấp nhận. Cách xử lý
bắt buộc:
- Khi văn bản được chọn dài hơn ~70 ký tự (coi là "đoạn văn" chứ không phải 1 từ/cụm ngắn),
  chia nhỏ thành các câu (tách theo dấu `.`/`!`/`?`) rồi gộp thành các chunk tối đa ~450 ký
  tự mỗi chunk (không cắt giữa câu, trừ khi 1 câu tự nó đã dài hơn 450 ký tự thì mới cắt
  cứng), dịch TUẦN TỰ từng chunk (Promise chain, không gọi song song ồ ạt), rồi GHÉP LẠI
  đầy đủ bản dịch của toàn bộ các chunk.
- Popup cho trường hợp đoạn dài dùng layout rộng hơn (class `.dict-popup-wide`, max-width
  ~480px thay vì 320px) và có thể scroll dọc (`.dict-body{max-height:56vh;overflow-y:auto}`),
  hiển thị rõ "Đoạn gốc:" (toàn bộ văn bản gốc) và "Bản dịch:" (toàn bộ bản dịch, cập nhật
  dần theo từng chunk kèm chỉ báo "Đang dịch… (x/y)" cho tới khi xong).
- Với văn bản ngắn (≤70 ký tự, ví dụ double-click 1 từ), giữ nguyên popup gọn nhỏ như cũ,
  không cần chia chunk.

### 4. GIẢI THÍCH CHI TIẾT CHO TỪNG ĐÁP ÁN (PHẢI CÓ TRÍCH DẪN NGUYÊN VĂN, SONG NGỮ ANH-VIỆT)
CẬP NHẬT 18/09/2026: bản giải thích sơ sài (chỉ 1 câu diễn giải, không trích dẫn) đã bị
người dùng từ chối vì "quá sơ sài".
CẬP NHẬT 21/09/2026: người dùng yêu cầu giải thích chi tiết HƠN NỮA và phải SONG NGỮ
Anh-Việt (cả hai ngôn ngữ đều phải là phần GIẢI THÍCH LẬP LUẬN đầy đủ, không phải một bên
là bản dịch máy móc của bên kia). Yêu cầu chính thức từ nay:

Với MỖI câu hỏi (1 → TOTAL_QUESTIONS), EXPLANATIONS[n] PHẢI là một dict Python có 3 khoá:
```python
EXPLANATIONS[n] = {
    "quote":    "trích dẫn NGUYÊN VĂN tiếng Anh, copy chính xác từ passage — câu hoặc cụm
                 câu chứa bằng chứng cho đáp án (không diễn giải, không dịch)",
    "expl_en":  "giải thích chi tiết bằng tiếng ANH (thường 2-4 câu): nêu rõ đáp án nằm ở
                 đoạn/câu nào (vd 'Paragraph 5', 'Paragraph C'), cách từ khoá trong câu
                 hỏi được paraphrase từ đoạn văn, và lý do loại các phương án nhiễu khác
                 nếu là câu trắc nghiệm/matching.",
    "expl_vi":  "giải thích chi tiết TƯƠNG ĐƯƠNG bằng tiếng VIỆT — cùng mức độ chi tiết và
                 lập luận như expl_en, không phải bản dịch rút gọn."
}
```
Với nhóm câu "choose TWO letters" (checkbox), viết chung 1 dict cho cả nhóm (key là group
name, vd "q2324"), "quote" có thể gộp 2 đoạn trích dẫn (một cho mỗi đáp án đúng), cả
"expl_en" và "expl_vi" đều giải thích rõ vì sao 2 đáp án đó đúng và các phương án còn lại
sai/không được đề cập.

Tương thích ngược: nếu dict chỉ có khoá "expl" (định dạng cũ, chỉ tiếng Việt) thì
`render_explain_panel()` vẫn hoạt động, coi "expl" là "expl_vi" và không hiển thị khối EN —
nhưng với NỘI DUNG MỚI viết từ nay PHẢI dùng đủ 3 khoá "quote"/"expl_en"/"expl_vi".

- `build.py`'s `render_explain_panel()` tự động render "quote" thành một khối trích dẫn in
  nghiêng có viền trái xanh (class `.equote`), rồi tới khối tiếng Anh (badge xanh dương
  "EN", class `.etext-en`) và khối tiếng Việt (badge xanh lá "VI", class `.etext-vi`) —
  không cần chỉnh sửa gì thêm ở build.py/engine.css, chỉ cần EXPLANATIONS đúng định dạng
  dict {"quote":..., "expl_en":..., "expl_vi":...} khi viết data{N}.py.
- Giải thích được render trong một khối "📘 Giải thích chi tiết đáp án" đặt ở cuối mỗi
  panel câu hỏi (cuối Passage 1 / Passage 2 / Passage 3), ẩn (display:none) cho đến khi
  học viên nộp bài, sau đó hiện ra toàn bộ cùng lúc với kết quả chấm điểm.
- Mỗi mục hiển thị: "Câu N. Đáp án đúng: <answer>" + khối trích dẫn + khối EN + khối VI.

### 5. POPUP KẾT QUẢ SAU KHI NỘP BÀI PHẢI ĐÓNG ĐƯỢC
Modal "Kết quả bài thi" (#resultModal) hiện ra ngay sau khi nộp bài PHẢI có nút
"Đóng — Xem lại bài làm" luôn hiển thị ở cuối modal, bấm vào là ẩn modal
(#resultModal thêm class "hidden") để học viên xem lại bài làm/giải thích đáp án bên
dưới. Lưu ý kỹ thuật: nội dung điểm số được render động bằng cách ghi đè
`innerHTML` — vì vậy nút Đóng KHÔNG được đặt chung một phần tử với vùng nội dung
động đó (ví dụ không được gán cả `id="resultBox"` và class `modal-box` lên cùng một
div rồi chèn nút Đóng vào bằng JS lúc load trang), nếu không nút sẽ bị ghi đè mất
mỗi khi chấm điểm. Cấu trúc đúng: một `.modal-box` cố định chứa 2 phần tách biệt —
`<div id="resultBox">` (chỉ chứa nội dung điểm số, được ghi đè bằng innerHTML) và một
`.modal-actions` cố định bên ngoài chứa nút Đóng (không bao giờ bị ghi đè).

### 6. ĐÃ HOÀN THÀNH TEST 2-5 VỚI ĐẦY ĐỦ TÍNH NĂNG (18/09/2026)
Cả 5 test (Test1_Reading.html … Test5_Reading.html) hiện đã có đầy đủ 4 tính năng bổ sung
(số thứ tự câu hỏi, bút vẽ thật, tra từ điển sau nộp bài có xử lý đoạn dài, giải thích chi
tiết có trích dẫn cho toàn bộ 40 câu mỗi test) và bản popup kết quả đóng được. Đã kiểm tra
tự động bằng Playwright cho cả 5 file: chấm điểm đúng 40/40 khi điền đáp án đúng, bút vẽ tạo
nét thật, nút Đóng hoạt động, mỗi câu đều có khối trích dẫn + giải thích, dịch đoạn dài hiển
thị đầy đủ.

LỖI ĐÁP ÁN GỐC ĐÃ PHÁT HIỆN VÀ SỬA khi viết EXPLANATIONS cho Test 3: câu 14 (Reading Passage 2,
"a mention of negative attitudes towards stadium building projects") — đáp án gốc trong tài
liệu key ghi là "C" nhưng đối chiếu với nội dung bài đọc thì đoạn A mới là đoạn chứa câu "Today,
however, stadiums are regarded with growing scepticism..." Đã sửa ANS[14] từ "C" thành "A" trong
data3.py. Đây là bài học: khi viết EXPLANATIONS có trích dẫn nguyên văn, LUÔN đối chiếu trích dẫn
với đáp án trong ANS — nếu không tìm được câu trích dẫn phù hợp ở đúng đoạn/phương án đã cho là
đáp án đúng, rất có thể đáp án gốc trong tài liệu key bị sai/gõ nhầm, cần kiểm tra lại kỹ trước
khi hoàn thiện EXPLANATIONS, và sửa ANS nếu xác định chắc chắn có lỗi.

CẬP NHẬT 21/09/2026 — GIẢI THÍCH SONG NGỮ ANH-VIỆT CHO CẢ 5 TEST: theo yêu cầu người dùng
("tôi cần giải thích chi tiết hơn nữa, song ngữ Anh-Việt"), toàn bộ EXPLANATIONS của cả 5
test (Test1..Test5, tổng cộng 195 mục) đã được viết lại sang định dạng 3 khoá
{"quote":..., "expl_en":..., "expl_vi":...} như mô tả ở mục 4 phía trên. Engine
(`build.py`/`engine.css`) đã được cập nhật để render cả 2 khối ngôn ngữ với badge màu
riêng (EN xanh dương, VI xanh lá). Đã build lại và kiểm tra tự động bằng Playwright cho cả
5 file: chấm điểm đúng 40/40, bút vẽ + nút Đóng modal hoạt động, mỗi câu hiển thị đủ trích
dẫn + giải thích EN + giải thích VI, và tra từ điển đoạn dài vẫn hiển thị đầy đủ bản dịch
theo chunk. Khi cần viết thêm EXPLANATIONS cho test mới, LUÔN dùng định dạng 3 khoá này,
không quay lại định dạng cũ chỉ có "expl".

### GHI CHÚ KỸ THUẬT
- Các thay đổi trên đã được đóng gói vào phần engine dùng chung (CSS/JS nhúng trong
  mỗi file HTML) — khi tạo test mới, đảm bảo dùng lại engine đã cập nhật này (có sẵn
  nút Bút vẽ freehand thật, badge số câu hỏi cho completion, dict lookup post-submit,
  khối EXPLANATIONS cho từng câu, và popup kết quả đóng được) thay vì bản engine gốc
  trước 18/09/2026 hoặc bản sticky-note tạm thời đã bị thay thế.
- Test 1 đã được cập nhật đầy đủ theo 4 mục trên (xem Test1_Reading.html) và dùng làm
  mẫu tham chiếu khi cập nhật Test 2–5.


## CẬP NHẬT — HOÀN THÀNH TEST 6-10 (giải thích song ngữ Anh-Việt chi tiết)

Đã hoàn thành xây dựng Test6_Reading.html đến Test10_Reading.html bằng đúng engine dùng chung
(build.py + engine.css + engine.js) và đạt cùng chuẩn chất lượng với Test 1-5:

- Đầy đủ 40 câu hỏi/test, đã kiểm tra bằng smoke_full.py: 40/40 điểm, Band 9.
- Bút vẽ SVG (pen tool), modal kết quả đóng được, dịch từ điển có chia đoạn cho bài dài — đã kiểm tra bằng smoke_pen_modal.py và smoke_explain_dict.py, tất cả PASS.
- GIẢI THÍCH SONG NGỮ ANH-VIỆT chi tiết cho toàn bộ 40 câu mỗi test, theo định dạng:
  EXPLANATIONS[n] = {"quote": "<trích dẫn nguyên văn tiếng Anh>", "expl_en": "<giải thích chi tiết tiếng Anh>", "expl_vi": "<giải thích chi tiết tiếng Việt>"}
  Cả expl_en và expl_vi đều chứa lập luận đầy đủ, độc lập (không chỉ là bản dịch qua lại của nhau).

Nội dung nguồn các test:
- Test 6: Alexander Henderson (1831–1913) / Should we try to bring extinct species back to life? / How to make wise decisions
- Test 7: Could urban engineers learn from dance? / I contain multitudes / Insight or evolution?
- Test 8: The White Horse of Uffington / A second attempt at domesticating the tomato / An ideal city
- Test 9: The Dead Sea Scrolls / Living with artificial intelligence / The power of play
- Test 10: Stonehenge / Saving bugs to find new drugs / Why fairy tales are really scary tales

Vậy là cả 10 test (Test1_Reading.html → Test10_Reading.html) hiện đã đồng bộ, dùng chung 1 engine,
và đều có giải thích song ngữ Anh-Việt chi tiết, trích dẫn nguyên văn cho từng câu.

## CẬP NHẬT — WEB TEST THEO DẠNG CÂU HỎI (04_WebTest_TheoDang/)

Đã tạo 74 web test riêng lẻ, mỗi file chỉ gồm 1 passage + các câu hỏi thuộc
đúng 1 dạng, nằm trong `04_WebTest_TheoDang/<TenDang>/Test{N}_Passage{P}_{DANG}.html`:

- Completion/     — 30 file, 158 câu (Sentence/Note/Table/Summary completion)
- Matching/        — 14 file, 94 câu (heading/info/feature/people/sentence-ending)
- TrueFalseNotGiven/ — 12 file, 72 câu
- YesNoNotGiven/    — 6 file, 28 câu
- MultipleChoice/   — 12 file, 48 câu (gồm cả chọn TWO/THREE đáp án)

Engine riêng: `engine_single.js` (bản rút gọn từ engine.js — bỏ 3-tab, 1 passage
duy nhất) + `build_single.py` (template 1 passage). Khác với Test1-10:
- Thời gian làm bài: 30 phút (không phải 60), hết 30 phút → 5 phút gia hạn → tự nộp.
- Có popup cảnh báo bắt buộc đóng lúc đã làm được 20 phút (`#warn20Modal`,
  `dismissWarn20()`), không tự đóng, không ảnh hưởng thời gian làm bài.
- Badge hiển thị dạng câu hỏi + nguồn (Test X — Passage Y: tên bài) thay cho 3 tab.
- Band hiển thị là "Band tham khảo" (quy đổi theo thang 40 câu) vì mỗi bài chỉ có
  1 passage (vài câu), không phải band IELTS thật.

Google Sheets — 2 action mới (đã thêm vào code.gs, giữ nguyên toàn bộ code cũ
Listening/Reading/Writing/Speaking/Teacher Portal):
- `save_result_bytype` → ghi vào sheet **"KetQua_TheoDang"**: timestamp, học viên,
  dạng câu hỏi, nguồn Test-Passage, điểm, band tham khảo, thời gian làm bài, vi phạm, chi tiết từng câu.
- `log_event` → ghi vào sheet **"NhatKyThaoTac"**: mọi mốc thao tác của học viên từ
  lúc vào bài đến lúc rời trang — enter, fullscreen_exit, tab_switch, focus_loss,
  warning_20min_shown/dismissed, time_up, auto_submit_timeout, submit,
  exit_page (rời khi CHƯA nộp, gửi qua sendBeacon), exit_after_submit — kèm
  timestamp và thời gian đã trôi qua.

Code sinh file: `extract_by_type.py` (phân loại 400 câu hỏi của 10 test thành
5 dạng, output by_type.json) → `gen_all_single_tests.py` (build 74 file HTML từ
by_type.json + dataN.py gốc, tái dùng y nguyên PASSAGES/group HTML/UNITS/ANS/
EXPLANATIONS của mỗi test, chỉ lọc theo test/passage/dạng).
Đã kiểm tra tự động cả 74/74 file bằng Playwright: điền đúng đáp án thì ra 100%, 0 lỗi JS.

Muốn tạo thêm dạng/test mới: chạy lại `python3 gen_all_single_tests.py <tfng|ynng|mcq|matching|completion>`
trong thư mục làm việc (cần có đủ data1.py..data10.py, build.py, build_single.py,
engine.css, engine_single.js, by_type.json cùng chỗ).

---

## GHI CHÚ VỊ TRÍ FILE (cập nhật 01/10/2026 — sau khi dọn gọn thư mục)

Thư mục `03. READING` đã được sắp xếp lại cho gọn gàng, các đường dẫn dưới đây
thay thế mọi tham chiếu vị trí cũ (ở gốc thư mục) trong tài liệu phía trên:

- `01_De_Goc_Word/` — các file Word đề gốc (NEW - TEST 1-5.docx, TEST 6-10.docx, TRỘN KEY 20 TEST.docx)
- `02_WebTest_FullTest/` — 10 file Test1_Reading.html … Test10_Reading.html (bản đầy đủ 3 passage)
- `03_TaiLieu_TheoDang_Word/` — 5 file Word tổng hợp theo dạng câu hỏi (trước đây ở "Theo dang cau hoi/")
- `04_WebTest_TheoDang/` — không đổi (74 web test theo dạng + code.gs)
- `05_HUONG_DAN/` — không đổi (file Word hướng dẫn đổi Sheet/Apps Script/GitHub)

`update_links.py` và `push_github.bat` vẫn nằm ở thư mục gốc `03. READING` và hoạt động
bình thường (quét toàn bộ thư mục con), không cần sửa gì khi cấu trúc trên thay đổi.
