#!/bin/bash

echo "Starting KuCoin Trading Bot in Production Mode..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found!"
    echo "Please create .env file with required environment variables."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Build backend
echo "Building backend..."
cd backend
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "Error: Backend build failed!"
    exit 1
fi

# Build frontend
echo "Building frontend..."
cd ../frontend
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "Error: Frontend build failed!"
    exit 1
fi

# Start backend
echo "Starting backend server..."
cd ../backend
npm start &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend server..."
cd ../frontend
npm run preview &
FRONTEND_PID=$!

echo "Production servers started successfully!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait