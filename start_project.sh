#!/bin/bash

BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
VENV_DIR="$BACKEND_DIR/venv"
BACKEND_PID=""

cleanup() {
  echo "Received interrupt."
  if [ ! -z "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null; then
    echo "Stopping backend (PID $BACKEND_PID)..."
    kill $BACKEND_PID
  else
    echo "Backend process not running or already stopped."
  fi
  exit 0
}

trap cleanup INT

echo "Starting project setup..."

if [ ! -d "$VENV_DIR" ]; then
  echo "Virtualenv not found. Creating virtualenv..."
  python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

if [ -f "$BACKEND_DIR/requirements.txt" ]; then
  pip install -r "$BACKEND_DIR/requirements.txt"
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  cd "$FRONTEND_DIR"
  npm install
  cd -
fi

# Use absolute path in backend launch script
cat > run_backend.sh <<EOF
#!/bin/bash
source $(pwd)/$VENV_DIR/bin/activate
cd $(pwd)/$BACKEND_DIR
flask run
EOF

chmod +x run_backend.sh

nohup ./run_backend.sh > project.log 2>&1 &

BACKEND_PID=$!
echo "Backend started with PID $BACKEND_PID"

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
while ! curl -s http://127.0.0.1:5000 > /dev/null; do
  echo -n "."
  sleep 1
done
echo "Backend is up!"

cd "$FRONTEND_DIR"

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "node_modules not found, installing frontend dependencies..."
  npm install
else
  echo "node_modules found, skipping npm install."
fi

# Start frontend server
npm start

echo "Frontend stopped, killing backend..."
cleanup

