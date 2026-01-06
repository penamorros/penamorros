#!/bin/bash

# Script to set up OpenAI API key in Netlify
# This script automates the setup process described in API_KEY_SECURITY.md

# API_KEY should be set as an environment variable or passed as argument
# Usage: API_KEY="your-key-here" ./setup-api-key.sh
# Or: ./setup-api-key.sh "your-key-here"
API_KEY="${1:-${API_KEY}}"

if [ -z "$API_KEY" ]; then
    echo "❌ Error: API key not provided"
    echo "Usage: API_KEY=\"your-key\" ./setup-api-key.sh"
    echo "   Or: ./setup-api-key.sh \"your-key\""
    exit 1
fi

echo "🔧 Setting up OpenAI API key in Netlify..."
echo ""

# Check if Netlify CLI is available (either installed or via npx)
if command -v netlify &> /dev/null; then
    NETLIFY_CMD="netlify"
elif command -v npx &> /dev/null; then
    NETLIFY_CMD="npx netlify-cli"
    echo "📦 Using Netlify CLI via npx..."
else
    echo "❌ Neither netlify CLI nor npx is available."
    echo "📦 Please install Node.js/npm first, or use the manual setup instructions."
    exit 1
fi

echo "🔐 Setting environment variable in Netlify..."
echo ""

# Set the OPENAI_API_KEY environment variable
$NETLIFY_CMD env:set OPENAI_API_KEY "$API_KEY" --context production

if [ $? -eq 0 ]; then
    echo "✅ Successfully set OPENAI_API_KEY in Netlify production environment"
else
    echo "⚠️  Could not set via CLI. You may need to:"
    echo "   1. Run 'netlify login' or 'npx netlify-cli login' to authenticate"
    echo "   2. Run 'netlify link' or 'npx netlify-cli link' to link your site"
    echo "   3. Or set it manually in Netlify Dashboard → Site settings → Environment variables"
    echo ""
    echo "📋 Manual Setup Instructions:"
    echo "   1. Go to https://app.netlify.com"
    echo "   2. Select your site"
    echo "   3. Go to Site settings → Environment variables"
    echo "   4. Click 'Add variable'"
    echo "   5. Key: OPENAI_API_KEY"
    echo "   6. Value: $API_KEY"
    echo "   7. Scope: Production (and other environments if needed)"
    echo "   8. Click 'Save'"
    echo "   9. IMPORTANT: Check if VITE_OPENAI_API_KEY exists and DELETE it if found!"
    exit 1
fi

echo ""
echo "🔍 Checking for VITE_OPENAI_API_KEY (should NOT exist)..."
$NETLIFY_CMD env:list | grep -i "VITE_OPENAI_API_KEY" && {
    echo "⚠️  WARNING: VITE_OPENAI_API_KEY found! This will expose your API key."
    echo "🗑️  Removing VITE_OPENAI_API_KEY..."
    $NETLIFY_CMD env:unset VITE_OPENAI_API_KEY --context production
    echo "✅ Removed VITE_OPENAI_API_KEY"
} || {
    echo "✅ VITE_OPENAI_API_KEY not found (good!)"
}

echo ""
echo "📋 Current environment variables:"
$NETLIFY_CMD env:list

echo ""
echo "✅ Setup complete! Your API key is now securely stored in Netlify."
echo "🚀 Next steps:"
echo "   1. Redeploy your site in Netlify Dashboard"
echo "   2. Or push a new commit to trigger automatic deployment"
echo ""
echo "🔒 Security check:"
echo "   - ✅ OPENAI_API_KEY is set (server-side only)"
echo "   - ✅ VITE_OPENAI_API_KEY is NOT set (prevents client-side exposure)"
