#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DOI LINK GOOGLE SHEET / APPS SCRIPT CHO TOAN BO HE THONG
----------------------------------------------------------
Dan 1 hoac 2 link vao, script tu nhan dien va cap nhat dung noi:

  - Link Google Sheet (dang .../spreadsheets/d/<ID>/...)
      -> cap nhat SHEET_ID trong 04_WebTest_TheoDang/code.gs
         (dung khi ban doi SANG MOT GOOGLE SHEET KHAC, van dung
          chung 1 Apps Script / 1 URL web app nhu hien tai)

  - Link Apps Script Web App (dang https://script.google.com/macros/s/<ID>/exec)
      -> cap nhat APPS_SCRIPT_URL trong TAT CA file .html (duoi moi thu muc con)
         (dung khi ban tao MOT APPS SCRIPT / DEPLOY MOI, co URL web app moi)

Cach dung (trong Command Prompt, dung thu muc nay):
    python update_links.py "<link1>" "<link2>"

Vi du chi doi sheet:
    python update_links.py "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOp/edit"

Vi du chi doi apps script moi:
    python update_links.py "https://script.google.com/macros/s/AKfycb.../exec"

Co the dan ca 2 cung luc, thu tu khong quan trong.
Sau khi doi SHEET_ID, script se TU DONG tao lai ban cong khai
code.public.gs (an API key thuc) de dong bo voi GitHub.
"""
import sys, re, glob, os

ROOT = os.path.dirname(os.path.abspath(__file__))
GS_FILE = os.path.join(ROOT, "04_WebTest_TheoDang", "code.gs")
GS_PUBLIC_FILE = os.path.join(ROOT, "04_WebTest_TheoDang", "code.public.gs")

SHEET_RE = re.compile(r"docs\.google\.com/spreadsheets/d/([a-zA-Z0-9_-]+)")
SCRIPT_RE = re.compile(r"https://script\.google\.com/macros/s/[a-zA-Z0-9_-]+/exec")


def sync_public_copy():
    """Tao lai code.public.gs (an CLAUDE_API_KEY thuc) de day len GitHub an toan."""
    if not os.path.exists(GS_FILE):
        return
    text = open(GS_FILE, encoding="utf-8").read()
    public_text = re.sub(
        r'var CLAUDE_API_KEY\s*=\s*"[^"]*"',
        'var CLAUDE_API_KEY = "YOUR_CLAUDE_API_KEY_HERE"',
        text,
    )
    with open(GS_PUBLIC_FILE, "w", encoding="utf-8") as f:
        f.write(public_text)
    print(f"[OK] Da dong bo ban cong khai (an API key) -> {os.path.relpath(GS_PUBLIC_FILE, ROOT)}")


def update_sheet_id(new_id):
    if not os.path.exists(GS_FILE):
        print(f"[LOI] Khong tim thay {GS_FILE}")
        return
    text = open(GS_FILE, encoding="utf-8").read()
    new_text, n = re.subn(r'var SHEET_ID\s*=\s*"[^"]*"', f'var SHEET_ID       = "{new_id}"', text)
    if n == 0:
        print("[LOI] Khong tim thay khai bao SHEET_ID trong code.gs")
        return
    with open(GS_FILE, "w", encoding="utf-8") as f:
        f.write(new_text)
    print(f"[OK] Da doi SHEET_ID -> {new_id}  ({os.path.relpath(GS_FILE, ROOT)})")
    sync_public_copy()


def update_apps_script_url(new_url):
    files = glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True)
    changed = 0
    for fp in files:
        text = open(fp, encoding="utf-8").read()
        new_text, n = re.subn(r'var APPS_SCRIPT_URL\s*=\s*"[^"]*"', f'var APPS_SCRIPT_URL = "{new_url}"', text)
        if n > 0:
            with open(fp, "w", encoding="utf-8") as f:
                f.write(new_text)
            changed += 1
    print(f"[OK] Da doi APPS_SCRIPT_URL -> {new_url}  ({changed} file .html duoc cap nhat)")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    if sys.argv[1] == "--sync-only":
        sync_public_copy()
        return
    for raw in sys.argv[1:]:
        link = raw.strip().strip('"').strip("'")
        m_sheet = SHEET_RE.search(link)
        m_script = SCRIPT_RE.search(link)
        if m_sheet:
            update_sheet_id(m_sheet.group(1))
        elif m_script:
            update_apps_script_url(m_script.group(0))
        else:
            print(f"[?] Khong nhan dien duoc link: {link}")
            print("    (can dang docs.google.com/spreadsheets/d/... hoac script.google.com/macros/s/.../exec)")


if __name__ == "__main__":
    main()
