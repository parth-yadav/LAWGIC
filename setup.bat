@echo off
echo 🚀 Setting up PDF Threat Analyzer...

REM Backend setup
echo 📦 Setting up backend...
cd newbackend
call npm install
echo ✅ Backend dependencies installed

REM Create .env file if it doesn't exist
if not exist .env (
    copy .env.example .env
    echo ⚠️  Please add your GEMINI_API_KEY to newbackend\.env
)

cd ..

REM Frontend setup
echo 📦 Setting up frontend...
cd newfrontend
call npm install

REM Setup PDF.js worker
echo 📦 Setting up PDF.js worker...
if not exist public mkdir public
powershell -Command "try { Invoke-WebRequest -Uri 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js' -OutFile 'public/pdf.worker.min.js' -ErrorAction Stop; Write-Host 'PDF worker downloaded successfully' } catch { Write-Host 'Could not download PDF worker, will use CDN fallback' }"

echo ✅ Frontend dependencies installed

cd ..

echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Add your Gemini API key to newbackend\.env
echo 2. Start backend: cd newbackend ^&^& npm run dev
echo 3. Start frontend: cd newfrontend ^&^& npm run dev  
echo 4. Open http://localhost:3000 in your browser

pause
