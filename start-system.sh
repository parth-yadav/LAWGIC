#!/bin/bash

echo "🚀 Starting PDF Threat Analyzer"
echo "================================"

# Check if .env exists in newbackend
if [ ! -f "newbackend/.env" ]; then
    echo "❌ Error: .env file not found in newbackend/"
    echo "Please create newbackend/.env with:"
    echo "GEMINI_API_KEY=your_api_key_here"
    echo "PORT=4000"
    exit 1
fi

# Start backend
echo "📡 Starting backend server..."
cd newbackend
npm install > /dev/null 2>&1
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 3

# Check if backend is running
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ Backend running on http://localhost:4000"
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend..."
cd newfrontend
npm install > /dev/null 2>&1
npm run dev &
FRONTEND_PID=$!
cd ..

echo "⏳ Waiting for frontend to initialize..."
sleep 5

echo ""
echo "🎉 System is ready!"
echo "📱 Frontend: http://localhost:3000"
echo "📡 Backend: http://localhost:4000"
echo ""
echo "To stop the servers, press Ctrl+C or run:"
echo "kill $BACKEND_PID $FRONTEND_PID"

# Keep the script running until interrupted
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

wait
