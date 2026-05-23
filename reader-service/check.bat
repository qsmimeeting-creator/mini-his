@echo off
setlocal
cd /d "%~dp0"

if "%THAI_ID_CARD_READER_PORT%"=="" set "THAI_ID_CARD_READER_PORT=32123"

echo Checking Mini HIS Thai ID Card Reader Service...
echo URL: http://127.0.0.1:%THAI_ID_CARD_READER_PORT%/api/health
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:%THAI_ID_CARD_READER_PORT%/api/health' -TimeoutSec 3; if ($r.ok -eq $true) { Write-Host 'Reader service is running.' -ForegroundColor Green; $r | Format-List } else { Write-Host 'Reader service responded but is not healthy.' -ForegroundColor Yellow; $r | Format-List; exit 1 } } catch { Write-Host 'Reader service is not running or not reachable.' -ForegroundColor Red; Write-Host $_.Exception.Message; exit 1 }"

echo.
pause
