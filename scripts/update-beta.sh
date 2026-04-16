#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR"

if ! command -v git >/dev/null 2>&1; then
  echo "git is not installed. Install Xcode Command Line Tools first."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not available. Install Node.js first."
  exit 1
fi

echo "Pulling latest changes..."
git pull --ff-only

echo "Installing any updated dependencies..."
npm install

echo "Update complete."
echo "Run Start Golf Swing.command to launch the latest version."
