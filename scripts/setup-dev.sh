#!/bin/bash
# Development Environment Setup Script for FDX Resource API

set -e

echo "🚀 Setting up FDX Resource API development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js version must be 20 or higher. Current version: $(node --version)"
    exit 1
fi
print_status "Node.js version check passed: $(node --version)"

# Enable corepack and install pnpm
echo "📦 Setting up package manager..."
corepack enable
print_status "Corepack enabled"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
print_status "Dependencies installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cp .env.example .env
    print_status ".env file created from template"
else
    print_warning ".env file already exists, skipping creation"
fi

# Run initial build
echo "🔨 Building project..."
pnpm build
print_status "Project built successfully"

# Run tests to verify setup
echo "🧪 Running tests to verify setup..."
pnpm test:ci
print_status "All tests passed"

# Run linting
echo "🔍 Running code quality checks..."
pnpm lint
pnpm format:check
pnpm typecheck
print_status "Code quality checks passed"

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "Available commands:"
echo "  pnpm dev           # Start development server"
echo "  pnpm build         # Build for production"
echo "  pnpm test          # Run tests in watch mode"
echo "  pnpm test:ci       # Run tests once"
echo "  pnpm test:coverage # Run tests with coverage"
echo "  pnpm lint          # Run ESLint"
echo "  pnpm format        # Format code with Prettier"
echo ""
echo "🌐 The API will be available at: http://localhost:3000"
echo "📚 API documentation at: http://localhost:3000/docs"
echo ""
echo "To start development:"
echo "  pnpm dev"