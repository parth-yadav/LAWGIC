#!/bin/bash

echo "🔧 Installing PDF Threat Analyzer Frontend..."

# Install dependencies
npm install

# Ensure public directory exists
mkdir -p public

# Download PDF.js worker manually as a fallback
echo "📦 Setting up PDF.js worker..."
curl -o public/pdf.worker.min.js https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js

echo "✅ Frontend setup complete!"
echo "🚀 Run 'npm run dev' to start the development server"
