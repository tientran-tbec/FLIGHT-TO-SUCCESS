// ╔══════════════════════════════════════════════════════════════════╗
// ║         IELTS ONLINE SYSTEM — Google Apps Script                ║
// ║         Listening + Reading + Writing + Speaking + Teacher Portal ║
// ║         + Web Test THEO DẠNG (Completion/Matching/TFNG/YNNG/MCQ) ║
// ╚══════════════════════════════════════════════════════════════════╝

// ── CẤU HÌNH (chỉ sửa 3 dòng này) ────────────────────────────────
var CLAUDE_API_KEY = "YOUR_CLAUDE_API_KEY_HERE";
var SHEET_ID       = "1Xl515oEdU1j-NrptU-3aUKK0fsOa9VylSIrMD7jqikQ";
var TEACHER_EMAILS = ["rd.tbec@gmail.com"];
// ──────────────────────────────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════
// formatVNTime — trả về giờ Việt Nam dạng dd/mm/yyyy hh:mm:ss
// ══════════════════════════════════════════════════════════════════
function formatVNTime() {
  var now = new Date();
  var vn  = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  var d   = vn.getUTCDate(),    mo = vn.getUTCMonth() + 1, y = vn.getUTCFullYear();
  var h   = vn.getUTCHours(),   mi = vn.getUTCMinutes(),   s = vn.getUTCSeconds();
  return (d<10?'0':'')+d+'/'+(mo<10?'0':'')+mo+'/'+y+' '
       + (h<10?'0':'')+h+':'+(mi<10?'0':'')+mi+':'+(s<10?'0':'')+s;
}


// ══════════════════════════════════════════════════════════════════
// doPost
// ══════════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    var data   = JSON.parse(e.postData.contents);
    var action = data.action || "save_result";
    if (action === "save_result")        return saveListeningReading(data);
    if (action === "grade_writing")      return gradeWriting(data);
    if (action === "save_writing")       return saveWritingOnly(data);
    if (action === "save_teacher_grade") return saveTeacherGrade(data);
    if (action === "save_speaking")       return saveSpeaking(data);
    if (action === "save_speaking_grade") return saveSpeakingGrade(data);
    if (action === "test_enter" || action === "test_name_update" || action === "test_leave")
      return handleTestAccess(data);
    if (action === "test_activity")
      return handleTestActivity(data);
    if (action === "test_feedback")
      return handleTestFeedback(data);
    // ── MỚI: Web Test THEO DẠNG (1 passage / dạng câu hỏi) ─────────
    if (action === "save_result_bytype")
      return saveResultByType(data);
    if (action === "log_event")
      return logStudentEvent(data);
    return jsonResp({ status: "error", msg: "Unknown action: " + action });
  } catch (err) {
    return jsonResp({ status: "error", msg: err.toString() });
  }
}


// ══════════════════════════════════════════════════════════════════
// doGet
// ══════════════════════════════════════════════════════════════════
function doGet(e) {
  try {
    var action = e.parameter.action || "";
    var token  = e.parameter.token  || "";
    if (action === "get_speaking_submissions") {
    if (!verifyGoogleToken(token)) return jsonResp({ status: "error", msg: "Unauthorized" });
    return getSpeakingSubmissions();
    }
    if (action === "get_submissions") {
      if (!verifyGoogleToken(token)) return jsonResp({ status: "error", msg: "Unauthorized" });
      var ss    = SpreadsheetApp.openById(SHEET_ID);
      var sheet = ss.getSheetByName("Writing");
      if (!sheet) return jsonResp({ status: "ok", data: [] });
      var rows  = sheet.getDataRange().getValues();
      var out   = [];
      for (var i = 1; i < rows.length; i++) {
        out.push({
          row: i + 1, timestamp: rows[i][0], student: rows[i][1], test: rows[i][2],
          t1Band: rows[i][3], t2Band: rows[i][4], overall: rows[i][5],
          timeTaken: rows[i][6], tabViol: rows[i][7],
          t1Essay: rows[i][8], t2Essay: rows[i][9],
          t1Feedback: rows[i][10], t2Feedback: rows[i][11],
          teacherNote: rows[i][12], teacherGrade: rows[i][13]
        });
      }
      return jsonResp({ status: "ok", data: out });
    }

    if (action === "verify_teacher") {
      var ok = verifyGoogleToken(token);
      return jsonResp({ status: ok ? "ok" : "error", msg: ok ? "Authorized" : "Unauthorized" });
    }

    return jsonResp({ status: "error", msg: "Unknown action: " + action });
  } catch (err) {
    return jsonResp({ status: "error", msg: err.toString() });
  }
}


