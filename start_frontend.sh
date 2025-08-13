#!/bin/bash

# SyncTracker Frontend Startup Script

set -e

echo "🌟 Starting SyncTracker Frontend..."

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found!"
    echo "Make sure you're running this from the SyncTracker root directory."
    exit 1
fi

# Change to frontend directory
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo "🚀 Starting React development server..."
echo "📍 Frontend will be available at: http://localhost:3000"
echo "💡 Press Ctrl+C to stop the server"
echo ""

# Start the frontend
npm start