#!/bin/bash

echo "🚀 Setting up PDF Threat Analyzer..."

# Backend setup
echo "📦 Setting up backend..."
cd newbackend
npm install
echo "✅ Backend dependencies installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please add your GEMINI_API_KEY to newbackend/.env"
fi

cd ..

# Frontend setup
echo "📦 Setting up frontend..."
cd newfrontend
npm install
echo "✅ Frontend dependencies installed"

cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your Gemini API key to newbackend/.env"
echo "2. Start backend: cd newbackend && npm run dev"
echo "3. Start frontend: cd newfrontend && npm run dev"
echo "4. Open http://localhost:3000 in your browser"
