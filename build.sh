#!/bin/bash

# Exit on error
set -e

echo "Starting custom build process..."

# Clean previous build
rm -rf .next

# Set environment variables to skip linting
export SKIP_ENV_VALIDATION=true
export SKIP_LINTING=true

# Build Next.js without linting
echo "Building Next.js application..."
NODE_ENV=production npx next build --no-lint || NODE_ENV=production npx next build

echo "Build completed successfully!"
