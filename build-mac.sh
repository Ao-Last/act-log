#!/bin/bash

# Act Log - macOS Build Script
# This script automates the build process for macOS (arm64)

set -e  # Exit on error

echo "🚀 Act Log - macOS Build Script"
echo "================================"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: This script must be run on macOS"
    exit 1
fi

# Check environment variables
echo "📋 Checking environment variables..."
if [ -z "$APPLE_ID" ]; then
    echo "❌ Error: APPLE_ID is not set"
    echo "   Please set it in your ~/.zshrc or ~/.bash_profile:"
    echo "   export APPLE_ID=\"your-apple-id@example.com\""
    exit 1
fi

if [ -z "$APPLE_APP_SPECIFIC_PASSWORD" ]; then
    echo "❌ Error: APPLE_APP_SPECIFIC_PASSWORD is not set"
    echo "   Generate one at: https://appleid.apple.com/"
    echo "   Then set it in your ~/.zshrc or ~/.bash_profile:"
    echo "   export APPLE_APP_SPECIFIC_PASSWORD=\"xxxx-xxxx-xxxx-xxxx\""
    exit 1
fi

if [ -z "$APPLE_TEAM_ID" ]; then
    echo "❌ Error: APPLE_TEAM_ID is not set"
    echo "   Find it at: https://developer.apple.com/account#MembershipDetailsCard"
    echo "   Then set it in your ~/.zshrc or ~/.bash_profile:"
    echo "   export APPLE_TEAM_ID=\"A1B2C3D4E5\""
    exit 1
fi

echo "✅ Environment variables configured"
echo "   Apple ID: $APPLE_ID"
echo "   Team ID: $APPLE_TEAM_ID"
echo ""

# Check for signing certificate
echo "🔑 Checking for signing certificate..."
if ! security find-identity -v -p codesigning | grep -q "Developer ID Application"; then
    echo "❌ Error: No Developer ID Application certificate found"
    echo "   Please install your certificate from:"
    echo "   https://developer.apple.com/account/resources/certificates/list"
    exit 1
fi

CERT_NAME=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -n 1 | sed 's/.*"\(.*\)"/\1/')
echo "✅ Found certificate: $CERT_NAME"
echo ""

# Confirm build
echo "📦 Ready to build Act Log v$(node -p "require('./package.json').version")"
echo "   Target: macOS arm64 (Apple Silicon)"
echo "   Output: DMG and ZIP files"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Build cancelled"
    exit 0
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist out
echo "✅ Clean complete"
echo ""

# Build
echo "🔨 Building application..."
npm run build:mac:arm64

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📦 Output files:"
    echo "─────────────────────────────────────────────────"
    ls -lh dist/*.dmg dist/*.zip 2>/dev/null || echo "No files found"
    echo "─────────────────────────────────────────────────"
    echo ""
    echo "🎉 Ready for distribution!"
    echo ""
    echo "Next steps:"
    echo "  1. Test the .dmg file on a clean macOS system"
    echo "  2. Verify installation and first launch"
    echo "  3. Distribute via your preferred method"
else
    echo ""
    echo "❌ Build failed"
    echo "   Check the error messages above"
    exit 1
fi




