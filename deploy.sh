#!/bin/bash

# Quick deploy script for CareerPilot AI
# Usage: ./deploy.sh "your commit message"

set -e

echo "🚀 Starting deployment..."

# Check if message provided
if [ -z "$1" ]; then
  MESSAGE="chore: quick update"
else
  MESSAGE="$1"
fi

# Add all changes
echo "📦 Adding changes..."
git add -A

# Commit with message
echo "💾 Committing..."
git commit -m "$MESSAGE

Co-Authored-By: Claude <noreply@anthropic.com>" || echo "No changes to commit"

# Push to main
echo "⬆️  Pushing to GitHub..."
git push origin main

echo "✅ Done! Cloudflare will deploy in 1-2 minutes"
echo "🌐 Check: https://careerpil0t-ai.pages.dev/"
