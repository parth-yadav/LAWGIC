@echo off
echo 🧪 Testing PDF Threat Analyzer Setup...

REM Check if backend is running
echo 📡 Checking backend...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:4000/health' -UseBasicParsing -TimeoutSec 5; Write-Host '✅ Backend is running on port 4000' } catch { Write-Host '❌ Backend not running. Start with: cd newbackend && npm run dev' }"

REM Check if frontend is running  
echo 📡 Checking frontend...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 5; Write-Host '✅ Frontend is running on port 3000' } catch { Write-Host '❌ Frontend not running. Start with: cd newfrontend && npm run dev' }"

REM Test PDF.js worker accessibility
echo 📡 Checking PDF.js worker...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js' -UseBasicParsing -TimeoutSec 10; Write-Host '✅ PDF.js worker is accessible' } catch { Write-Host '❌ PDF.js worker not accessible. Check internet connection' }"

echo 🏁 Test complete!
pause
