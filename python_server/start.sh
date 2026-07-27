#!/bin/bash
# ToolKit Local AI Server - Setup & Start
# This server provides free-forever AI inference for all ToolKit features.
# No API keys needed. No usage limits. Runs entirely on your machine.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "==================================="
echo " ToolKit Local AI Server"
echo " Free-forever AI inference"
echo "==================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required. Install it first."
    echo "  Ubuntu/Debian: sudo apt install python3 python3-pip"
    echo "  macOS: brew install python3"
    echo "  Windows: https://python.org/downloads"
    exit 1
fi

VENV_PATH="/tmp/tk-ai"

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_PATH" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv "$VENV_PATH"
fi

# Activate virtual environment
source "$VENV_PATH/bin/activate"

# Install dependencies
echo "Installing dependencies (first run may take a few minutes)..."
pip install -r requirements.txt -q

echo ""
echo "Starting server on http://localhost:8400"
echo "Press Ctrl+C to stop"
echo ""

# Start server
python server.py
