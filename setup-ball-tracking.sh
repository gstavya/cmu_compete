#!/bin/bash

# Complete setup script for CMU Compete Ball Tracking System
# This script sets up both the Python backend and React frontend

echo "🏓 CMU Compete Ball Tracking Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "requirements.txt" ]; then
    print_error "Please run this script from the CMU Compete project root directory"
    exit 1
fi

print_status "Starting CMU Compete Ball Tracking setup..."

# Check Python installation
print_status "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3 first."
    exit 1
fi
print_success "Python 3 is installed"

# Check Node.js installation
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi
print_success "Node.js is installed"

# Setup Python environment
print_status "Setting up Python environment..."
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
fi

print_status "Activating virtual environment..."
source venv/bin/activate

print_status "Installing Python dependencies..."
pip install -r requirements.txt
print_success "Python dependencies installed"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p temp_uploads temp_outputs
print_success "Directories created"

# Setup Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install
print_success "Node.js dependencies installed"

print_success "Setup completed successfully!"
echo ""
print_status "To start the system:"
echo "  1. Start the Python tracking service: ./start-tracking-service.sh"
echo "  2. In a new terminal, start the React app: npm start"
echo ""
print_status "The system will be available at:"
echo "  • React Frontend: http://localhost:3000"
echo "  • Ball Tracking API: http://localhost:5001"
echo ""
print_warning "Make sure to start the Python service before uploading videos with tracking enabled!"
echo ""
print_status "For detailed instructions, see BALL-TRACKING-SETUP.md"
