# Tài liệu tham khảo: Kiến trúc hệ thống bài luyện tập / đề thi online

> Đúc kết từ dự án "IELTS Reading Online" (10 bài test, 400 câu hỏi, 74 web test theo dạng, chấm tự động, ghi kết quả về Google Sheet). Dùng làm tài liệu khởi điểm cho dự án mới: **web bài luyện tập + đề kiểm tra cho học sinh lớp 6–12**, dựa theo Unit sách giáo khoa, có file nghe.

---

## 1. Mô hình tổng thể

Hệ thống gồm 3 lớp tách biệt rõ ràng — đây là nguyên tắc quan trọng nhất, nên giữ lại cho mọi dự án tương tự:

1. **Lớp dữ liệu** — nội dung đề bài, đáp án, bài đọc/nghe, được viết dưới dạng biến Python đơn giản (không phải JSON cứng nhắc, không phải hard-code HTML lặp lại).
2. **Lớp "build"** — các hàm Python sinh ra HTML tương tác từ dữ liệu ở lớp 1. Một hàm = một kiểu câu hỏi (điền từ, trắc nghiệm, nối câu, đúng/sai...).
3. **Lớp "engine" runtime** — 1 file CSS + 1 file JS dùng chung cho **mọi** trang sinh ra: xử lý timer, chấm điểm, chống gian lận, gửi kết quả về Google Sheet, hiệu ứng tô màu/highlight/từ điển tra nhanh...

Lợi ích: sửa 1 lỗi hiển thị hay thêm 1 tính năng (vd: thêm cảnh báo 20 phút) → sửa đúng 1 file engine, áp dụng ngay cho hàng chục/hàng trăm trang mà không phải sửa tay từng file.

**Áp dụng cho dự án lớp 6–12:** lớp dữ liệu sẽ tổ chức theo **Unit** (thay vì theo Test), mỗi Unit có: nội dung bài học trích từ SGK, bộ câu hỏi luyện tập, đáp án, và (mới) **file âm thanh** cho phần nghe.

---

## 2. Lớp dữ liệu — quy ước đặt tên

Trong dự án cũ: `data1.py` ... `data10.py`, mỗi file khai báo:

```python
PASSAGES = [...]        # list HTML từng bài đọc
QUESTIONS = [...]       # (không dùng trực tiếp, chỉ để tham khảo)
UNITS = [...]           # list dict mô tả từng câu hỏi: {"n": 5, "type": "radio"/"text"/"select"/"checkboxGroup", ...}
ANS = {...}             # đáp án đúng, key = số câu hoặc tên nhóm checkbox
EXPLANATIONS = {...}    # giải thích đáp án (hiện khi xem lại bài)
CHECKBOX_GROUPS = [...] # cấu hình riêng cho câu hỏi chọn nhiều đáp án
g1a, g1b, g2a, ...       # biến HTML từng nhóm câu hỏi (để build.py ghép lại theo thứ tự tuỳ ý)
```

**Gợi ý đặt tên cho dự án mới** (theo Unit, có Listening):

```python
# unit6.py
READING_TEXT = "..."          # hoặc TEXTBOOK_EXCERPT nếu trích SGK
AUDIO_FILE = "unit6_listen1.mp3"   # đường dẫn file nghe
UNITS = [...]
ANS = {...}
EXPLANATIONS = {...}
```

Mỗi Unit là 1 file riêng — dễ giao cho người khác biên soạn song song, dễ version control (mỗi Unit 1 commit), dễ tìm lỗi.

---

## 3. Lớp build — các hàm dựng câu hỏi dùng chung

Các hàm "renderer" trong `build.py` — mỗi hàm nhận dữ liệu thô, trả về HTML đã gắn sẵn `id`, `name` để JS nhận diện:

| Hàm | Dùng cho |
|---|---|
| `text_item()` | Điền từ vào chỗ trống (input text) |
| `radio_item()` | Trắc nghiệm 1 đáp án |
| `checkbox_group()` | Trắc nghiệm nhiều đáp án |
| `select_item()` | Nối câu / chọn từ dropdown (matching, heading) |
| `tfng_item()` / `ynng_item()` | Đúng/Sai/Không có thông tin |
| `note_html()` | Hoàn thành ghi chú/sơ đồ (note completion) |
| `headinglist_box()` / `wordbank_box()` / `keylist_box()` | Hộp liệt kê để học sinh tra cứu khi làm bài nối câu |
| `qgroup_open()` / `qgroup_close()` | Khung bọc 1 nhóm câu hỏi + phần hướng dẫn |

