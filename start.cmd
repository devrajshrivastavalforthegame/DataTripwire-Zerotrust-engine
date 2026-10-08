@echo off
setlocal

cd /d "%~dp0"

echo.
echo ==========================================
echo       DATATRIPWIRE STARTUP
echo ==========================================
echo.

if not exist ".env" (
    echo [1/4] .env not found. Creating from .env.example...
    copy /Y ".env.example" ".env" >nul
    if errorlevel 1 (
        echo ERROR: Could not create .env
        exit /b 1
    )
) else (
    echo [1/4] Existing .env found. Keeping it.
)

echo [2/4] Checking Docker...

docker info >nul 2>&1
if errorlevel 1 (
    echo Docker engine is not running.
    echo Attempting to start Docker Desktop...

    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

    echo Waiting for Docker engine...
    set /a COUNT=0

:WAIT_DOCKER
    timeout /t 2 /nobreak >nul
    docker info >nul 2>&1

    if not errorlevel 1 goto DOCKER_READY

    set /a COUNT+=1

    if %COUNT% GEQ 60 (
        echo ERROR: Docker engine did not become ready.
        exit /b 1
    )

    goto WAIT_DOCKER
)

:DOCKER_READY
echo Docker engine is ready.

echo [3/4] Building and starting DataTripwire...
docker compose up -d --build

if errorlevel 1 (
    echo.
    echo ERROR: DataTripwire failed to start.
    echo Run:
    echo docker compose logs
    exit /b 1
)

echo [4/4] Checking container status...
docker compose ps

echo.
echo ==========================================
echo       DATATRIPWIRE IS STARTING
echo ==========================================
echo.
echo Backend:  http://localhost:3000
echo Swagger:  http://localhost:3000/docs/
echo AI:       http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Use stop.cmd to stop the application.
echo ==========================================
echo.

endlocal
