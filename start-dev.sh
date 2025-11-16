#!/bin/bash

echo "Starting KuCoin Trading Bot..."

# Start backend in background
## Try to free port 8080 if occupied
if command -v lsof >/dev/null 2>&1; then
	PIDS=$(lsof -ti:8080 || true)
	if [ -n "$PIDS" ]; then
		echo "Killing processes on port 8080: $PIDS"
		echo "$PIDS" | xargs -r kill -9
	fi
else
	# fallback using netstat
	NETPIDS=$(netstat -ano 2>/dev/null | grep ":8080" | awk '{print $NF}' | sort -u || true)
	if [ -n "$NETPIDS" ]; then
		echo "Killing processes on port 8080: $NETPIDS"
		echo "$NETPIDS" | xargs -r kill -9
	fi
fi

cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend in background
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "Both servers are starting..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
cleanup() {
	echo "Stopping servers..."
	kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
	# attempt to free port 8080
	if command -v lsof >/dev/null 2>&1; then
		lsof -ti:8080 | xargs -r kill -9 || true
	else
		netstat -ano 2>/dev/null | grep ":8080" | awk '{print $NF}' | sort -u | xargs -r kill -9 || true
	fi
	exit
}

trap cleanup INT
wait