// ══════════════════════════════════════════════════════════════════
// ACTION 1 — save_result: Listening & Reading
// ══════════════════════════════════════════════════════════════════
function saveListeningReading(data) {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName("Listening_Reading");
  if (!sheet) {
    sheet = ss.insertSheet("Listening_Reading");
    sheet.appendRow(["timestamp","student","test","score","total","band","timeTaken","tabViol","focusViol","fsViol","details"]);
  }
  sheet.appendRow([
    formatVNTime(),
    data.student || "", data.test || "",
    data.score || 0, data.total || 40, data.band || "",
    data.timeTaken || "", data.tabViol || 0, data.focusViol || 0, data.fsViol || 0,
    data.details || ""
  ]);
  return jsonResp({ status: "ok" });
}


// ══════════════════════════════════════════════════════════════════
// ACTION 2 — grade_writing
// ══════════════════════════════════════════════════════════════════
function gradeWriting(data) {
  var grading = gradeWithClaude(data);
  if (grading.error) return jsonResp({ status: "error", msg: grading.error });
  _appendWritingRow(data, grading);
  return jsonResp({ status: "ok", grading: grading });
}


// ══════════════════════════════════════════════════════════════════
// ACTION 3 — save_writing (không chấm)
// ══════════════════════════════════════════════════════════════════
function saveWritingOnly(data) {
  _appendWritingRow(data, null);
  return jsonResp({ status: "ok" });
}


// ══════════════════════════════════════════════════════════════════
// ACTION 4 — save_teacher_grade
// ══════════════════════════════════════════════════════════════════
function saveTeacherGrade(data) {
  if (!verifyGoogleToken(data.token || "")) return jsonResp({ status: "error", msg: "Unauthorized" });
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName("Writing");
  if (!sheet) return jsonResp({ status: "error", msg: "Sheet Writing not found" });
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][1] === data.student && rows[i][2] === data.test) {
      var r = i + 1;
      sheet.getRange(r, 4).setValue(data.t1Band      || rows[i][3]);
      sheet.getRange(r, 5).setValue(data.t2Band      || rows[i][4]);
      sheet.getRange(r, 6).setValue(data.overall     || rows[i][5]);
      sheet.getRange(r, 13).setValue(data.teacherNote  || "");
      sheet.getRange(r, 14).setValue(data.teacherGrade || "");
      return jsonResp({ status: "ok" });
    }
  }
  return jsonResp({ status: "error", msg: "Submission not found" });
}


// ══════════════════════════════════════════════════════════════════
// gradeWithClaude
// ══════════════════════════════════════════════════════════════════
function gradeWithClaude(data) {
  var task1_prompt = data.task1_prompt || "";
  var task1_essay  = data.task1_essay  || "(not submitted)";
  var task2_prompt = data.task2_prompt || "";
  var task2_essay  = data.task2_essay  || "(not submitted)";

  var t1 = gradeOneTask(1, task1_prompt, task1_essay);
  if (t1.error) return { error: "Task 1: " + t1.error };

  var t2 = gradeOneTask(2, task2_prompt, task2_essay);
  if (t2.error) return { error: "Task 2: " + t2.error };

  var overall = Math.round(((t1.band + t2.band * 2) / 3) * 2) / 2;
  return { t1: t1, t2: t2, overall: overall };
}