**Gợi ý thêm cho dự án mới:** 1 hàm `audio_player(src, max_plays=None)` — nhúng thẻ `<audio>`, có thể giới hạn số lần nghe lại (phù hợp đề kiểm tra nghe thực tế), ghi log số lần bấm play vào hệ thống theo dõi thao tác (mục 6).

`build_page()` / `build_single_page()` ghép: header + passage/audio + các nhóm câu hỏi + engine CSS/JS thành 1 file HTML hoàn chỉnh, tự tính `total_q` từ chính dữ liệu truyền vào (tránh lệch số câu khi sửa đề).

---

## 4. Engine runtime (file CSS/JS dùng chung)

Tính năng cốt lõi nên giữ nguyên cho dự án mới:

- **Timer đếm ngược** + **mốc cảnh báo bắt buộc đóng** (vd còn 20 phút hiện popup, học sinh phải bấm "Đã hiểu" mới tiếp tục được, không tự tắt, không dừng giờ).
- **Chấm điểm tức thì** khi nộp bài — so khớp với `ANS`, hiện điểm + xem lại đáp án/giải thích.
- **Chống gian lận cơ bản**: phát hiện chuyển tab (`visibilitychange`), mất focus cửa sổ, thoát fullscreen — đếm số lần vi phạm, gửi kèm vào kết quả.
- **Gửi dữ liệu về Google Sheet** qua `fetch()` khi nộp bài, và `navigator.sendBeacon()` khi đóng trang/thoát giữa chừng (đảm bảo không mất dữ liệu log dù học sinh tắt tab đột ngột).
- **2 biến thể engine**: bản nhiều bài trong 1 trang (tab chuyển bài) và bản 1 bài/1 trang đơn giản hơn — tách timer/logic theo đúng nhu cầu từng loại trang, tránh dùng chung 1 engine phức tạp cho mọi trường hợp.

**Thêm cho dự án mới (Listening):** engine cần thêm trạng thái theo dõi `audio_play_count` mỗi file nghe, tuỳ chọn khoá không cho tua (`seeking` event → kéo về vị trí cũ) nếu muốn mô phỏng thi thật.

---

## 5. Phân loại nội dung theo nhiều chiều

Dự án cũ có 1 bước quan trọng: viết script (`extract_by_type.py`) **đọc lại** toàn bộ dữ liệu đã có, phân loại 400 câu hỏi thành 5 dạng (Completion/Matching/TFNG/YNNG/MCQ), rồi từ đó **tự động sinh ra** hàng loạt trang web mới theo từng dạng — mà không phải soạn lại nội dung.

**Áp dụng cho dự án lớp 6–12:** nếu về sau muốn có thêm trang "luyện tập theo chủ điểm ngữ pháp" (thay vì theo Unit), hoặc "ngân hàng câu hỏi theo mức độ Nhận biết/Thông hiểu/Vận dụng", chỉ cần gắn thêm 1 trường phân loại (`category`, `difficulty`...) vào mỗi câu hỏi trong `UNITS`, rồi viết script lọc tương tự — không phải soạn đề lại từ đầu.

⚠️ **Lỗi từng gặp, cần tránh:** khi dùng regex để trích nội dung trong các thẻ `<div>` lồng nhau, regex "lười" (`.*?</div>`) sẽ dừng ở `</div>` đóng đầu tiên gặp được, cắt cụt nội dung của div cha. Luôn viết hàm đếm số lượng `<div>` mở/đóng để tìm đúng thẻ đóng tương ứng (gọi là "balanced div"), đừng dùng regex đơn giản cho HTML lồng nhau.

---

## 6. Google Apps Script backend (lưu kết quả về Google Sheet)

Mẫu kiến trúc `doPost(e)` dạng **router theo `action`**:

```javascript
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var action = data.action;
  if (action === "save_result")      return saveResult(data);
  if (action === "save_result_bytype") return saveResultByType(data);
  if (action === "log_event")        return logStudentEvent(data);
  if (action === "test_enter")       return ...;
  // ... thêm action mới ở đây khi cần, không đụng tới các action cũ
  return jsonResp({status: "unknown action"});
}
```

Mỗi action ghi vào **1 sheet riêng biệt** (tự tạo sheet + dòng tiêu đề nếu chưa có — hàm `getOrCreateXxxSheet()`), tránh dồn mọi loại dữ liệu vào 1 sheet duy nhất:

- Sheet kết quả làm bài (điểm, thời gian, vi phạm...)
- Sheet nhật ký thao tác (vào/ra/chuyển tab/cảnh báo...) — rất hữu ích để giáo viên biết học sinh có làm nghiêm túc không
- Sheet riêng cho từng loại hoạt động nếu nghiệp vụ khác nhau nhiều (nộp bài Viết cần chấm bằng AI, nộp bài Nói cần lưu file âm thanh lên Drive...)

Cấu hình đặt ở đầu file, dễ đổi:
```javascript
var SHEET_ID       = "...";                 // ID Google Sheet lưu dữ liệu
var TEACHER_EMAILS = ["..."];                 // email giáo viên (nếu có phần duyệt/chấm)
var CLAUDE_API_KEY = "...";                   // nếu dùng AI chấm bài tự luận
```

**Gợi ý cho dự án mới:** nếu có phần tự luận (viết đoạn văn, trả lời câu hỏi mở cho môn Văn/Sử/Địa...), có thể tái dùng nguyên khối "gọi Claude API chấm bài" từ dự án cũ — chỉ cần đổi prompt chấm điểm cho phù hợp cấp học.

---

## 7. Script tự động sinh hàng loạt trang

Thay vì build lại từng trang thủ công, viết 1 script trung tâm (`gen_all_*.py`) **tái sử dụng HTML gốc đã có sẵn** (không build lại từ dữ liệu thô) để đảm bảo các trang sinh ra giữ nguyên 100% tính tương tác/định dạng của bản gốc. Với dự án mới: 1 script tương tự có thể sinh, ví dụ, "74 web test theo dạng" → đổi thành "toàn bộ bài luyện tập theo Unit × theo kỹ năng (Nghe/Đọc/Viết/Từ vựng/Ngữ pháp)".

---

## 8. Kiểm thử tự động (Playwright)

Script smoke test: mở từng file HTML bằng trình duyệt ảo, **tự điền đáp án đúng** (lấy từ chính `ANS` nhúng trong trang), bấm nộp bài, kiểm tra điểm có ra 100% không, có lỗi JavaScript nào không. Chạy hàng loạt (vd quét cả 74 file) chỉ trong vài phút — phát hiện ngay nếu có trang nào bị thiếu câu hỏi, sai đáp án, hoặc lỗi hiển thị, **trước khi** giao cho học sinh làm thật.

**Luôn làm bước này** trước khi công bố bất kỳ trang luyện tập/đề kiểm tra nào — chi phí thấp (vài phút chạy script), nhưng tránh được việc học sinh làm phải đề lỗi.

---

## 9. Quản lý cấu hình linh hoạt (đổi Sheet/API không phải sửa tay từng file)

Script `update_links.py`: nhận vào 1 link (Google Sheet hoặc Apps Script Web App URL), tự nhận diện loại link qua regex, rồi tự tìm-và-thay thế đúng biến cấu hình (`SHEET_ID`, `APPS_SCRIPT_URL`) trong đúng những file liên quan — có thể là 1 file `.gs` và hàng chục/hàng trăm file `.html`. Tránh phải mở từng file sửa tay, vừa chậm vừa dễ sót.

**Nguyên tắc thiết kế quan trọng:** script này dùng `os.path.dirname(os.path.abspath(__file__))` làm gốc (`ROOT`), **không hard-code đường dẫn tuyệt đối** → script chạy đúng dù thư mục dự án được copy sang ổ đĩa khác, máy khác, hay đổi tên.

---

## 10. Đóng gói & đẩy lên GitHub an toàn

- `.gitignore` chặn file chứa khoá bí mật thật (API key) không cho lên repo.
- Giữ song song 2 bản: bản thật (`code.gs`, có key) chỉ nằm trên máy, và bản "công khai" (`code.public.gs`, key đã thay bằng placeholder) — tự động đồng bộ lại mỗi lần sửa bản thật, để push lên GitHub (kể cả repo Public) mà không lộ bí mật.
- 1 file `.bat` (Windows) double-click là tự: đồng bộ bản công khai → `git add -A` → `git commit` → `git push`. Không bắt người dùng (giáo viên, không rành kỹ thuật) phải gõ lệnh git thủ công.

