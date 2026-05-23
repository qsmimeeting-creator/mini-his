@echo off
setlocal
cd /d "%~dp0"

echo Installing Mini HIS Thai ID Card Reader dependencies...
call npm.cmd install
if errorlevel 1 (
  echo.
  echo Install failed. Please check Node.js, internet connection, and Visual Studio C++ Build Tools.
  pause
  exit /b 1
)

echo.
echo Rebuilding native PC/SC dependency if available...
call npm.cmd rebuild pcsclite
if errorlevel 1 (
  echo.
  echo pcsclite rebuild did not complete. If the reader works, this can be ignored.
  echo If reading cards fails, install Visual Studio C++ Build Tools and run install.bat again.
)

echo.
echo Install complete.
pause