function gradeOneTask(taskNum, prompt_text, essay_text) {
  var criteria = taskNum === 1
    ? "TA (Task Achievement), CC (Coherence and Cohesion), LR (Lexical Resource), GRA (Grammatical Range and Accuracy)"
    : "TR (Task Response), CC (Coherence and Cohesion), LR (Lexical Resource), GRA (Grammatical Range and Accuracy)";

  var c1      = taskNum === 1 ? "ta" : "tr";
  var c1_name = taskNum === 1 ? "Task Achievement" : "Task Response";

  var userPrompt =
    "You are an expert IELTS examiner. Grade this IELTS Writing Task " + taskNum + " essay.\n" +
    "Criteria: " + criteria + "\n" +
    "Each criterion: score 0 to 9, multiples of 0.5 only.\n" +
    "Task Band = average of 4 criteria, rounded to nearest 0.5.\n\n" +
    "TASK PROMPT:\n" + prompt_text + "\n\n" +
    "STUDENT ESSAY:\n" + essay_text + "\n\n" +
    "Return ONLY a JSON object. No markdown. No text before or after the JSON.\n" +
    "Every string value must be on one line (no newlines inside strings).\n" +
    "Use only double quotes. Replace any double quote inside a value with a single quote.\n\n" +
    "Return this exact structure (replace 0 with scores, replace text in brackets with real feedback):\n" +
    "{\"" + c1 + "\":0,\"cc\":0,\"lr\":0,\"gra\":0,\"band\":0," +
    "\"" + c1 + "_en\":\"[" + c1_name + " feedback in English]\"," +
    "\"" + c1 + "_vi\":\"[" + c1_name + " feedback in Vietnamese]\"," +
    "\"cc_en\":\"[Coherence feedback in English]\"," +
    "\"cc_vi\":\"[Coherence feedback in Vietnamese]\"," +
    "\"lr_en\":\"[Lexical Resource feedback in English]\"," +
    "\"lr_vi\":\"[Lexical Resource feedback in Vietnamese]\"," +
    "\"gra_en\":\"[Grammar feedback in English]\"," +
    "\"gra_vi\":\"[Grammar feedback in Vietnamese]\"," +
    "\"tips_en\":[\"[improvement tip 1]\",\"[improvement tip 2]\"]," +
    "\"tips_vi\":[\"[improvement tip 1 in Vietnamese]\",\"[improvement tip 2 in Vietnamese]\"]}";

  try {
    var resp = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
      method: "post",
      headers: {
        "x-api-key":         CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json"
      },
      payload: JSON.stringify({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages:   [{ role: "user", content: userPrompt }]
      }),
      muteHttpExceptions: true
    });

    var httpCode = resp.getResponseCode();
    if (httpCode !== 200) {
      return { error: "HTTP " + httpCode + ": " + resp.getContentText().substring(0, 200) };
    }

    var parsed  = JSON.parse(resp.getContentText());
    var rawText = parsed.content[0].text;

    rawText = rawText.trim();
    rawText = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "").trim();

    var start = rawText.indexOf("{");
    var end   = rawText.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      return { error: "No valid JSON found in response: " + rawText.substring(0, 200) };
    }
    rawText = rawText.substring(start, end + 1);
    rawText = rawText.replace(/[\r\n\t]/g, " ");

    var result = JSON.parse(rawText);

    var scores = taskNum === 1
      ? [result.ta || 0, result.cc || 0, result.lr || 0, result.gra || 0]
      : [result.tr || 0, result.cc || 0, result.lr || 0, result.gra || 0];
    var avg    = (scores[0] + scores[1] + scores[2] + scores[3]) / 4;
    result.band = Math.round(avg * 2) / 2;

    return result;

  } catch (err) {
    return { error: err.toString() };
  }
}


