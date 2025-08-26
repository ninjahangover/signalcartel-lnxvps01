#!/bin/bash

# SignalCartel OpenStatus Monitor - Systemd Service Installation
# This script installs the monitoring service as a systemd service for persistent operation

SERVICE_FILE="signalcartel-monitor.service"
SERVICE_PATH="/etc/systemd/system/$SERVICE_FILE"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔧 Installing SignalCartel OpenStatus Monitor as systemd service..."

# Check if running with sudo privileges
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script requires sudo privileges to install systemd service."
    echo "   Please run: sudo $0"
    exit 1
fi

# Copy service file
echo "📋 Copying service file to systemd directory..."
cp "$SCRIPT_DIR/$SERVICE_FILE" "$SERVICE_PATH"

# Set proper permissions
chmod 644 "$SERVICE_PATH"

# Create log files with proper ownership
echo "📝 Setting up log files..."
touch /var/log/signalcartel-monitor.log
touch /var/log/signalcartel-monitor-error.log
chown telgkb9:telgkb9 /var/log/signalcartel-monitor*.log

# Reload systemd daemon
echo "🔄 Reloading systemd daemon..."
systemctl daemon-reload

# Enable and start the service
echo "🚀 Enabling and starting the service..."
systemctl enable signalcartel-monitor.service
systemctl start signalcartel-monitor.service

# Check service status
echo ""
echo "📊 Service Status:"
systemctl status signalcartel-monitor.service --no-pager -l

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Useful commands:"
echo "   sudo systemctl status signalcartel-monitor    # Check status"
echo "   sudo systemctl restart signalcartel-monitor   # Restart service" 
echo "   sudo systemctl stop signalcartel-monitor      # Stop service"
echo "   sudo systemctl disable signalcartel-monitor   # Disable auto-start"
echo "   tail -f /var/log/signalcartel-monitor.log     # View logs"
echo "   journalctl -u signalcartel-monitor -f         # View systemd logs"