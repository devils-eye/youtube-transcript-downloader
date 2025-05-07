#!/bin/bash

# YouTube Transcript Downloader Startup Script
# This script starts both the backend and frontend servers

# Text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== YouTube Transcript Downloader ===${NC}"
echo -e "${BLUE}Starting both backend and frontend servers...${NC}"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed. Please install Python 3 to run the backend.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js to run the frontend.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed. Please install npm to run the frontend.${NC}"
    exit 1
fi

# Create a function to handle cleanup when the script is terminated
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    
    # Kill all background processes
    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "${YELLOW}Stopping backend server (PID: $BACKEND_PID)${NC}"
        kill $BACKEND_PID 2>/dev/null
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "${YELLOW}Stopping frontend server (PID: $FRONTEND_PID)${NC}"
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    echo -e "${GREEN}All servers stopped. Goodbye!${NC}"
    exit 0
}

# Set up trap to catch SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Start the backend server
echo -e "${YELLOW}Starting backend server...${NC}"
cd backend

# Check if virtual environment exists, if not create it
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    pip install -r requirements.txt
fi

# Start the Flask app
echo -e "${GREEN}Starting Flask backend on http://localhost:5000${NC}"
python app.py &
BACKEND_PID=$!

# Go back to the root directory
cd ..

# Start the frontend server
echo -e "${YELLOW}Starting frontend server...${NC}"
cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Start the Next.js app
echo -e "${GREEN}Starting Next.js frontend on http://localhost:3000${NC}"
npm run dev &
FRONTEND_PID=$!

# Go back to the root directory
cd ..

echo -e "\n${GREEN}Both servers are now running!${NC}"
echo -e "${BLUE}Access the application at:${NC} ${GREEN}http://localhost:3000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Wait for both processes to finish (or until script is terminated)
wait $BACKEND_PID $FRONTEND_PID
