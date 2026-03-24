#!/bin/bash

echo "========================================"
echo "Tyme Global Password Manager - Startup Script"
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "WARNING: Docker is not installed or not running!"
    echo ""
    echo "Please ensure PostgreSQL is running manually or:"
    echo "1. Install Docker from https://www.docker.com/"
    echo "2. Or install PostgreSQL manually"
    echo ""
    read -p "Press Enter to continue anyway..."
else
    echo "Starting PostgreSQL database..."
    docker compose up -d
    echo "Waiting for database to be ready..."
    sleep 5
    echo ""
fi

# Run migrations
echo "Checking database setup..."
npm run migrate --workspace=backend

if [ $? -eq 0 ]; then
    echo "Database migrations completed successfully!"
    echo ""

    echo "Creating initial admin user..."
    npm run seed --workspace=backend
    echo ""
fi

echo "========================================"
echo "Starting development servers..."
echo "========================================"
echo ""
echo "Frontend will be available at: http://localhost:3000"
echo "Backend will be available at: http://localhost:3001"
echo ""
echo "Default admin credentials:"
echo "  Username: admin"
echo "  Password: Admin123!"
echo ""
echo "Press Ctrl+C to stop the servers"
echo "========================================"
echo ""

npm run dev
