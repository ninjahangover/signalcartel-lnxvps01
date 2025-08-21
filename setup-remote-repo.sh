#!/bin/bash

echo "🎯 SignalCartel Repository Setup Script"
echo "======================================="
echo ""

# Check if .env.local exists and load Git credentials
if [ -f .env.local ]; then
    echo "📋 Loading credentials from .env.local..."
    source .env.local
fi

# Check current Git status
echo "📊 Current Git Status:"
echo "  Repository: $(pwd)"
echo "  Branch: $(git branch --show-current)"
echo "  Commits: $(git rev-list --count HEAD)"
echo "  User: $(git config user.name) <$(git config user.email)>"
echo ""

# Show available options
echo "🚀 Repository Setup Options:"
echo ""
echo "Option A - GitHub (most common):"
echo "  1. Go to https://github.com/new"
echo "  2. Repository name: signalcartel"
echo "  3. Make it Private (recommended)"
echo "  4. Don't initialize with README/gitignore"
echo "  5. Copy the repository URL"
echo ""

echo "Option B - GitLab:"
echo "  1. Go to https://gitlab.com/projects/new"
echo "  2. Project name: signalcartel"
echo "  3. Make it Private"
echo "  4. Don't initialize with README"
echo "  5. Copy the repository URL"
echo ""

echo "Option C - Other Git provider:"
echo "  1. Create repository named 'signalcartel'"
echo "  2. Copy the clone URL"
echo ""

# Function to add remote and push
setup_remote() {
    local repo_url="$1"
    
    echo "🔗 Adding remote repository..."
    git remote add origin "$repo_url"
    
    echo "📤 Pushing to remote repository..."
    git push -u origin main
    
    echo "✅ Repository setup complete!"
    echo "🌐 Your SignalCartel repository is now available at:"
    echo "   $repo_url"
    echo ""
    echo "📊 Repository contains:"
    echo "  • Complete trading system (454 files)"
    echo "  • Unified dashboard with real-time monitoring"
    echo "  • Container infrastructure"
    echo "  • Strategy execution engines"
    echo "  • NTFY alert system"
    echo "  • All 4 trading strategies"
}

# Check if user provided URL as argument
if [ "$1" ]; then
    echo "🔄 Setting up remote repository with provided URL: $1"
    setup_remote "$1"
else
    echo "💡 Usage Examples:"
    echo "  $0 https://github.com/yourusername/signalcartel.git"
    echo "  $0 https://gitlab.com/yourusername/signalcartel.git"
    echo ""
    echo "📝 Or if you have GIT_REMOTE_URL in .env.local:"
    if [ "$GIT_REMOTE_URL" ]; then
        echo "  Found GIT_REMOTE_URL: $GIT_REMOTE_URL"
        read -p "Use this URL? (y/N): " use_env_url
        if [[ $use_env_url =~ ^[Yy]$ ]]; then
            setup_remote "$GIT_REMOTE_URL"
        fi
    else
        echo "  Add GIT_REMOTE_URL to .env.local and run: $0"
    fi
fi