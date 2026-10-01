@echo off
cd /d %~dp0
echo ===============================================
echo   DONG BO + PUSH LEN GITHUB (tientran-tbec/FLIGHT-TO-SUCCESS)
echo ===============================================
python update_links.py --sync-only
if %errorlevel% neq 0 (
  echo [CANH BAO] Khong chay duoc python update_links.py --sync-only
  echo (co the may chua cai Python - ban co the bo qua buoc nay)
)
git add -A
git commit -m "Cap nhat %date% %time%"
if %errorlevel% neq 0 (
  echo (Khong co gi thay doi de commit)
)
git push origin main
echo ===============================================
echo   XONG. Nhan phim bat ky de dong.
echo ===============================================
pause
