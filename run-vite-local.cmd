@echo off
setlocal
set "PROJECT_DIR=%~dp0"
set "LOCAL_NODE=%PROJECT_DIR%.tools\node-v22.12.0-win-x64"

if not exist "%LOCAL_NODE%\node.exe" (
  echo Local Node runtime not found at:
  echo %LOCAL_NODE%\node.exe
  echo.
  echo Run this once to download it:
  echo powershell -NoProfile -Command "cd '%PROJECT_DIR%'; Invoke-WebRequest -UseBasicParsing https://nodejs.org/dist/v22.12.0/node-v22.12.0-win-x64.zip -OutFile .tools\node-v22.12.0-win-x64.zip; Expand-Archive -Path .tools\node-v22.12.0-win-x64.zip -DestinationPath .tools -Force"
  exit /b 1
)

set "PATH=%LOCAL_NODE%;%PATH%"
cd /d "%PROJECT_DIR%"
npm.cmd run dev
