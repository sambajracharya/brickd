@echo off
title Brick'd - browser preview
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

echo.
echo   Starting Brick'd in your browser...
echo   Your browser will open automatically in a few seconds.
echo.
echo   URL: http://localhost:8090
echo.
echo   Keep this window OPEN while using the app.
echo   Close it (or press Ctrl+C) to stop.
echo.

REM Give Metro a head start, then open the browser.
start "" /b cmd /c "timeout /t 12 /nobreak >nul & start http://localhost:8090"

call npx expo start --web --port 8090
pause
