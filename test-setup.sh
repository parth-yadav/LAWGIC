#!/bin/bash

echo "🧪 Testing PDF Threat Analyzer Setup..."

# Check if backend is running
echo "📡 Checking backend..."
if curl -s http://localhost:4000/health > /dev/null; then
    echo "✅ Backend is running on port 4000"
else
    echo "❌ Backend not running. Start with: cd newbackend && npm run dev"
fi

# Check if frontend is running
echo "📡 Checking frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running on port 3000"
else
    echo "❌ Frontend not running. Start with: cd newfrontend && npm run dev"
fi

# Test PDF.js worker accessibility
echo "📡 Checking PDF.js worker..."
if curl -s https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js > /dev/null; then
    echo "✅ PDF.js worker is accessible"
else
    echo "❌ PDF.js worker not accessible. Check internet connection"
fi

echo "🏁 Test complete!"