// ══════════════════════════════════════════════════════════════════
// verifyGoogleToken
// ══════════════════════════════════════════════════════════════════
function verifyGoogleToken(token) {
  if (!token) return false;
  try {
    var resp  = UrlFetchApp.fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + token,
      { muteHttpExceptions: true }
    );
    var info  = JSON.parse(resp.getContentText());
    var email = (info.email || "").toLowerCase().trim();
    for (var i = 0; i < TEACHER_EMAILS.length; i++) {
      if (TEACHER_EMAILS[i].toLowerCase().trim() === email) return true;
    }
    try {
      var ss    = SpreadsheetApp.openById(SHEET_ID);
      var sheet = ss.getSheetByName("Teachers");
      if (sheet) {
        var rows = sheet.getDataRange().getValues();
        for (var j = 1; j < rows.length; j++) {
          if ((rows[j][0] || "").toLowerCase().trim() === email) return true;
        }
      }
    } catch (e2) {}
    return false;
  } catch (err) {
    return false;
  }
}


// ══════════════════════════════════════════════════════════════════
// _appendWritingRow
// ══════════════════════════════════════════════════════════════════
function _appendWritingRow(data, grading) {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName("Writing");
  if (!sheet) {
    sheet = ss.insertSheet("Writing");
    sheet.appendRow(["timestamp","student","test","t1Band","t2Band","overall",
                     "timeTaken","tabViol","t1Essay","t2Essay",
                     "t1Feedback","t2Feedback","teacherNote","teacherGrade"]);
  }
  sheet.appendRow([
    formatVNTime(),
    data.student     || "",
    data.test        || "",
    grading ? grading.t1.band : "",
    grading ? grading.t2.band : "",
    grading ? grading.overall : "",
    data.timeTaken   || "",
    data.tabViol     || 0,
    data.task1_essay || "",
    data.task2_essay || "",
    grading ? JSON.stringify(grading.t1) : "",
    grading ? JSON.stringify(grading.t2) : "",
    "", ""
  ]);
}


// ══════════════════════════════════════════════════════════════════
// jsonResp
// ══════════════════════════════════════════════════════════════════
function jsonResp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ══════════════════════════════════════════════════════════════════
// THEO DÕI LƯỢT VÀO BÀI TEST — action: test_enter / test_name_update / test_leave
// Ghi vào sheet "Test Access Log": ai vào bài nào, lúc nào, ở lại bao lâu
// ══════════════════════════════════════════════════════════════════
function handleTestAccess(data) {
  var sheet = getOrCreateAccessLogSheet();
  var nowMs = Date.now();

  if (data.action === 'test_enter') {
    sheet.appendRow([
      data.session_id || '',
      formatVNTime(),   // cột B — chuỗi "dd/mm/yyyy hh:mm:ss", hiển thị đúng luôn không phụ thuộc format ô
      data.name || '',
      data.test || '',
      data.device_id || '',
      '',      // Giờ rời — điền sau
      '',      // Thời lượng (phút) — điền sau
      nowMs    // cột H (ẩn) — mốc thời gian dạng số, dùng để tính thời lượng chính xác
    ]);
  }
  else if (data.action === 'test_name_update') {
    var row = findRowBySessionId(sheet, data.session_id);
    if (row) {
      sheet.getRange(row, 3).setValue(data.name || ''); // cột C = Tên học viên
    }
  }
  else if (data.action === 'test_leave') {
    var row = findRowBySessionId(sheet, data.session_id);
    if (row) {
      sheet.getRange(row, 6).setValue(formatVNTime()); // cột F = Giờ rời
      var enterMs = sheet.getRange(row, 8).getValue();
      if (enterMs) {
        var minutes = Math.round((nowMs - enterMs) / 60000 * 10) / 10;
        sheet.getRange(row, 7).setValue(minutes); // cột G = Thời lượng (phút)
      }
    }
  }

  return jsonResp({ status: 'ok' });
}

function getOrCreateAccessLogSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('Test Access Log');
  if (!sheet) {
    sheet = ss.insertSheet('Test Access Log');
    sheet.appendRow(['Session ID', 'Giờ vào', 'Tên học viên', 'Bài test', 'Mã thiết bị', 'Giờ rời', 'Thời lượng (phút)', '_enter_ms']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    sheet.hideColumns(8); // ẩn cột kỹ thuật _enter_ms, không cần xem
  }
  return sheet;
}

