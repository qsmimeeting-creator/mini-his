@echo off
setlocal
cd /d "%~dp0"

if "%THAI_ID_CARD_ALLOWED_ORIGINS%"=="" set "THAI_ID_CARD_ALLOWED_ORIGINS=https://mini-his.vercel.app"
if "%THAI_ID_CARD_READER_PORT%"=="" set "THAI_ID_CARD_READER_PORT=32123"

echo Starting Mini HIS Thai ID Card Reader Service...
echo Allowed origins: %THAI_ID_CARD_ALLOWED_ORIGINS%
echo Reader URL: http://127.0.0.1:%THAI_ID_CARD_READER_PORT%
echo.
echo If the program says the reader service is already running, close this window and use the web app normally.
echo Use check.bat to check status or stop.bat to restart the service.
echo.
call npm.cmd run reader
pause
