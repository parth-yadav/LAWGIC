@echo off
echo 🔧 Installing PDF Threat Analyzer Frontend...

REM Install dependencies
call npm install

REM Ensure public directory exists
if not exist public mkdir public

REM Download PDF.js worker manually as a fallback
echo 📦 Setting up PDF.js worker...
powershell -Command "Invoke-WebRequest -Uri 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js' -OutFile 'public/pdf.worker.min.js'"

echo ✅ Frontend setup complete!
echo 🚀 Run 'npm run dev' to start the development server
pause
