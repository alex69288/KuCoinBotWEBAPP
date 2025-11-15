#!/bin/bash

echo "Starting KuCoin Trading Bot..."

# Start backend in background
cd backend && PORT=5000 npm run dev &
BACKEND_PID=$!

# Start frontend in background
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "Both servers are starting..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait