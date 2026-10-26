@echo off
setlocal
cd /d "%~dp0..\.."
py -3 scripts\build_release.py --out dist
if errorlevel 1 (
  echo.
  echo Build failed.
  exit /b 1
)
echo.
echo Build completed. See dist.
endlocal
