#!/bin/bash

# Start the Python ball tracking service
# This script sets up and runs the Flask API for ball tracking

echo "🏓 Starting CMU Compete Ball Tracking Service..."
echo "================================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found. Please run this script from the project root directory."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p temp_uploads temp_outputs

# Start the Flask service
echo "🚀 Starting ball tracking API service on port 5001..."
echo "📡 API will be available at: http://localhost:5001"
echo "🔍 Health check endpoint: http://localhost:5001/health"
echo ""
echo "Press Ctrl+C to stop the service"
echo "================================================"

# Start the service
python src/services/tracking_api.py
