#!/bin/bash

# Script to set up mock data and start the development server

# Change to the project directory
cd "$(dirname "$0")/.."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Set up mock data in Supabase
echo "Setting up mock data in Supabase..."
node src/scripts/setupMockData.js

# Start the development server
echo "Starting development server..."
npm start
