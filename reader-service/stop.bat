@echo off
setlocal
cd /d "%~dp0"

if "%THAI_ID_CARD_READER_PORT%"=="" set "THAI_ID_CARD_READER_PORT=32123"

echo Stopping Mini HIS Thai ID Card Reader Service on port %THAI_ID_CARD_READER_PORT%...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$conn = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort %THAI_ID_CARD_READER_PORT% -ErrorAction SilentlyContinue | Select-Object -First 1; if (-not $conn) { Write-Host 'No reader service process found on this port.' -ForegroundColor Yellow; exit 0 }; Write-Host ('Stopping PID ' + $conn.OwningProcess) -ForegroundColor Cyan; Stop-Process -Id $conn.OwningProcess -Force; Write-Host 'Stopped.' -ForegroundColor Green"

echo.
pause
