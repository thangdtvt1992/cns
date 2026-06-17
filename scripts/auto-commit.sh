#!/bin/bash
# Auto-commit script for VHF Coverage Simulation project
# Usage: Run this script manually whenever you make changes
# Or set up a cron job/task scheduler to run it periodically

cd "$(dirname "$0")" || exit 1

# Check if there are changes
if git diff-index --quiet HEAD --; then
    echo "✓ No changes to commit"
    exit 0
fi

# Stage all changes
git add -A

# Create commit with timestamp
COMMIT_MSG="auto: update project - $(date +'%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MSG"

# Push to remote
git push

echo "✓ Changes committed and pushed to GitHub"