function findRowBySessionId(sheet, sessionId) {
  if (!sessionId) return null;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) {
    if (ids[i][0] === sessionId) return i + 2;
  }
  return null;
}


// ══════════════════════════════════════════════════════════════════
// THEO DÕI HOẠT ĐỘNG TRONG BÀI TEST — action: test_activity
// Ghi vào sheet "Test Activity Log": nghe audio, check điểm, xem script/giải thích, tua câu hỏi
// ══════════════════════════════════════════════════════════════════
function handleTestActivity(data) {
  var sheet = getOrCreateActivityLogSheet();
  sheet.appendRow([
    data.session_id || '',
    formatVNTime(),
    data.name || '',
    data.test || '',
    data.event || '',
    data.detail || ''
  ]);
  return jsonResp({ status: 'ok' });
}

function getOrCreateActivityLogSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('Test Activity Log');
  if (!sheet) {
    sheet = ss.insertSheet('Test Activity Log');
    sheet.appendRow(['Session ID', 'Thời gian', 'Tên học viên', 'Bài test', 'Hành động', 'Chi tiết']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }
  return sheet;
}


// ══════════════════════════════════════════════════════════════════
// GÓP Ý / BÁO LỖI TỪ HỌC VIÊN — action: test_feedback
// Ghi vào sheet "Test Feedback": lỗi/góp ý học viên gặp phải trong lúc làm bài
// ══════════════════════════════════════════════════════════════════
function handleTestFeedback(data) {
  var sheet = getOrCreateFeedbackSheet();
  sheet.appendRow([
    formatVNTime(),
    data.name || '',
    data.test || '',
    data.part || '',
    data.content || '',
    data.session_id || ''
  ]);
  return jsonResp({ status: 'ok' });
}

function getOrCreateFeedbackSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('Test Feedback');
  if (!sheet) {
    sheet = ss.insertSheet('Test Feedback');
    sheet.appendRow(['Thời gian', 'Tên học viên', 'Bài test', 'Part', 'Nội dung góp ý', 'Session ID']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    sheet.setColumnWidth(5, 400); // cột Nội dung góp ý rộng hơn cho dễ đọc
  }
  return sheet;
}


// ══════════════════════════════════════════════════════════════════
// MỚI — WEB TEST THEO DẠNG (Completion / Matching / TFNG / YNNG / MCQ)
// action: save_result_bytype  → ghi vào sheet "KetQua_TheoDang"
// action: log_event           → ghi vào sheet "NhatKyThaoTac"
// Dùng bởi engine_single.js (các file Test{N}_Passage{P}_{DANG}.html trong
// folder WebTest_TheoDang/<Tên dạng>/)
// ══════════════════════════════════════════════════════════════════
function saveResultByType(data) {
  var sheet = getOrCreateByTypeResultSheet();
  sheet.appendRow([
    data.timestamp || formatVNTime(),
    data.student || '',
    data.qtype || '',
    data.testSource || '',
    data.score || 0,
    data.total || 0,
    data.band || '',
    data.timeTaken || '',
    data.tabViol || 0,
    data.focusViol || 0,
    data.fsViol || 0,
    data.details || ''
  ]);
  return jsonResp({ status: 'ok' });
}

function getOrCreateByTypeResultSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('KetQua_TheoDang');
  if (!sheet) {
    sheet = ss.insertSheet('KetQua_TheoDang');
    sheet.appendRow(['Thời gian nộp', 'Học viên', 'Dạng câu hỏi', 'Nguồn (Test - Passage)',
                      'Điểm đúng', 'Tổng số câu', 'Band tham khảo', 'Thời gian làm bài',
                      'Vi phạm chuyển tab', 'Vi phạm mất focus', 'Vi phạm thoát fullscreen',
                      'Chi tiết từng câu']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 12).setFontWeight('bold');
  }
  return sheet;
}

