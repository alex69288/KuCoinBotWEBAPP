#!/bin/bash

echo "Starting KuCoin Trading Bot in Production Mode..."

# Prefer per-service env files: backend/.env and frontend/.env
if [ -f "backend/.env" ]; then
    echo "Loading environment variables from backend/.env"
    export $(grep -v '^#' backend/.env | xargs)
elif [ -f ".env" ]; then
    echo "Loading environment variables from root .env (deprecated)"
    export $(grep -v '^#' .env | xargs)
else
    echo "Error: No env file found (backend/.env or .env). Please create backend/.env with required variables."
    exit 1
fi

# Optionally load frontend env for build
if [ -f "frontend/.env" ]; then
    echo "Loading frontend env for build from frontend/.env"
    export $(grep -v '^#' frontend/.env | xargs)
fi

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