---

## 11. Cấu trúc thư mục đề xuất cho dự án lớp 6–12

```
DU_AN_LUYEN_TAP_6_12/
├── build.py                     # các hàm renderer dùng chung (câu hỏi, audio player...)
├── engine.css / engine.js       # runtime dùng chung cho mọi trang
├── units/
│   ├── lop6_unit1.py            # dữ liệu: bài đọc, câu hỏi, đáp án, audio
│   ├── lop6_unit2.py
│   └── ...
├── audio/
│   ├── lop6_unit1_listen1.mp3
│   └── ...
├── de_kiem_tra/
│   ├── giua_ky1_lop6.py
│   └── cuoi_ky1_lop6.py
├── WebBaiTap/                   # HTML đã sinh ra, chia theo lớp/unit/kỹ năng
│   ├── Lop6/Unit1/...
│   └── ...
├── code.gs / code.public.gs     # Apps Script backend
├── update_links.py
├── push_github.bat
├── .gitignore
└── HUONG_DAN/
    └── HuongDan_SuDung.docx
```

---

## 12. Checklist khi bắt đầu dự án mới

1. Thiết kế cấu trúc dữ liệu 1 Unit mẫu trước (câu hỏi + đáp án + audio) — làm xong 1 Unit hoàn chỉnh, test kỹ, rồi mới nhân rộng.
2. Viết/điều chỉnh `build.py` — tái dùng tối đa các hàm renderer cũ, chỉ thêm hàm mới cho phần nghe.
3. Viết/điều chỉnh `engine.js` — thêm xử lý audio, giữ nguyên phần timer/chống gian lận/gửi Sheet.
4. Thiết lập Google Sheet + Apps Script mới (sheet riêng cho dự án này, đừng dùng chung Sheet với IELTS Reading).
5. Build thử 1 Unit → chạy Playwright smoke test → xem bằng mắt (convert PDF hoặc mở trực tiếp) trước khi làm hàng loạt.
6. Viết script sinh hàng loạt khi mẫu đã ổn định.
7. Setup `update_links.py`, `.gitignore`, `push_github.bat`, repo GitHub riêng cho dự án này.
8. Viết file hướng dẫn sử dụng (Word) + folder HUONG_DAN, dành cho người không rành kỹ thuật tự vận hành sau này.

---

## 13. Những cạm bẫy kỹ thuật đã gặp (ghi lại để không lặp lại)

- Regex "lười" cắt cụt nội dung HTML lồng nhau → luôn đếm `<div>` mở/đóng thủ công khi parse HTML có thẻ lồng.
- Script test tự động chỉ xử lý 1 loại input (vd chỉ `radio`) sẽ báo sai điểm 0% cho các trang dùng loại input khác (text/select/checkbox) — luôn viết đủ nhánh xử lý cho mọi loại câu hỏi trong script test.
- Nhúng nội dung có dấu backtick (`) vào lệnh shell bọc trong dấu nháy kép (`"..."`) sẽ bị shell hiểu nhầm thành lệnh con — khi cần ghi nội dung dài/có ký tự đặc biệt vào file qua dòng lệnh, mã hoá base64 trước rồi giải mã khi ghi, tránh mọi vấn đề dấu nháy/ký tự đặc biệt.
- Khi copy nhiều file cùng lúc qua các công cụ có giới hạn số file/lượt (vd tối đa 50 file/lần), nhớ chia batch.
- Khi dùng token GitHub để push: token phải có quyền **ghi** (`repo` với token cổ điển, hoặc `Contents: Read and write` với fine-grained token) — token chỉ đọc được sẽ xác thực thành công nhưng bị từ chối khi push, lỗi 403 "Permission denied" dễ gây nhầm là token sai hoàn toàn.
- Luôn thiết kế script cấu hình (đổi link, đổi key...) dùng đường dẫn tương đối theo vị trí chính file script đó — không hard-code đường dẫn máy cụ thể, để cả thư mục dự án copy sang máy khác vẫn chạy đúng ngay.