// eventType hiện có từ engine_single.js: enter, fullscreen_exit, tab_switch,
// focus_loss, warning_20min_shown, warning_20min_dismissed, time_up,
// auto_submit_timeout, submit, exit_page, exit_after_submit
function logStudentEvent(data) {
  var sheet = getOrCreateActivityByTypeSheet();
  sheet.appendRow([
    data.timestamp || formatVNTime(),
    data.student || '',
    data.qtype || '',
    data.testSource || '',
    data.eventType || '',
    data.detail || '',
    data.elapsed || ''
  ]);
  return jsonResp({ status: 'ok' });
}

function getOrCreateActivityByTypeSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('NhatKyThaoTac');
  if (!sheet) {
    sheet = ss.insertSheet('NhatKyThaoTac');
    sheet.appendRow(['Thời gian (timestamp)', 'Học viên', 'Dạng câu hỏi', 'Nguồn (Test - Passage)',
                      'Loại thao tác', 'Chi tiết', 'Thời gian đã trôi qua (từ lúc bắt đầu)']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  return sheet;
}


// ══════════════════════════════════════════════════════════════════
// testGradeWriting — chạy thử, xóa sau khi test xong
// ══════════════════════════════════════════════════════════════════
function testGradeWriting() {
  var data = {
    task1_prompt: "The chart shows energy consumption by source from 2000 to 2020.",
    task1_essay:  "The chart illustrates energy consumption patterns over two decades. Overall, oil remained the dominant source throughout the period, although renewable energy grew significantly.",
    task2_prompt: "Some people think technology has made our lives more complex. To what extent do you agree or disagree?",
    task2_essay:  "In today's world, technology plays a crucial role in daily life. While some argue it complicates our existence, I strongly disagree with this view because technology saves time and connects people globally.",
    student:   "Test Student",
    test:      "Writing Test 1",
    timeTaken: "5 phut 0 giay",
    tabViol:   0
  };
  var result = gradeWithClaude(data);
  Logger.log(JSON.stringify(result));
}

function debugPost() {
  var payload = {
    action: "grade_writing",
    student: "Test — A",
    test: "Writing Test 1",
    task1_prompt: "The graph shows smoking rates in Someland from 1960 to 2000.",
    task1_essay: "The graph illustrates smoking rates over 40 years. Men smoked more than women throughout.",
    task2_prompt: "Some people think space exploration wastes money. Do you agree?",
    task2_essay: "I disagree that space exploration is a waste of money because it leads to many technological advances.",
    timeTaken: "5m 0s",
    tabViol: 0,
    focusViol: 0,
    fsViol: 0
  };
  var e = { postData: { contents: JSON.stringify(payload) } };
  var result = doPost(e);
  Logger.log(result.getContent());
}
// ╔══════════════════════════════════════════════════════════════════╗
// ║   SPEAKING MODULE — thêm vào cuối Apps Script hiện tại         ║
// ║   Paste toàn bộ đoạn này vào cuối file .gs                     ║
// ╔══════════════════════════════════════════════════════════════════╝

// ── CẤU HÌNH SPEAKING ─────────────────────────────────────────────
var SPEAKING_FOLDER_NAME = "IELTS_Speaking_Submissions";
// ──────────────────────────────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════
// saveSpeaking — nhận 1 file audio (base64) + metadata
// Web gọi nhiều lần, mỗi lần 1 file
// ══════════════════════════════════════════════════════════════════
function saveSpeaking(data) {
  try {
    var student   = data.student   || "Unknown";
    var test      = data.test      || "Test1";
    var label     = data.label     || "audio";      // vd: "Part1_Q1", "Part2", "Part3_Q3"
    var mimeType  = data.mimeType  || "audio/webm";
    var audioB64  = data.audioB64  || "";
    var totalTime = data.totalTime || "";
    var isLast    = data.isLast    || false;        // true khi đây là file cuối cùng

    if (!audioB64) return jsonResp({ status: "error", msg: "No audio data" });

    // Tạo/lấy folder Drive
    var folder = getOrCreateSpeakingFolder();

    // Tạo subfolder cho học viên + test (vd: "NguyenVanA_Test1_06052026")
    var safeStudent = student.replace(/[^a-zA-Z0-9_\-À-ɏḀ-ỿ ]/g, "").trim();
    var dateStr     = Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "ddMMyyyy");
    var subName     = safeStudent + "_" + test.replace(/\s/g,"") + "_" + dateStr;

    var subFolder   = getOrCreateSubFolder(folder, subName);

    // Decode base64 và lưu file
    var ext      = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
    var fileName = safeStudent + "_" + test.replace(/\s/g,"") + "_" + label + "." + ext;
    var decoded  = Utilities.base64Decode(audioB64);
    var blob     = Utilities.newBlob(decoded, mimeType, fileName);
    var file     = subFolder.createFile(blob);

    // Chia sẻ file để stream được (anyone with link can view)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var fileId  = file.getId();
    var fileUrl = "https://drive.google.com/file/d/" + fileId + "/view";

    // Ghi vào Sheet Speaking
    _appendOrUpdateSpeakingRow(student, test, label, fileUrl, fileId, totalTime, isLast, subFolder.getId());

    return jsonResp({ status: "ok", fileId: fileId, fileUrl: fileUrl });

  } catch (err) {
    return jsonResp({ status: "error", msg: err.toString() });
  }
}


