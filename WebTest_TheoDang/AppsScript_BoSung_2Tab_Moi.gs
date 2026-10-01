/* =====================================================================
   BỔ SUNG cho Google Apps Script hiện có (Sheet ID: 1Xl515oEdU1j-NrptU-3aUKK0fsOa9VylSIrMD7jqikQ)
   ---------------------------------------------------------------------
   KHÔNG xóa code cũ của bạn (đang xử lý action "save_result" cho Listening/
   Reading/Writing, ghi vào tab "Reading" v.v...). Đoạn này chỉ THÊM MỚI:
     - 2 action mới:  "save_result_bytype"  và  "log_event"
     - 2 tab mới:     "KetQua_TheoDang"     và  "NhatKyThaoTac"

   CÁCH DÙNG:
   1) Mở Apps Script editor hiện có của bạn (gắn với Sheet ID ở trên).
   2) Tìm hàm doPost(e) hiện có — nó đang có dạng switch/if theo payload.action.
      Thêm 2 nhánh else-if mới gọi 2 hàm bên dưới (xem phần "CÁCH NỐI VÀO doPost").
   3) Copy toàn bộ 2 hàm saveResultByType_() và logEvent_() bên dưới vào cuối
      file code.gs hiện có (không cần xóa gì cả).
   4) Deploy > Manage deployments > chọn deployment cũ > Edit > Version: New version
      > Deploy. (Bấm "New deployment" sẽ đổi URL — KHÔNG làm vậy, chỉ update
      deployment cũ để URL giữ nguyên, không phải sửa lại URL trong các file HTML.)
   ===================================================================== */

/* ---------------- CÁCH NỐI VÀO doPost(e) HIỆN CÓ ----------------
   Giả sử doPost hiện tại của bạn có dạng:

     function doPost(e) {
       var payload = JSON.parse(e.postData.contents);
       if (payload.action === 'save_result') {
         saveResult_(payload);                 // hàm cũ của bạn
       }
       // >>> THÊM 2 DÒNG DƯỚI ĐÂY <<<
       else if (payload.action === 'save_result_bytype') {
         saveResultByType_(payload);
       } else if (payload.action === 'log_event') {
         logEvent_(payload);
       }
       return ContentService.createTextOutput('ok');
     }

   Nếu doPost hiện tại dùng cấu trúc khác (switch-case, nhiều action cho
   Listening/Writing...), chỉ cần thêm 2 case/else-if tương tự, gọi đúng
   2 hàm saveResultByType_(payload) và logEvent_(payload) bên dưới.
------------------------------------------------------------------- */

function getOrCreateSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ---------------- TAB MỚI 1: "KetQua_TheoDang" ----------------
   Lưu kết quả các bài luyện tập Web Test theo từng DẠNG câu hỏi
   (Completion / Matching / TFNG / YNNG / Multiple Choice) — mỗi bài chỉ
   có 1 passage, không phải bài test đầy đủ 3 passage như tab "Reading". */
function saveResultByType_(payload) {
  var ss = SpreadsheetApp.openById('1Xl515oEdU1j-NrptU-3aUKK0fsOa9VylSIrMD7jqikQ');
  var headers = ['Thời gian nộp', 'Học viên', 'Dạng câu hỏi', 'Nguồn (Test - Passage)',
                 'Điểm đúng', 'Tổng số câu', 'Band tham khảo', 'Thời gian làm bài',
                 'Vi phạm chuyển tab', 'Vi phạm mất focus', 'Vi phạm thoát fullscreen',
                 'Chi tiết từng câu'];
  var sh = getOrCreateSheet_(ss, 'KetQua_TheoDang', headers);
  sh.appendRow([
    payload.timestamp || new Date().toISOString(),
    payload.student || '',
    payload.qtype || '',
    payload.testSource || '',
    payload.score,
    payload.total,
    payload.band || '',
    payload.timeTaken || '',
    payload.tabViol || 0,
    payload.focusViol || 0,
    payload.fsViol || 0,
    payload.details || ''
  ]);
}

/* ---------------- TAB MỚI 2: "NhatKyThaoTac" ----------------
   Ghi nhận MỌI thao tác của học viên trong 1 lượt làm bài web test theo
   dạng: từ lúc nhập tên/lớp để vào bài, cho tới lúc rời trang — gồm thời
   điểm từng mốc, loại thao tác, chi tiết, và thời gian đã trôi qua kể từ
   lúc bắt đầu làm bài (window._testStartTime phía client).
   Các loại eventType hiện có từ engine_single.js:
     enter                  - học viên nhập tên/lớp, bắt đầu vào bài
     fullscreen_exit        - thoát chế độ toàn màn hình
     tab_switch              - chuyển sang tab/cửa sổ khác
     focus_loss              - cửa sổ mất focus
     warning_20min_shown     - đã hiện popup cảnh báo 20 phút
     warning_20min_dismissed - học viên đã đóng popup cảnh báo 20 phút
     time_up                 - hết 30 phút (bắt đầu 5 phút gia hạn)
     auto_submit_timeout     - hệ thống tự động nộp bài do hết giờ
     submit                   - học viên bấm nộp bài (thành công)
     exit_page                - rời/đóng trang KHI CHƯA nộp bài (gửi qua sendBeacon)
     exit_after_submit        - rời/đóng trang SAU KHI đã nộp bài (gửi qua sendBeacon) */
function logEvent_(payload) {
  var ss = SpreadsheetApp.openById('1Xl515oEdU1j-NrptU-3aUKK0fsOa9VylSIrMD7jqikQ');
  var headers = ['Thời gian (timestamp)', 'Học viên', 'Dạng câu hỏi', 'Nguồn (Test - Passage)',
                 'Loại thao tác', 'Chi tiết', 'Thời gian đã trôi qua (từ lúc bắt đầu)'];
  var sh = getOrCreateSheet_(ss, 'NhatKyThaoTac', headers);
  sh.appendRow([
    payload.timestamp || new Date().toISOString(),
    payload.student || '',
    payload.qtype || '',
    payload.testSource || '',
    payload.eventType || '',
    payload.detail || '',
    payload.elapsed || ''
  ]);
}
