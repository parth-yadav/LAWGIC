@echo off
echo 🚀 Starting PDF Threat Analyzer
echo ================================

REM Check if .env exists in newbackend
if not exist "newbackend\.env" (
    echo ❌ Error: .env file not found in newbackend\
    echo Please create newbackend\.env with:
    echo GEMINI_API_KEY=your_api_key_here
    echo PORT=4000
    pause
    exit /b 1
)

REM Start backend
echo 📡 Starting backend server...
cd newbackend
call npm install > nul 2>&1
start /B npm start
cd ..

REM Wait for backend to start
echo ⏳ Waiting for backend to initialize...
timeout /t 3 > nul

REM Check if backend is running
curl -s http://localhost:4000/health > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✅ Backend running on http://localhost:4000
) else (
    echo ❌ Backend failed to start
    pause
    exit /b 1
)

REM Start frontend
echo 🎨 Starting frontend...
cd newfrontend
call npm install > nul 2>&1
start /B npm run dev
cd ..

echo ⏳ Waiting for frontend to initialize...
timeout /t 5 > nul

echo.
echo 🎉 System is ready!
echo 📱 Frontend: http://localhost:3000
echo 📡 Backend: http://localhost:4000
echo.
echo Press any key to stop all servers...
pause > nul

REM Stop servers
taskkill /F /IM node.exe > nul 2>&1
echo 🛑 Servers stopped
