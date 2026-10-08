@echo off
setlocal

cd /d "%~dp0"

echo.
echo ==========================================
echo       DATATRIPWIRE SHUTDOWN
echo ==========================================
echo.

docker compose down

if errorlevel 1 (
    echo.
    echo ERROR: Failed to stop DataTripwire.
    exit /b 1
)

echo.
echo DataTripwire containers stopped.
echo PostgreSQL volume was NOT deleted.
echo.

endlocal