// ══════════════════════════════════════════════════════════════════
// saveSpeakingGrade — giáo viên lưu điểm
// ══════════════════════════════════════════════════════════════════
function saveSpeakingGrade(data) {
  if (!verifyGoogleToken(data.token || "")) {
    return jsonResp({ status: "error", msg: "Unauthorized" });
  }
  try {
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName("Speaking");
    if (!sheet) return jsonResp({ status: "error", msg: "Sheet Speaking not found" });

    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][1] === data.student && rows[i][2] === data.test) {
        var r = i + 1;
        sheet.getRange(r, 10).setValue(data.fluency      || "");
        sheet.getRange(r, 11).setValue(data.lexical      || "");
        sheet.getRange(r, 12).setValue(data.grammar      || "");
        sheet.getRange(r, 13).setValue(data.pronunciation|| "");
        sheet.getRange(r, 14).setValue(data.overall      || "");
        sheet.getRange(r, 15).setValue(data.teacherNote  || "");
        sheet.getRange(r, 16).setValue(formatVNTime());
        return jsonResp({ status: "ok" });
      }
    }
    return jsonResp({ status: "error", msg: "Submission not found" });
  } catch (err) {
    return jsonResp({ status: "error", msg: err.toString() });
  }
}


// ══════════════════════════════════════════════════════════════════
// getSpeakingSubmissions — giáo viên lấy danh sách bài
// ══════════════════════════════════════════════════════════════════
function getSpeakingSubmissions() {
  try {
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName("Speaking");
    if (!sheet) return jsonResp({ status: "ok", data: [] });

    var rows = sheet.getDataRange().getValues();
    var out  = [];
    for (var i = 1; i < rows.length; i++) {
      if (!rows[i][0]) continue; // bỏ dòng trống
      out.push({
        row:          i + 1,
        timestamp:    rows[i][0],
        student:      rows[i][1],
        test:         rows[i][2],
        files:        rows[i][3] ? JSON.parse(rows[i][3]) : [],   // [{label, fileId, fileUrl}]
        folderUrl:    rows[i][4],
        totalTime:    rows[i][5],
        status:       rows[i][6],   // "complete" khi tất cả file đã upload
        fluency:      rows[i][9],
        lexical:      rows[i][10],
        grammar:      rows[i][11],
        pronunciation:rows[i][12],
        overall:      rows[i][13],
        teacherNote:  rows[i][14],
        gradedAt:     rows[i][15]
      });
    }
    return jsonResp({ status: "ok", data: out });
  } catch (err) {
    return jsonResp({ status: "error", msg: err.toString() });
  }
}


// ══════════════════════════════════════════════════════════════════
// _appendOrUpdateSpeakingRow — ghi/cập nhật dòng trong Sheet Speaking
// ══════════════════════════════════════════════════════════════════
function _appendOrUpdateSpeakingRow(student, test, label, fileUrl, fileId, totalTime, isLast, folderId) {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName("Speaking");

  // Tạo sheet nếu chưa có
  if (!sheet) {
    sheet = ss.insertSheet("Speaking");
    sheet.appendRow([
      "timestamp", "student", "test", "files_json", "folderUrl",
      "totalTime", "status",
      "part1_count", "part3_count",
      "fluency", "lexical", "grammar", "pronunciation", "overall",
      "teacherNote", "gradedAt"
    ]);
    // Format header
    sheet.getRange(1, 1, 1, 16).setFontWeight("bold").setBackground("#4f8ef7").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }

  var folderUrl = "https://drive.google.com/drive/folders/" + folderId;
  var rows = sheet.getDataRange().getValues();

  // Tìm dòng đã có của student+test hôm nay
  var today   = formatVNTime().substring(0, 10); // lấy "dd/MM/yyyy" từ formatVNTime;
  var foundRow = -1;
  for (var i = 1; i < rows.length; i++) {
    var ts = rows[i][0] ? rows[i][0].toString() : "";
    if (rows[i][1] === student && rows[i][2] === test && ts.indexOf(today) === 0) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) {
    // Tạo dòng mới
    var filesArr = [{ label: label, fileId: fileId, fileUrl: fileUrl }];
    sheet.appendRow([
      formatVNTime(), student, test,
      JSON.stringify(filesArr),
      folderUrl, totalTime,
      isLast ? "complete" : "uploading",
      label.indexOf("Part1") === 0 ? 1 : 0,
      label.indexOf("Part3") === 0 ? 1 : 0,
      "", "", "", "", "", "", ""
    ]);
  } else {
    // Cập nhật dòng đã có — thêm file vào mảng
    var existingJson = rows[foundRow - 1][3] || "[]";
    var filesArr;
    try { filesArr = JSON.parse(existingJson); } catch(e) { filesArr = []; }
    filesArr.push({ label: label, fileId: fileId, fileUrl: fileUrl });

    sheet.getRange(foundRow, 4).setValue(JSON.stringify(filesArr));
    if (totalTime) sheet.getRange(foundRow, 6).setValue(totalTime);
    if (isLast)    sheet.getRange(foundRow, 7).setValue("complete");

    // Cập nhật count
    var p1count = label.indexOf("Part1") === 0
      ? (parseInt(rows[foundRow-1][7]||0) + 1)
      : rows[foundRow-1][7] || 0;
    var p3count = label.indexOf("Part3") === 0
      ? (parseInt(rows[foundRow-1][8]||0) + 1)
      : rows[foundRow-1][8] || 0;
    sheet.getRange(foundRow, 8).setValue(p1count);
    sheet.getRange(foundRow, 9).setValue(p3count);
  }
}


// ══════════════════════════════════════════════════════════════════
// getOrCreateSpeakingFolder — lấy hoặc tạo folder gốc trên Drive
// ══════════════════════════════════════════════════════════════════
function getOrCreateSpeakingFolder() {
  var folders = DriveApp.getFoldersByName(SPEAKING_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  var folder = DriveApp.createFolder(SPEAKING_FOLDER_NAME);
  folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  return folder;
}


// ══════════════════════════════════════════════════════════════════
// getOrCreateSubFolder — tạo subfolder cho từng học viên/test
// ══════════════════════════════════════════════════════════════════
function getOrCreateSubFolder(parentFolder, name) {
  var folders = parentFolder.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parentFolder.createFolder(name);
}
function testSaveSpeaking() {
  var data = {
    student:   "TestStudent",
    test:      "Test1",
    label:     "Part1_Q1",
    mimeType:  "audio/webm",
    audioB64:  "GkXfo0AgQoaBAUL3gQFC8oEEQvOBCFAARSyrAA==",
    totalTime: "180",
    isLast:    false
  };
  var result = saveSpeaking(data);
  Logger.log(result.getContent());
}
function authDrive() {
  var f = DriveApp.createFolder("_test_auth_delete_me");
  f.setTrashed(true);
}
